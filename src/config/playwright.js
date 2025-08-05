/**
 * Configuración de Playwright para el navegador con evasión anti-bot
 * Módulo que maneja la inicialización y configuración del navegador Chromium
 */

const { chromium } = require('playwright');
require('dotenv').config();

/**
 * Configuración avanzada del navegador para evadir detección de bots
 */
const DEFAULT_CONFIG = {
  headless: process.env.HEADLESS === 'true' || false,
  slowMo: parseInt(process.env.SLOW_MO) || 200, // Aumentado para ser más humano
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--exclude-switches=enable-automation',
    '--disable-extensions-file-access-check',
    '--disable-extensions-http-throttling',
    '--disable-extensions-https-throttling',
    '--disable-extensions',
    '--disable-hang-monitor',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-component-extensions-with-background-pages',
    '--no-default-browser-check',
    '--no-first-run',
    '--disable-default-apps',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--force-color-profile=srgb',
    '--metrics-recording-only',
    '--disable-background-networking',
    '--enable-features=NetworkService,NetworkServiceLogging',
    '--allow-running-insecure-content',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-breakpad',
    '--disable-canvas-aa',
    '--disable-2d-canvas-clip-aa',
    '--disable-gl-drawing-for-tests',
    '--disable-threaded-animation',
    '--disable-threaded-scrolling',
    '--disable-in-process-stack-traces',
    '--disable-histogram-customizer',
    '--disable-gl-extensions',
    '--disable-composited-antialiasing'
  ],
  ignoreDefaultArgs: ['--enable-automation'],
  viewport: null // Usar viewport del sistema
};

/**
 * User agents reales y actualizados
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
];

/**
 * Configuración de timeouts
 */
const TIMEOUTS = {
  page: parseInt(process.env.PAGE_TIMEOUT) || 45000, // Aumentado
  element: parseInt(process.env.ELEMENT_TIMEOUT) || 15000 // Aumentado
};

/**
 * Inicializa una nueva instancia del navegador con evasión anti-bot
 * @returns {Promise<Object>} Objeto con browser y page
 */
async function inicializarNavegador() {
  try {
    console.log('🤖 Iniciando navegador con evasión anti-bot...');
    
    const browser = await chromium.launch(DEFAULT_CONFIG);
    
    // Configuración del contexto con evasión de detección
    const context = await browser.newContext({
      userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      viewport: { width: 1366 + Math.floor(Math.random() * 100), height: 768 + Math.floor(Math.random() * 100) },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      locale: 'es-CL',
      timezoneId: 'America/Santiago',
      geolocation: { longitude: -70.6483, latitude: -33.4489 }, // Santiago, Chile
      permissions: ['geolocation'],
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });
    
    const page = await context.newPage();
    
    // Scripts de evasión de detección de bots
    await configurarEvasionAntiBot(page);
    
    // Configurar timeouts
    page.setDefaultTimeout(TIMEOUTS.element);
    page.setDefaultNavigationTimeout(TIMEOUTS.page);
    
    // Interceptar y manejar diálogos
    page.on('dialog', async dialog => {
      console.log(`📢 Diálogo detectado: ${dialog.message()}`);
      await dialog.accept();
    });
    
    // Manejar errores de la página
    page.on('pageerror', error => {
      console.error('❌ Error en la página:', error.message);
    });
    
    // Interceptar requests y añadir headers realistas
    await page.route('**/*', async (route) => {
      const headers = route.request().headers();
      headers['sec-ch-ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
      headers['sec-ch-ua-mobile'] = '?0';
      headers['sec-ch-ua-platform'] = '"Windows"';
      
      await route.continue({ headers });
    });
    
    console.log('✅ Navegador inicializado con evasión anti-bot');
    
    return { browser, page };
    
  } catch (error) {
    console.error('❌ Error al inicializar el navegador:', error.message);
    throw error;
  }
}

/**
 * Configura scripts de evasión de detección de bots
 * @param {Object} page - Página de Playwright
 */
async function configurarEvasionAntiBot(page) {
  // Script para eliminar propiedades de webdriver
  await page.addInitScript(() => {
    // Eliminar propiedades de webdriver
    delete window.navigator.__proto__.webdriver;
    
    // Sobrescribir la propiedad webdriver
    Object.defineProperty(window.navigator, 'webdriver', {
      get: () => false,
    });
    
    // Sobrescribir languages
    Object.defineProperty(window.navigator, 'languages', {
      get: () => ['es-CL', 'es', 'en-US', 'en'],
    });
    
    // Sobrescribir plugins
    Object.defineProperty(window.navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    // Eliminar automation
    window.chrome = {
      runtime: {},
    };
    
    // Sobrescribir permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
    
    // Hacer que la detección de headless falle
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      get: () => 1,
    });
    
    // Sobrescribir screen properties
    Object.defineProperty(window.screen, 'colorDepth', {
      get: () => 24,
    });
    
    Object.defineProperty(window.screen, 'pixelDepth', {
      get: () => 24,
    });
  });
  
  // Simular movimientos de mouse realistas
  await page.addInitScript(() => {
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    
    // Añadir variabilidad en el timing
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay) {
      const variance = delay * 0.1;
      const newDelay = delay + (Math.random() * variance * 2 - variance);
      return originalSetTimeout(callback, Math.max(0, newDelay));
    };
  });
}

