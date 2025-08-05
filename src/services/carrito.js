/**
 * Servicio de gestión del carrito de compras
 * Maneja la navegación al carrito y extracción de fechas de compromiso
 */

const logger = require('../utils/logger');
const validators = require('../utils/validators');
const { esperarElementoConRetry } = require('../config/playwright');

/**
 * Selectores CSS para el carrito de compras
 */
const SELECTORES = {
  iconoCarrito: '.cart-icon, .shopping-cart, .basket-icon, [data-test="cart-icon"], a[href*="cart"]',
  contadorCarrito: '.cart-count, .cart-counter, .basket-count, [data-test="cart-count"]',
  itemsCarrito: '.cart-item, .basket-item, .checkout-item, [data-test="cart-item"]',
  fechaEntrega: '.delivery-date, .shipping-date, .fecha-entrega, [data-test="delivery-date"]',
  fechaCompromiso: '.commitment-date, .fecha-compromiso, .delivery-commitment, [data-test="commitment-date"]',
  infoEnvio: '.shipping-info, .delivery-info, .envio-info, [data-test="shipping-info"]',
  resumenCarrito: '.cart-summary, .order-summary, .checkout-summary, [data-test="cart-summary"]'
};

/**
 * Patrones regex para detectar fechas en formato chileno
 */
const PATRONES_FECHA = [
  /(\d{1,2})-(\d{1,2})-(\d{4})/g,  // dd-mm-aaaa
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // dd/mm/aaaa
  /(\d{1,2})\s+de\s+\w+\s+de\s+(\d{4})/g, // dd de mes de aaaa
  /\w+\s+(\d{1,2}),\s+(\d{4})/g // mes dd, aaaa
];

/**
 * Navega al carrito y obtiene la fecha de compromiso de entrega
 * @param {Object} page - Página de Playwright
 * @returns {Promise<string|null>} Fecha de compromiso formateada o null
 */
