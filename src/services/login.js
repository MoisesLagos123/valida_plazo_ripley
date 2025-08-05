/**
 * Servicio de autenticación en Ripley.cl con evasión anti-bot
 * Maneja el proceso de login en la plataforma evitando detección
 */

const logger = require('../utils/logger');
const validators = require('../utils/validators');
const { esperarElementoConRetry, simularComportamientoHumano, navegarComoHumano } = require('../config/playwright');

/**
 * Credenciales predefinidas para Ripley
 */
const CREDENCIALES_RIPLEY = {
  email: 'devscrap2025@gmail.com',
  password: 'Dev20252025.'
};

/**
 * Inicia sesión en Ripley.cl con comportamiento humano
 * @param {Object} page - Página de Playwright
 * @param {Object} credenciales - Credenciales de login (opcional)
 * @returns {Promise<boolean>} true si el login fue exitoso
 */
async function iniciarSesion(page, credenciales = CREDENCIALES_RIPLEY) {
  const startTime = Date.now();
  logger.startOperation('Proceso de autenticación en Ripley con evasión anti-bot');
  
  try {
    // Validar credenciales
    if (!validators.validarCredenciales(credenciales)) {
      throw new Error('Credenciales inválidas proporcionadas');
    }
    
    logger.info('Navegando a la página principal de Ripley...');
    
    // Navegar a la página principal con comportamiento humano
    const baseUrl = process.env.RIPLEY_BASE_URL || 'https://www.ripley.cl';
    await navegarComoHumano(page, baseUrl);
    
    // Verificar si hay bloqueo anti-bot
    const hayBloqueo = await verificarBloqueoAntiBot(page);
    if (hayBloqueo) {
      logger.warn('⚠️ Detectado bloqueo anti-bot, esperando y reintentando...');
      await manejarBloqueoAntiBot(page);
    }
    
    logger.progress('Página cargada, buscando botón de login...');
    
    // Simular comportamiento humano antes de buscar login
    await simularComportamientoHumano(page);
    
    // Buscar y hacer clic en el botón de login
    const botonLoginEncontrado = await buscarBotonLogin(page);
    if (!botonLoginEncontrado) {
      throw new Error('No se pudo encontrar el botón de login en la página');
    }
    
    // Esperar a que aparezca el formulario de login
    logger.progress('Esperando formulario de login...');
    await page.waitForTimeout(3000 + Math.random() * 2000); // Tiempo variable
    
    // Verificar nuevamente si hay bloqueo después del clic
    const hayBloqueoPostLogin = await verificarBloqueoAntiBot(page);
    if (hayBloqueoPostLogin) {
      logger.warn('⚠️ Bloqueo detectado después de hacer clic en login');
      await manejarBloqueoAntiBot(page);
    }
    
    // Rellenar credenciales con comportamiento humano
    await rellenarCredencialesHumano(page, credenciales);
    
    // Enviar formulario
    await enviarFormularioLogin(page);
    
    // Verificar login exitoso
    const loginExitoso = await verificarLoginExitoso(page);
    
    const duration = Date.now() - startTime;
    
    if (loginExitoso) {
      logger.endOperation('Proceso de autenticación en Ripley', duration);
      logger.success('✅ Login exitoso en Ripley.cl');
      return true;
    } else {
      throw new Error('Login fallido - No se pudo verificar la autenticación');
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('❌ Error durante el proceso de login', {
      error: error.message,
      duration: `${duration}ms`,
      credenciales: { email: credenciales.email, password: '***' }
    });
    
    // Capturar screenshot en caso de error
    try {
      await page.screenshot({ 
        path: `error-login-${Date.now()}.png`, 
        fullPage: true 
      });
      logger.info('Screenshot de error guardado para debugging');
    } catch (screenshotError) {
      logger.warn('No se pudo capturar screenshot de error');
    }
    
    return false;
  }
}

/**
 * Verifica si hay bloqueo anti-bot en la página
 * @param {Object} page - Página de Playwright
 * @returns {Promise<boolean>} true si hay bloqueo
 */
async function verificarBloqueoAntiBot(page) {
  const indicadoresBloqueo = [
    'text="¡Alto, no puedes acceder!"',
    'text="vuelve a intentarlo"',
    'text="¿Por qué me han bloqueado?"',
    'text="servicio de seguridad"',
    'text="ataques en línea"',
    '.challenge-form',
    '.cf-error-title',
    '#challenge-form',
    '.ray-id'
  ];
  
  for (const selector of indicadoresBloqueo) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 2000 })) {
        logger.warn(`Bloqueo anti-bot detectado: ${selector}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Verificar título de la página
  const titulo = await page.title();
  if (titulo.includes('Access denied') || titulo.includes('Acceso denegado') || titulo.includes('Blocked')) {
    logger.warn(`Bloqueo detectado en título: ${titulo}`);
    return true;
  }
  
  return false;
}

/**
 * Maneja el bloqueo anti-bot con estrategias de evasión
 * @param {Object} page - Página de Playwright
 */
async function manejarBloqueoAntiBot(page) {
  logger.info('🤖 Aplicando estrategias de evasión anti-bot...');
  
  // Estrategia 1: Esperar tiempo aleatorio
  const tiempoEspera = 10000 + Math.random() * 15000; // Entre 10-25 segundos
  logger.info(`⏱️ Esperando ${Math.round(tiempoEspera/1000)} segundos...`);
  await page.waitForTimeout(tiempoEspera);
  
  // Estrategia 2: Simular actividad humana intensa
  await simularActividadHumanaIntensa(page);
  
  // Estrategia 3: Refrescar la página
  logger.info('🔄 Refrescando página...');
  await page.reload({ waitUntil: 'networkidle' });
  
  // Esperar tiempo adicional después del refresh
  await page.waitForTimeout(5000 + Math.random() * 5000);
}

/**
 * Simula actividad humana intensa para evadir detección
 * @param {Object} page - Página de Playwright
 */
async function simularActividadHumanaIntensa(page) {
  const viewport = page.viewportSize();
  
  // Múltiples movimientos de mouse
  for (let i = 0; i < 5; i++) {
    await page.mouse.move(
      Math.random() * viewport.width,
      Math.random() * viewport.height,
      { steps: Math.floor(Math.random() * 20) + 10 }
    );
    await page.waitForTimeout(Math.random() * 1000 + 500);
  }
  
  // Scroll aleatorio
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, Math.random() * 500 - 250);
    });
    await page.waitForTimeout(Math.random() * 1000 + 500);
  }
  
  // Clicks aleatorios en áreas seguras
  try {
    await page.click('body', { force: true });
    await page.waitForTimeout(Math.random() * 1000 + 500);
  } catch (error) {
    // Ignorar errores de click
  }
}

/**
 * Busca y hace clic en el botón de login con comportamiento humano
 * @param {Object} page - Página de Playwright
 * @returns {Promise<boolean>} true si encontró y clickeó el botón
 */
async function buscarBotonLogin(page) {
  const selectoresPosibles = [
    'a[href*="login"]',
    'button[aria-label*="login"]',
    '.login-button',
    '[data-test="login-button"]',
    'a:has-text("Iniciar Sesión")',
    'a:has-text("Ingresar")',
    'button:has-text("Login")',
    '.user-access',
    '.account-access',
    '.header-login',
    '.login-link'
  ];
  
  for (const selector of selectoresPosibles) {
    try {
      logger.debug(`Buscando botón login con selector: ${selector}`);
      
      // Simular comportamiento humano antes de cada búsqueda
      await simularComportamientoHumano(page);
      
      const elemento = await page.locator(selector).first();
      
      if (await elemento.isVisible({ timeout: 3000 })) {
        logger.info(`Botón de login encontrado con selector: ${selector}`);
        
        // Hover antes de hacer clic
        await elemento.hover();
        await page.waitForTimeout(Math.random() * 1000 + 500);
        
        // Click con comportamiento humano
        await elemento.click();
        
        // Esperar después del click
        await page.waitForTimeout(Math.random() * 2000 + 1000);
        
        return true;
      }
    } catch (error) {
      logger.debug(`Selector ${selector} no encontrado, probando siguiente...`);
      continue;
    }
  }
  
  return false;
}

/**
 * Rellena las credenciales simulando escritura humana
 * @param {Object} page - Página de Playwright
 * @param {Object} credenciales - Email y password
 */
async function rellenarCredencialesHumano(page, credenciales) {
  logger.progress('Rellenando credenciales con comportamiento humano...');
  
  // Buscar campos con comportamiento humano
  const campoEmail = await buscarCampoEmail(page);
  if (!campoEmail) {
    throw new Error('No se pudo encontrar el campo de email');
  }
  
  const campoPassword = await buscarCampoPassword(page);
  if (!campoPassword) {
    throw new Error('No se pudo encontrar el campo de password');
  }
  
  // Simular escritura humana en email
  await simularEscrituraHumana(campoEmail, credenciales.email);
  logger.debug('Email ingresado con escritura humana');
  
  // Pausa entre campos
  await page.waitForTimeout(Math.random() * 1000 + 500);
  
  // Simular escritura humana en password
  await simularEscrituraHumana(campoPassword, credenciales.password);
  logger.debug('Password ingresado con escritura humana');
  
  // Pausa final
  await page.waitForTimeout(Math.random() * 2000 + 1000);
}

/**
 * Simula escritura humana en un campo
 * @param {Object} campo - Elemento del campo
 * @param {string} texto - Texto a escribir
 */
async function simularEscrituraHumana(campo, texto) {
  // Hacer clic en el campo
  await campo.click();
  await campo.fill(''); // Limpiar
  
  // Escribir con delays variables entre caracteres
  for (const char of texto) {
    await campo.type(char, { delay: Math.random() * 100 + 50 });
  }
  
  // Pequeña pausa al final
  await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
}

/**
 * Busca el campo de email con múltiples estrategias
 * @param {Object} page - Página de Playwright
 * @returns {Promise<Object|null>} Elemento del campo de email o null
 */
async function buscarCampoEmail(page) {
  const selectoresEmail = [
    'input[type="email"]',
    'input[name*="email"]',
    'input[id*="email"]',
    'input[placeholder*="email"]',
    'input[placeholder*="correo"]',
    'input[placeholder*="usuario"]',
    '.email-input input',
    '.login-email input',
    '[data-test="email-input"]'
  ];
  
  for (const selector of selectoresEmail) {
    try {
      await simularComportamientoHumano(page);
      
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 2000 })) {
        logger.debug(`Campo email encontrado: ${selector}`);
        return elemento;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Busca el campo de password con múltiples estrategias
 * @param {Object} page - Página de Playwright
 * @returns {Promise<Object|null>} Elemento del campo de password o null
 */
async function buscarCampoPassword(page) {
  const selectoresPassword = [
    'input[type="password"]',
    'input[name*="password"]',
    'input[id*="password"]',
    'input[placeholder*="contraseña"]',
    'input[placeholder*="clave"]',
    '.password-input input',
    '.login-password input',
    '[data-test="password-input"]'
  ];
  
  for (const selector of selectoresPassword) {
    try {
      await simularComportamientoHumano(page);
      
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 2000 })) {
        logger.debug(`Campo password encontrado: ${selector}`);
        return elemento;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Envía el formulario de login con comportamiento humano
 * @param {Object} page - Página de Playwright
 */
async function enviarFormularioLogin(page) {
  logger.progress('Enviando formulario de login...');
  
  const selectoresSubmit = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Iniciar")',
    'button:has-text("Ingresar")',
    'button:has-text("Login")',
    '.login-submit',
    '.btn-login',
    '[data-test="login-submit"]'
  ];
  
  for (const selector of selectoresSubmit) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 3000 })) {
        logger.debug(`Botón submit encontrado: ${selector}`);
        
        // Hover antes de hacer clic
        await elemento.hover();
        await page.waitForTimeout(Math.random() * 500 + 300);
        
        // Click con comportamiento humano
        await elemento.click();
        
        // Esperar a que se procese el login
        await page.waitForTimeout(Math.random() * 2000 + 3000);
        return;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Si no encuentra botón submit, intentar enviar con Enter
  logger.warn('No se encontró botón submit, intentando con Enter...');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(Math.random() * 2000 + 3000);
}

/**
 * Verifica si el login fue exitoso
 * @param {Object} page - Página de Playwright
 * @returns {Promise<boolean>} true si el login fue exitoso
 */
async function verificarLoginExitoso(page) {
  logger.progress('Verificando estado de login...');
  
  // Verificar si hay mensaje de error
  const hayError = await verificarMensajeError(page);
  if (hayError) {
    return false;
  }
  
  // Verificar si aún hay bloqueo
  const hayBloqueo = await verificarBloqueoAntiBot(page);
  if (hayBloqueo) {
    logger.warn('Aún hay bloqueo anti-bot activo');
    return false;
  }
  
  // Buscar indicadores de usuario logueado
  const indicadoresLogin = [
    '.user-menu',
    '.account-menu',
    '[data-test="user-logged"]',
    '.mi-cuenta',
    '.user-info',
    '.logout-button',
    'a[href*="logout"]',
    'a:has-text("Cerrar Sesión")',
    '.user-name',
    '.account-link'
  ];
  
  for (const selector of indicadoresLogin) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 8000 })) {
        logger.debug(`Indicador de login exitoso encontrado: ${selector}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Verificar cambio en la URL que indique login exitoso
  const urlActual = page.url();
  if (urlActual.includes('account') || urlActual.includes('mi-cuenta') || 
      (urlActual.includes('ripley.cl') && !urlActual.includes('login'))) {
    logger.debug('Login verificado por cambio de URL');
    return true;
  }
  
  return false;
}

/**
 * Verifica si hay mensajes de error en el login
 * @param {Object} page - Página de Playwright
 * @returns {Promise<boolean>} true si hay errores
 */
async function verificarMensajeError(page) {
  const selectoresError = [
    '.error-message',
    '.alert-danger',
    '.login-error',
    '[data-test="error-message"]',
    '.field-error',
    '.form-error',
    '.invalid-feedback',
    '.error-text'
  ];
  
  for (const selector of selectoresError) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 2000 })) {
        const textoError = await elemento.textContent();
        logger.error('Mensaje de error encontrado en login', { 
          selector, 
          mensaje: textoError 
        });
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  return false;
}

module.exports = {
  iniciarSesion,
  CREDENCIALES_RIPLEY
};
