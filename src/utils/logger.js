/**
 * Sistema de logging para la aplicación
 * Proporciona funciones de logging con diferentes niveles de severidad
 */

/**
 * Niveles de logging disponibles
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Nivel de logging actual (desde variable de entorno o INFO por defecto)
 */
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * Formatea la fecha y hora actual
 * @returns {string} Fecha y hora formateada
 */
function obtenerTimestamp() {
  return new Date().toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Función base para logging
 * @param {string} level - Nivel de logging
 * @param {string} emoji - Emoji para el nivel
 * @param {string} message - Mensaje principal
 * @param {any} data - Datos adicionales (opcional)
 */
function log(level, emoji, message, data = null) {
  const levelValue = LOG_LEVELS[level];
  
  if (levelValue <= CURRENT_LOG_LEVEL) {
    const timestamp = obtenerTimestamp();
    const prefix = `[${timestamp}] ${emoji}`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
}

/**
 * Logging de errores críticos
 * @param {string} message - Mensaje de error
 * @param {Error|any} error - Objeto error o datos adicionales
 */
function error(message, error = null) {
  log('ERROR', '❌', message, error);
}

/**
 * Logging de advertencias
 * @param {string} message - Mensaje de advertencia
 * @param {any} data - Datos adicionales (opcional)
 */
function warn(message, data = null) {
  log('WARN', '⚠️', message, data);
}

/**
 * Logging de información general
 * @param {string} message - Mensaje informativo
 * @param {any} data - Datos adicionales (opcional)
 */
function info(message, data = null) {
  log('INFO', 'ℹ️', message, data);
}

/**
 * Logging de progreso de operaciones
 * @param {string} message - Mensaje de progreso
 */
function progress(message) {
  log('INFO', '🔄', message);
}

/**
 * Logging de éxito de operaciones
 * @param {string} message - Mensaje de éxito
 * @param {any} data - Datos adicionales (opcional)
 */
function success(message, data = null) {
  log('INFO', '✅', message, data);
}

/**
 * Logging de debug (solo visible con LOG_LEVEL=DEBUG)
 * @param {string} message - Mensaje de debug
 * @param {any} data - Datos adicionales (opcional)
 */
function debug(message, data = null) {
  log('DEBUG', '🐛', message, data);
}

/**
 * Logging de inicio de operación
 * @param {string} operation - Nombre de la operación
 */
function startOperation(operation) {
  log('INFO', '🚀', `Iniciando: ${operation}`);
}

/**
 * Logging de finalización de operación
 * @param {string} operation - Nombre de la operación
 * @param {number} duration - Duración en milisegundos (opcional)
 */
function endOperation(operation, duration = null) {
  const durationText = duration ? ` (${duration}ms)` : '';
  log('INFO', '🏁', `Completado: ${operation}${durationText}`);
}

/**
 * Logging de resultado final del proceso
 * @param {Object} resultado - Objeto con los resultados
 */
function logResultado(resultado) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO FINAL');
  console.log('='.repeat(60));
  
  resultado.forEach((item, index) => {
    console.log(`\n[${index + 1}] SKU: ${item.sku}`);
    console.log(`    📅 Fecha de compromiso: ${item.fecha_compromiso}`);
    console.log(`    📋 Estado: ${item.estado}`);
    console.log(`    ⏰ Timestamp: ${item.timestamp}`);
  });
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Crea un separador visual en los logs
 * @param {string} title - Título de la sección (opcional)
 */
function separator(title = null) {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
    console.log('\n' + '-'.repeat(50));
    if (title) {
      console.log(`📋 ${title.toUpperCase()}`);
      console.log('-'.repeat(50));
    }
  }
}

module.exports = {
  error,
  warn,
  info,
  progress,
  success,
  debug,
  startOperation,
  endOperation,
  logResultado,
  separator,
  LOG_LEVELS,
  CURRENT_LOG_LEVEL
};
