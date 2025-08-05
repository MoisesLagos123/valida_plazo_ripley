/**
 * Controlador principal - Validador de Plazos de Entrega Ripley
 * Orquesta todo el flujo de validación de fechas de compromiso
 */

require('dotenv').config();

const logger = require('./utils/logger');
const validators = require('./utils/validators');
const { inicializarNavegador, cerrarNavegador } = require('./config/playwright');
const { iniciarSesion, CREDENCIALES_RIPLEY } = require('./services/login');
const { buscarYAgregarProducto, SKU_OBJETIVO } = require('./services/buscarSku');
const { obtenerFechaCompromiso } = require('./services/carrito');

/**
 * Configuración principal de la aplicación
 */
const CONFIG = {
  sku: process.env.TARGET_SKU || SKU_OBJETIVO,
  maxReintentos: parseInt(process.env.MAX_RETRIES) || 3,
  delayReintento: parseInt(process.env.RETRY_DELAY) || 2000
};

/**
 * Función principal que ejecuta todo el flujo de validación
 */
async function main() {
  const startTime = Date.now();
  let browser = null;
  
  try {
    // Banner de inicio
    mostrarBannerInicio();
    
    // Validar configuración
    validarConfiguracion();
    
    // Inicializar navegador
    logger.separator('INICIALIZACIÓN');
    const { browser: navegador, page } = await inicializarNavegador();
    browser = navegador;
    
    // Ejecutar flujo principal con reintentos
    const resultados = await ejecutarFlujoConReintentos(page, CONFIG.sku);
    
    // Mostrar resultados finales
    const duration = Date.now() - startTime;
    mostrarResultadosFinales(resultados, duration);
    
  } catch (error) {
    logger.error('❌ Error crítico en la aplicación', {
      error: error.message,
      stack: error.stack
    });
    
    process.exit(1);
    
  } finally {
    // Limpiar recursos
    if (browser) {
      await cerrarNavegador(browser);
    }
    
    logger.info('🏁 Aplicación finalizada');
  }
}

/**
 * Muestra el banner de inicio de la aplicación
 */
function mostrarBannerInicio() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 VALIDADOR DE PLAZOS DE ENTREGA RIPLEY');
  console.log('='.repeat(70));
  console.log('📅 Automatización de extracción de fechas de compromiso');
  console.log('🛒 SKU objetivo:', CONFIG.sku);
  console.log('⚙️ Configuración cargada correctamente');
  console.log('='.repeat(70) + '\n');
}

/**
 * Valida la configuración inicial de la aplicación
 */
function validarConfiguracion() {
  logger.startOperation('Validación de configuración');
  
  // Validar SKU objetivo
  if (!validators.validarSku(CONFIG.sku)) {
    throw new Error(`SKU objetivo inválido: ${CONFIG.sku}`);
  }
  
  // Validar credenciales
  if (!validators.validarCredenciales(CREDENCIALES_RIPLEY)) {
    throw new Error('Credenciales de Ripley inválidas');
  }
  
  // Validar configuración de reintentos
  if (CONFIG.maxReintentos < 1 || CONFIG.maxReintentos > 10) {
    throw new Error('Número de reintentos debe estar entre 1 y 10');
  }
  
  if (CONFIG.delayReintento < 1000 || CONFIG.delayReintento > 10000) {
    throw new Error('Delay de reintento debe estar entre 1000 y 10000 ms');
  }
  
  logger.success('✅ Configuración validada correctamente');
}

/**
 * Ejecuta el flujo principal con sistema de reintentos
 * @param {Object} page - Página de Playwright
 * @param {string} sku - SKU del producto
 * @returns {Promise<Array>} Array con los resultados
 */