async function obtenerFechaCompromiso(page) {
  const startTime = Date.now();
  logger.startOperation('Extracción de fecha de compromiso del carrito');
  
  try {
    // Navegar al carrito
    logger.progress('Navegando al carrito de compras...');
    const navegacionExitosa = await navegarAlCarrito(page);
    
    if (!navegacionExitosa) {
      throw new Error('No se pudo navegar al carrito de compras');
    }
    
    // Verificar que hay productos en el carrito
    logger.progress('Verificando productos en el carrito...');
    const hayProductos = await verificarProductosEnCarrito(page);
    
    if (!hayProductos) {
      throw new Error('No hay productos en el carrito');
    }
    
    // Extraer fecha de compromiso
    logger.progress('Buscando fecha de compromiso de entrega...');
    const fechaCompromiso = await extraerFechaCompromiso(page);
    
    const duration = Date.now() - startTime;
    
    if (fechaCompromiso) {
      logger.endOperation('Extracción de fecha de compromiso del carrito', duration);
      logger.success(`✅ Fecha de compromiso extraída: ${fechaCompromiso}`);
      return fechaCompromiso;
    } else {
      logger.warn('No se pudo extraer la fecha de compromiso');
      return null;
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('❌ Error extrayendo fecha de compromiso', {
      error: error.message,
      duration: `${duration}ms`
    });
    
    // Capturar screenshot para debugging
    try {
      await page.screenshot({ 
        path: `error-carrito-${Date.now()}.png`, 
        fullPage: true 
      });
      logger.info('Screenshot de error guardado para debugging');
    } catch (screenshotError) {
      logger.warn('No se pudo capturar screenshot de error');
    }
    
    return null;
  }
}

/**
 * Navega al carrito de compras
 * @param {Object} page - Página de Playwright
 * @returns {Promise<boolean>} true si la navegación fue exitosa
 */
async function navegarAlCarrito(page) {
  try {
    // Buscar icono del carrito
    const iconoCarrito = await buscarIconoCarrito(page);
    
    if (!iconoCarrito) {
      // Intentar navegación directa por URL
      logger.debug('Icono de carrito no encontrado, intentando navegación directa...');
      return await navegarCarritoPorUrl(page);
    }
    
    logger.debug('Icono de carrito encontrado');
    
    // Hacer clic en el carrito
    await iconoCarrito.click();
    logger.debug('Clic en carrito realizado');
    
    // Esperar a que se cargue la página del carrito
    await page.waitForTimeout(3000);
    
    // Verificar que estamos en la página del carrito
    const enPaginaCarrito = await verificarPaginaCarrito(page);
    
    return enPaginaCarrito;
    
  } catch (error) {
    logger.error('Error navegando al carrito', { error: error.message });
    return false;
  }
}

/**
 * Busca el icono del carrito en la página
 * @param {Object} page - Página de Playwright
 * @returns {Promise<Object|null>} Elemento del carrito o null
 */
async function buscarIconoCarrito(page) {
  const selectoresCarrito = [
    '.cart-icon',
    '.shopping-cart',
    '.basket-icon',
    '[data-test="cart-icon"]',
    'a[href*="cart"]',
    'a[href*="carrito"]',
    '.header-cart',
    '.mini-cart-icon',
    'button[aria-label*="carrito"]'
  ];
  
  for (const selector of selectoresCarrito) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 2000 })) {
        logger.debug(`Icono carrito encontrado: ${selector}`);
        return elemento;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Navega al carrito por URL directa
 * @param {Object} page - Página de Playwright
 * @returns {Promise<boolean>} true si la navegación fue exitosa
 */
async function navegarCarritoPorUrl(page) {
  const urlsCarrito = [
    '/cart',
    '/carrito',
    '/checkout',
    '/shopping-cart',
    '/basket'
  ];
  
  const baseUrl = page.url().split('/').slice(0, 3).join('/');
  
  for (const urlCarrito of urlsCarrito) {
    try {
      const urlCompleta = baseUrl + urlCarrito;
      logger.debug(`Intentando navegación directa a: ${urlCompleta}`);
      
      await page.goto(urlCompleta, { waitUntil: 'networkidle' });
      
      const enPaginaCarrito = await verificarPaginaCarrito(page);
      if (enPaginaCarrito) {
        logger.debug(`Navegación exitosa a: ${urlCompleta}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  return false;
}

/**
 * Verifica que estamos en la página del carrito
 * @param {Object} page - Página de Playwright
 * @returns {Promise<boolean>} true si estamos en la página del carrito
 */
async function verificarPaginaCarrito(page) {
  // Verificar URL
  const url = page.url().toLowerCase();
  if (url.includes('cart') || url.includes('carrito') || url.includes('checkout')) {
    logger.debug('Página de carrito verificada por URL');
    return true;
  }
  
  // Verificar elementos característicos del carrito
  const selectoresCarrito = [
    '.cart-container',
    '.shopping-cart-container',
    '.checkout-container',
    '[data-test="cart-page"]',
    '.cart-items',
    '.order-summary'
  ];
  
  for (const selector of selectoresCarrito) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 3000 })) {
        logger.debug(`Página carrito verificada por elemento: ${selector}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  return false;
}

/**
 * Verifica que hay productos en el carrito
 * @param {Object} page - Página de Playwright
 * @returns {Promise<boolean>} true si hay productos
 */
async function verificarProductosEnCarrito(page) {
  // Verificar items en el carrito
  const selectoresItems = [
    '.cart-item',
    '.basket-item',
    '.checkout-item',
    '[data-test="cart-item"]',
    '.product-item',
    '.order-item'
  ];
  
  for (const selector of selectoresItems) {
    try {
      const elementos = await page.locator(selector);
      const count = await elementos.count();
      
      if (count > 0) {
        logger.debug(`${count} productos encontrados en el carrito`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Verificar contador del carrito
  const selectoresContador = [
    '.cart-count',
    '.cart-counter',
    '.basket-count',
    '[data-test="cart-count"]'
  ];
  
  for (const selector of selectoresContador) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 2000 })) {
        const contador = await elemento.textContent();
        if (contador && parseInt(contador) > 0) {
          logger.debug(`Contador de carrito: ${contador}`);
          return true;
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  logger.warn('No se encontraron productos en el carrito');
  return false;
}

/**
 * Extrae la fecha de compromiso de entrega del carrito
 * @param {Object} page - Página de Playwright
 * @returns {Promise<string|null>} Fecha formateada o null
 */
async function extraerFechaCompromiso(page) {
  try {
    // Método 1: Buscar por selectores específicos de fecha
    const fechaPorSelector = await buscarFechaPorSelectores(page);
    if (fechaPorSelector) {
      return fechaPorSelector;
    }
    
    // Método 2: Buscar en toda la página usando regex
    const fechaPorRegex = await buscarFechaPorRegex(page);
    if (fechaPorRegex) {
      return fechaPorRegex;
    }
    
    // Método 3: Buscar en secciones específicas del carrito
    const fechaEnSecciones = await buscarFechaEnSecciones(page);
    if (fechaEnSecciones) {
      return fechaEnSecciones;
    }
    
    return null;
    
  } catch (error) {
    logger.error('Error extrayendo fecha de compromiso', { error: error.message });
    return null;
  }
}

/**
 * Busca fecha usando selectores específicos
 * @param {Object} page - Página de Playwright
 * @returns {Promise<string|null>} Fecha encontrada o null
 */
async function buscarFechaPorSelectores(page) {
  const selectoresFecha = [
    '.delivery-date',
    '.shipping-date',
    '.fecha-entrega',
    '[data-test="delivery-date"]',
    '.commitment-date',
    '.fecha-compromiso',
    '.delivery-commitment',
    '[data-test="commitment-date"]',
    '.estimated-delivery',
    '.delivery-estimate'
  ];
  
  for (const selector of selectoresFecha) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 2000 })) {
        const texto = await elemento.textContent();
        if (texto) {
          const fechaExtraida = extraerFechaDeTexto(texto);
          if (fechaExtraida) {
            logger.debug(`Fecha encontrada con selector ${selector}: ${fechaExtraida}`);
            return fechaExtraida;
          }
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Busca fecha en toda la página usando expresiones regulares
 * @param {Object} page - Página de Playwright
 * @returns {Promise<string|null>} Fecha encontrada o null
 */
async function buscarFechaPorRegex(page) {
  try {
    const contenidoPagina = await page.textContent('body');
    if (!contenidoPagina) {
      return null;
    }
    
    // Buscar patrones de fecha relacionados con entrega
    const patronesEntrega = [
      /entrega.*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
      /delivery.*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
      /compromiso.*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
      /envío.*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi
    ];
    
    for (const patron of patronesEntrega) {
      const matches = contenidoPagina.match(patron);
      if (matches && matches.length > 0) {
        const fechaExtraida = extraerFechaDeTexto(matches[0]);
        if (fechaExtraida) {
          logger.debug(`Fecha encontrada con patrón regex: ${fechaExtraida}`);
          return fechaExtraida;
        }
      }
    }
    
    return null;
    
  } catch (error) {
    logger.error('Error buscando fecha por regex', { error: error.message });
    return null;
  }
}

/**
 * Busca fecha en secciones específicas del carrito
 * @param {Object} page - Página de Playwright
 * @returns {Promise<string|null>} Fecha encontrada o null
 */
async function buscarFechaEnSecciones(page) {
  const seccionesCarrito = [
    '.shipping-info',
    '.delivery-info',
    '.envio-info',
    '[data-test="shipping-info"]',
    '.cart-summary',
    '.order-summary',
    '.checkout-summary',
    '[data-test="cart-summary"]',
    '.cart-item',
    '.basket-item'
  ];
  
  for (const seccion of seccionesCarrito) {
    try {
      const elementos = await page.locator(seccion);
      const count = await elementos.count();
      
      for (let i = 0; i < count; i++) {
        const elemento = elementos.nth(i);
        const texto = await elemento.textContent();
        
        if (texto) {
          const fechaExtraida = extraerFechaDeTexto(texto);
          if (fechaExtraida) {
            logger.debug(`Fecha encontrada en sección ${seccion}:${fechaExtraida}`);
            return fechaExtraida;
          }
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Extrae fecha de un texto usando expresiones regulares
 * @param {string} texto - Texto del cual extraer la fecha
 * @returns {string|null} Fecha formateada en formato chileno o null
 */
function extraerFechaDeTexto(texto) {
  if (!texto || typeof texto !== 'string') {
    return null;
  }
  
  // Limpiar texto
  const textoLimpio = validators.sanitizarTexto(texto);
  
  // Buscar patrones de fecha
  for (const patron of PATRONES_FECHA) {
    const match = textoLimpio.match(patron);
    if (match && match.length > 0) {
      const fechaEncontrada = match[0];
      
      // Convertir a formato chileno si es necesario
      const fechaFormateada = normalizarFechaChilena(fechaEncontrada);
      
      if (fechaFormateada && validators.validarFechaChilena(fechaFormateada)) {
        return fechaFormateada;
      }
    }
  }
  
  return null;
}

/**
 * Normaliza una fecha al formato chileno (dd-mm-aaaa)
 * @param {string} fecha - Fecha en cualquier formato
 * @returns {string|null} Fecha en formato chileno o null
 */
function normalizarFechaChilena(fecha) {
  if (!fecha) {
    return null;
  }
  
  // Regex para diferentes formatos
  const formatoGuion = /(\d{1,2})-(\d{1,2})-(\d{4})/;
  const formatoSlash = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
  
  let match = fecha.match(formatoGuion);
  if (match) {
    const [, dia, mes, ano] = match;
    return `${dia.padStart(2, '0')}-${mes.padStart(2, '0')}-${ano}`;
  }
  
  match = fecha.match(formatoSlash);
  if (match) {
    const [, dia, mes, ano] = match;
    return `${dia.padStart(2, '0')}-${mes.padStart(2, '0')}-${ano}`;
  }
  
  return null;
}

module.exports = {
  obtenerFechaCompromiso
};