/**
 * Simula comportamiento humano antes de realizar acciones
 * @param {Object} page - Página de Playwright
 */
async function simularComportamientoHumano(page) {
  // Movimiento aleatorio del mouse
  const viewport = page.viewportSize();
  await page.mouse.move(
    Math.random() * viewport.width,
    Math.random() * viewport.height,
    { steps: Math.floor(Math.random() * 10) + 5 }
  );
  
  // Scroll aleatorio
  await page.evaluate(() => {
    window.scrollBy(0, Math.random() * 200);
  });
  
  // Pausa aleatoria
  await page.waitForTimeout(Math.random() * 2000 + 1000);
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
 * Espera a que un elemento sea visible con retry y comportamiento humano
 * @param {Object} page - Página de Playwright
 * @param {string} selector - Selector CSS del elemento
 * @param {number} maxRetries - Número máximo de intentos
 * @returns {Promise<boolean>} true si el elemento es encontrado
 */
async function esperarElementoConRetry(page, selector, maxRetries = 3) {
  const retryDelay = parseInt(process.env.RETRY_DELAY) || 3000;
  
  for (let intento = 1; intento <= maxRetries; intento++) {
    try {
      // Simular comportamiento humano antes de buscar
      await simularComportamientoHumano(page);
      
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
      
      // Esperar con variación aleatoria antes del siguiente intento
      const delay = retryDelay + (Math.random() * 1000);
      await page.waitForTimeout(delay);
    }
  }
  
  return false;
}

/**
 * Navega a una URL con comportamiento humano
 * @param {Object} page - Página de Playwright
 * @param {string} url - URL de destino
 */
async function navegarComoHumano(page, url) {
  console.log(`🌐 Navegando a: ${url}`);
  
  // Simular tiempo de escritura en la barra de direcciones
  await page.waitForTimeout(Math.random() * 1000 + 500);
  
  await page.goto(url, { 
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUTS.page 
  });
  
  // Simular tiempo de lectura
  await page.waitForTimeout(Math.random() * 3000 + 2000);
  
  // Simular scroll para "leer" la página
  await page.evaluate(() => {
    window.scrollTo(0, Math.random() * 300);
  });
  
  await page.waitForTimeout(Math.random() * 2000 + 1000);
}

module.exports = {
  inicializarNavegador,
  cerrarNavegador,
  esperarElementoConRetry,
  simularComportamientoHumano,
  navegarComoHumano,
  TIMEOUTS,
  DEFAULT_CONFIG
};
