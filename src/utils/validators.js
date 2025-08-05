/**
 * Módulo de validadores para datos y formatos
 * Contiene funciones para validar diferentes tipos de datos utilizados en la aplicación
 */

const logger = require('./logger');

/**
 * Valida si una cadena es un SKU válido
 * @param {string} sku - SKU a validar
 * @returns {boolean} true si el SKU es válido
 */
function validarSku(sku) {
  if (!sku || typeof sku !== 'string') {
    logger.warn('SKU inválido: debe ser una cadena no vacía', { sku });
    return false;
  }
  
  // SKU debe tener al menos 10 caracteres y contener números
  const skuRegex = /^[A-Za-z0-9]{10,}$/;
  
  if (!skuRegex.test(sku)) {
    logger.warn('Formato de SKU inválido: debe contener al menos 10 caracteres alfanuméricos', { sku });
    return false;
  }
  
  return true;
}

/**
 * Valida si una cadena representa una fecha válida en formato chileno (dd-mm-aaaa)
 * @param {string} fecha - Fecha a validar
 * @returns {boolean} true si la fecha es válida
 */
function validarFechaChilena(fecha) {
  if (!fecha || typeof fecha !== 'string') {
    logger.warn('Fecha inválida: debe ser una cadena no vacía', { fecha });
    return false;
  }
  
  // Regex para formato dd-mm-aaaa
  const fechaRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
  const match = fecha.match(fechaRegex);
  
  if (!match) {
    logger.warn('Formato de fecha inválido: debe ser dd-mm-aaaa', { fecha });
    return false;
  }
  
  const [, dia, mes, ano] = match;
  const diaNum = parseInt(dia, 10);
  const mesNum = parseInt(mes, 10);
  const anoNum = parseInt(ano, 10);
  
  // Validar rangos básicos
  if (diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12 || anoNum < 2000 || anoNum > 2100) {
    logger.warn('Fecha fuera de rango válido', { fecha, dia: diaNum, mes: mesNum, ano: anoNum });
    return false;
  }
  
  // Crear objeto Date para validación más precisa
  const fechaObj = new Date(anoNum, mesNum - 1, diaNum);
  
  if (fechaObj.getFullYear() !== anoNum || 
      fechaObj.getMonth() !== mesNum - 1 || 
      fechaObj.getDate() !== diaNum) {
    logger.warn('Fecha inválida según calendario', { fecha });
    return false;
  }
  
  return true;
}

/**
 * Valida si una URL es válida
 * @param {string} url - URL a validar
 * @returns {boolean} true si la URL es válida
 */
function validarUrl(url) {
  if (!url || typeof url !== 'string') {
    logger.warn('URL inválida: debe ser una cadena no vacía', { url });
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch (error) {
    logger.warn('Formato de URL inválido', { url, error: error.message });
    return false;
  }
}

/**
 * Valida si un email tiene formato válido
 * @param {string} email - Email a validar
 * @returns {boolean} true si el email es válido
 */
function validarEmail(email) {
  if (!email || typeof email !== 'string') {
    logger.warn('Email inválido: debe ser una cadena no vacía', { email });
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    logger.warn('Formato de email inválido', { email });
    return false;
  }
  
  return true;
}

/**
 * Valida las credenciales de login
 * @param {Object} credenciales - Objeto con email y password
 * @returns {boolean} true si las credenciales son válidas
 */
function validarCredenciales(credenciales) {
  if (!credenciales || typeof credenciales !== 'object') {
    logger.error('Credenciales inválidas: debe ser un objeto');
    return false;
  }
  
  const { email, password } = credenciales;
  
  if (!validarEmail(email)) {
    return false;
  }
  
  if (!password || typeof password !== 'string' || password.length < 6) {
    logger.warn('Password inválido: debe tener al menos 6 caracteres');
    return false;
  }
  
  return true;
}

/**
 * Valida la estructura de un resultado
 * @param {Object} resultado - Objeto resultado a validar
 * @returns {boolean} true si la estructura es válida
 */
function validarEstructuraResultado(resultado) {
  if (!resultado || typeof resultado !== 'object') {
    logger.error('Resultado inválido: debe ser un objeto');
    return false;
  }
  
  const camposRequeridos = ['sku', 'fecha_compromiso', 'estado', 'timestamp'];
  
  for (const campo of camposRequeridos) {
    if (!(campo in resultado)) {
      logger.error(`Campo requerido faltante en resultado: ${campo}`, resultado);
      return false;
    }
  }
  
  // Validar tipos específicos
  if (!validarSku(resultado.sku)) {
    return false;
  }
  
  if (resultado.fecha_compromiso && !validarFechaChilena(resultado.fecha_compromiso)) {
    return false;
  }
  
  if (!resultado.estado || typeof resultado.estado !== 'string') {
    logger.warn('Estado inválido: debe ser una cadena no vacía', { estado: resultado.estado });
    return false;
  }
  
  if (!resultado.timestamp || typeof resultado.timestamp !== 'string') {
    logger.warn('Timestamp inválido: debe ser una cadena no vacía', { timestamp: resultado.timestamp });
    return false;
  }
  
  return true;
}

/**
 * Formatea una fecha de Date a formato chileno (dd-mm-aaaa)
 * @param {Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en formato chileno
 */
function formatearFechaChilena(fecha) {
  if (!fecha || !(fecha instanceof Date)) {
    logger.warn('Fecha inválida para formatear', { fecha });
    return '';
  }
  
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const ano = fecha.getFullYear().toString();
  
  return `${dia}-${mes}-${ano}`;
}

/**
 * Genera un timestamp en formato chileno
 * @returns {string} Timestamp formateado
 */
function generarTimestamp() {
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
 * Sanitiza un texto removiendo caracteres especiales y espacios extra
 * @param {string} texto - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
function sanitizarTexto(texto) {
  if (!texto || typeof texto !== 'string') {
    return '';
  }
  
  return texto
    .trim()
    .replace(/\s+/g, ' ')  // Múltiples espacios por uno solo
    .replace(/[^\w\s\-:/.,áéíóúÁÉÍÓÚñÑ]/g, ''); // Solo caracteres válidos
}

/**
 * Valida si un timeout es válido
 * @param {number} timeout - Timeout en milisegundos
 * @returns {boolean} true si el timeout es válido
 */
function validarTimeout(timeout) {
  if (typeof timeout !== 'number' || timeout < 1000 || timeout > 300000) {
    logger.warn('Timeout inválido: debe estar entre 1000 y 300000 ms', { timeout });
    return false;
  }
  
  return true;
}

module.exports = {
  validarSku,
  validarFechaChilena,
  validarUrl,
  validarEmail,
  validarCredenciales,
  validarEstructuraResultado,
  formatearFechaChilena,
  generarTimestamp,
  sanitizarTexto,
  validarTimeout
};
