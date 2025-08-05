/**
 * Configuración de Playwright para el navegador
 * Módulo que maneja la inicialización y configuración del navegador Chromium
 */

const { chromium } = require('playwright');
require('dotenv').config();

/**
 * Configuración por defecto del navegador
 */
const DEFAULT_CONFIG = {
  headless: process.env.HEADLESS === 'true' || false,
  slowMo: parseInt(process.env.SLOW_MO) || 100,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ],
  viewport: {
    width: 1366,
    height: 768
  }
};

/**
 * Configuración de timeouts
 */
const TIMEOUTS = {
  page: parseInt(process.env.PAGE_TIMEOUT) || 30000,
  element: parseInt(process.env.ELEMENT_TIMEOUT) || 10000
};

/**
 * Inicializa una nueva instancia del navegador
 * @returns {Promise<Object>} Objeto con browser y page
 */
async function inicializarNavegador() {
  try {
    console.log('🚀 Iniciando navegador Chromium...');
    
    const browser = await chromium.launch(DEFAULT_CONFIG);
    
    const context = await browser.newContext({
      viewport: DEFAULT_CONFIG.viewport,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Configurar timeouts
    page.setDefaultTimeout(TIMEOUTS.element);
    page.setDefaultNavigationTimeout(TIMEOUTS.page);
    
    // Interceptar y manejar diálogos (alerts, confirms, etc.)
    page.on('dialog', async dialog => {
      console.log(`📢 Diálogo detectado: ${dialog.message()}`);
      await dialog.accept();
    });
    
    // Manejar errores de la página
    page.on('pageerror', error => {
      console.error('❌ Error en la página:', error.message);
    });
    
    console.log('✅ Navegador inicializado correctamente');
    
    return { browser, page };
    
  } catch (error) {
    console.error('❌ Error al inicializar el navegador:', error.message);
    throw error;
  }
}

/**
 * Cierra el navegador de forma segura
 * @param {Object} browser - Instancia del navegador
 */
async function cerrarNavegador(browser) {
  try {
    if (browser) {
      await browser.close();
      console.log('🔒 Navegador cerrado correctamente');
    }
  } catch (error) {
    console.error('❌ Error al cerrar el navegador:', error.message);
  }
}

/**
 * Espera a que un elemento sea visible con retry
 * @param {Object} page - Página de Playwright
 * @param {string} selector - Selector CSS del elemento
 * @param {number} maxRetries - Número máximo de intentos
 * @returns {Promise<boolean>} true si el elemento es encontrado
 */
async function esperarElementoConRetry(page, selector, maxRetries = 3) {
  const retryDelay = parseInt(process.env.RETRY_DELAY) || 2000;
  
  for (let intento = 1; intento <= maxRetries; intento++) {
    try {
      await page.waitForSelector(selector, { 
        state: 'visible', 
        timeout: TIMEOUTS.element 
      });
      return true;
    } catch (error) {
      console.log(`⚠️ Intento ${intento}/${maxRetries} fallido para selector: ${selector}`);
      
      if (intento === maxRetries) {
        throw new Error(`Elemento no encontrado después de ${maxRetries} intentos: ${selector}`);
      }
      
      // Esperar antes del siguiente intento
      await page.waitForTimeout(retryDelay);
    }
  }
  
  return false;
}

module.exports = {
  inicializarNavegador,
  cerrarNavegador,
  esperarElementoConRetry,
  TIMEOUTS,
  DEFAULT_CONFIG
};