async function ejecutarFlujoConReintentos(page, sku) {
  let ultimoError = null;
  
  for (let intento = 1; intento <= CONFIG.maxReintentos; intento++) {
    try {
      logger.separator(`INTENTO ${intento}/${CONFIG.maxReintentos}`);
      
      const resultado = await ejecutarFlujoPrincipal(page, sku);
      
      // Si llegamos aquí, el flujo fue exitoso
      logger.success(`✅ Flujo completado exitosamente en intento ${intento}`);
      return [resultado];
      
    } catch (error) {
      ultimoError = error;
      logger.error(`❌ Intento ${intento} fallido`, {
        error: error.message,
        intentosRestantes: CONFIG.maxReintentos - intento
      });
      
      // Si no es el último intento, esperar antes de reintentar
      if (intento < CONFIG.maxReintentos) {
        logger.info(`⏳ Esperando ${CONFIG.delayReintento}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayReintento));
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  logger.error(`❌ Todos los intentos (${CONFIG.maxReintentos}) han fallado`);
  
  // Crear resultado de error
  return [{
    sku: sku,
    fecha_compromiso: '',
    estado: `Error: ${ultimoError?.message || 'Error desconocido'}`,
    timestamp: validators.generarTimestamp()
  }];
}

/**
 * Ejecuta el flujo principal de la aplicación
 * @param {Object} page - Página de Playwright
 * @param {string} sku - SKU del producto
 * @returns {Promise<Object>} Resultado del flujo
 */
async function ejecutarFlujoPrincipal(page, sku) {
  // Paso 1: Autenticación
  logger.separator('AUTENTICACIÓN');
  const loginExitoso = await iniciarSesion(page, CREDENCIALES_RIPLEY);
  
  if (!loginExitoso) {
    throw new Error('Fallo en la autenticación en Ripley.cl');
  }
  
  // Paso 2: Búsqueda y adición del producto
  logger.separator('BÚSQUEDA DE PRODUCTO');
  const resultadoBusqueda = await buscarYAgregarProducto(page, sku);
  
  if (!resultadoBusqueda.exito) {
    throw new Error(resultadoBusqueda.mensaje);
  }
  
  // Paso 3: Extracción de fecha de compromiso
  logger.separator('EXTRACCIÓN DE FECHA');
  const fechaCompromiso = await obtenerFechaCompromiso(page);
  
  if (!fechaCompromiso) {
    throw new Error('No se pudo extraer la fecha de compromiso de entrega');
  }
  
  // Crear resultado final
  const resultado = {
    sku: sku,
    fecha_compromiso: fechaCompromiso,
    estado: 'Producto agregado con éxito',
    timestamp: validators.generarTimestamp()
  };
  
  // Validar estructura del resultado
  if (!validators.validarEstructuraResultado(resultado)) {
    throw new Error('Estructura de resultado inválida');
  }
  
  return resultado;
}

/**
 * Muestra los resultados finales de la ejecución
 * @param {Array} resultados - Array con los resultados
 * @param {number} duration - Duración total en milisegundos
 */
function mostrarResultadosFinales(resultados, duration) {
  logger.separator('RESULTADOS FINALES');
  
  // Log estructurado de resultados
  logger.logResultado(resultados);
  
  // Estadísticas de ejecución
  console.log('\n📊 ESTADÍSTICAS DE EJECUCIÓN');
  console.log('-'.repeat(50));
  console.log(`⏱️ Tiempo total: ${Math.round(duration / 1000)}s (${duration}ms)`);
  console.log(`📦 SKUs procesados: ${resultados.length}`);
  
  const exitosos = resultados.filter(r => r.estado === 'Producto agregado con éxito').length;
  const fallidos = resultados.length - exitosos;
  
  console.log(`✅ Exitosos: ${exitosos}`);
  console.log(`❌ Fallidos: ${fallidos}`);
  console.log(`📈 Tasa de éxito: ${Math.round((exitosos / resultados.length) * 100)}%`);
  
  // Consejos y siguientes pasos
  if (fallidos > 0) {
    console.log('\n💡 RECOMENDACIONES:');
    console.log('• Verificar disponibilidad del producto en Ripley.cl');
    console.log('• Revisar logs de error para más detalles');
    console.log('• Considerar ejecutar nuevamente en unos minutos');
  }
  
  console.log('\n' + '='.repeat(70));
}

/**
 * Manejo de señales del sistema para cleanup
 */
process.on('SIGINT', async () => {
  logger.warn('⚠️ Interrupción detectada (Ctrl+C)');
  logger.info('🧹 Cerrando aplicación de forma segura...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.warn('⚠️ Terminación detectada');
  logger.info('🧹 Cerrando aplicación de forma segura...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Promesa rechazada no manejada', {
    reason: reason?.message || reason,
    promise: promise.toString()
  });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Excepción no capturada', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Ejecutar aplicación solo si este archivo es ejecutado directamente
if (require.main === module) {
  main().catch(error => {
    logger.error('❌ Error no capturado en main()', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}

module.exports = {
  main,
  ejecutarFlujoPrincipal,
  CONFIG
};
