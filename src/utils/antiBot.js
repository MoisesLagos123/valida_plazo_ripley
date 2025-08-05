/**
 * Estrategias avanzadas de evasión anti-bot
 * Funciones especializadas para superar medidas de seguridad web
 */

const logger = require('./logger');

/**
 * Lista de proxies chilenos (opcional, para rotación de IP)
 */
const PROXIES_CHILE = [
  // Agregar proxies si se requiere rotación de IP
  // { host: 'proxy1.cl', port: 8080, username: '', password: '' }
];

/**
 * Headers HTTP realistas para solicitudes
 */
const HEADERS_REALISTAS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Referer': 'https://www.google.com/'
};

/**
 * Aplica estrategias de evasión avanzadas a una página
 * @param {Object} page - Página de Playwright  
 * @param {Object} context - Contexto del navegador
 */
async function aplicarEvasionAvanzada(page, context) {
  try {
    logger.debug('🛡️ Aplicando estrategias de evasión avanzadas...');
    
    // Estrategia 1: Inyectar scripts anti-detección
    await inyectarScriptsAntiDeteccion(page);
    
    // Estrategia 2: Configurar cookies realistas
    await configurarCookiesRealistas(context);
    
    // Estrategia 3: Simular historial de navegación
    await simularHistorialNavegacion(page);
    
    // Estrategia 4: Configurar almacenamiento local
    await configurarLocalStorage(page);
    
    logger.debug('✅ Estrategias de evasión aplicadas');
    
  } catch (error) {
    logger.warn('⚠️ Error aplicando evasión avanzada:', error.message);
  }
}

/**
 * Inyecta scripts para evitar detección de automatización
 * @param {Object} page - Página de Playwright
 */
async function inyectarScriptsAntiDeteccion(page) {
  await page.addInitScript(() => {
    // Override del objeto navigator completo
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Eliminar propiedades de Playwright/Chrome automation
    delete window.navigator.__proto__.webdriver;
    delete window.chrome.runtime.onConnect;
    delete window.chrome.runtime.onMessage;
    
    // Sobrescribir la función de detección de headless
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
    
    // Mock de plugins realistas
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          0: {
            type: "application/x-google-chrome-pdf",
            suffixes: "pdf",
            description: "Portable Document Format",
            enabledPlugin: Plugin
          },
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chrome PDF Plugin"
        },
        {
          0: {
            type: "application/pdf",
            suffixes: "pdf", 
            description: "",
            enabledPlugin: Plugin
          },
          description: "",
          filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
          length: 1,
          name: "Chrome PDF Viewer"
        }
      ],
    });
    
    // Mock de idiomas
    Object.defineProperty(navigator, 'languages', {
      get: () => ['es-CL', 'es', 'en-US', 'en'],
    });
    
    // Mock de plataforma
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
    });
    
    // Mock de deviceMemory
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
    });
    
    // Mock de hardwareConcurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 4,
    });
    
    // Override de la función Date para evitar detección de timezone
    const originalDate = Date;
    const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
    Date.prototype.getTimezoneOffset = function() {
      return 180; // UTC-3 (Chile)
    };
    
    // Mock de screen properties realistas
    Object.defineProperty(screen, 'availHeight', {
      get: () => 1040,
    });
    
    Object.defineProperty(screen, 'availWidth', {
      get: () => 1920,
    });
    
    Object.defineProperty(screen, 'colorDepth', {
      get: () => 24,
    });
    
    Object.defineProperty(screen, 'pixelDepth', {
      get: () => 24,
    });
    
    // Eliminar rastros de automation
    if (window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect) {
      delete window.chrome.runtime.onConnect;
    }
    
    if (window.chrome && window.chrome.runtime && window.chrome.runtime.onMessage) {
      delete window.chrome.runtime.onMessage;
    }
    
    // Mock de WebGL para parecer más real
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      if (parameter === 37446) {
        return 'Intel(R) Iris(R) Xe Graphics';
      }
      return getParameter.call(this, parameter);
    };
  });
}

/**
 * Configura cookies realistas para el contexto
 * @param {Object} context - Contexto del navegador
 */
async function configurarCookiesRealistas(context) {
  const cookies = [
    {
      name: '_ga',
      value: `GA1.2.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`,
      domain: '.ripley.cl',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 86400 * 365
    },
    {
      name: '_gid', 
      value: `GA1.2.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`,
      domain: '.ripley.cl',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 86400
    },
    {
      name: 'sessionId',
      value: generateRandomString(32),
      domain: '.ripley.cl',
      path: '/',
      httpOnly: false,
      secure: true
    }
  ];
  
  await context.addCookies(cookies);
  logger.debug('🍪 Cookies realistas configuradas');
}

/**
 * Simula historial de navegación previo
 * @param {Object} page - Página de Playwright
 */
async function simularHistorialNavegacion(page) {
  await page.addInitScript(() => {
    // Simular historial de navegación
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(state, title, url) {
      originalPushState.call(history, state, title, url);
    };
    
    history.replaceState = function(state, title, url) {
      originalReplaceState.call(history, state, title, url);
    };
    
    // Mock de history.length
    Object.defineProperty(history, 'length', {
      get: () => Math.floor(Math.random() * 5) + 2,
    });
  });
}

/**
 * Configura localStorage realista
 * @param {Object} page - Página de Playwright
 */
async function configurarLocalStorage(page) {
  await page.addInitScript(() => {
    // Simular datos de localStorage típicos
    const localStorageData = {
      'language': 'es-CL',
      'timezone': 'America/Santiago',
      'visited': Date.now().toString(),
      'preferences': JSON.stringify({
        currency: 'CLP',
        region: 'chile'
      })
    };
    
    Object.keys(localStorageData).forEach(key => {
      try {
        localStorage.setItem(key, localStorageData[key]);
      } catch (e) {
        // Ignorar errores de localStorage
      }
    });
  });
}

/**
 * Genera una cadena aleatoria
 * @param {number} length - Longitud de la cadena
 * @returns {string} Cadena aleatoria
 */
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Simula patrones de comportamiento humano realistas
 * @param {Object} page - Página de Playwright
 */
async function simularPatronesHumanos(page) {
  const acciones = [
    () => simularLecturaTexto(page),
    () => simularScrollExploratorio(page),  
    () => simularMovimientoMouseNatural(page),
    () => simularPausasReflexivas(page)
  ];
  
  // Ejecutar 2-3 acciones aleatorias
  const numAcciones = Math.floor(Math.random() * 2) + 2;
  const accionesSeleccionadas = acciones.sort(() => 0.5 - Math.random()).slice(0, numAcciones);
  
  for (const accion of accionesSeleccionadas) {
    try {
      await accion();
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    } catch (error) {
      logger.debug('Error en simulación de patrón humano:', error.message);
    }
  }
}

/**
 * Simula lectura de texto en pantalla
 * @param {Object} page - Página de Playwright
 */
async function simularLecturaTexto(page) {
  const elementos = await page.locator('p, h1, h2, h3, span').all();
  if (elementos.length > 0) {
    const elemento = elementos[Math.floor(Math.random() * elementos.length)];
    try {
      await elemento.scrollIntoViewIfNeeded();
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    } catch (error) {
      // Ignorar errores
    }
  }
}

/**
 * Simula scroll exploratorio
 * @param {Object} page - Página de Playwright
 */
async function simularScrollExploratorio(page) {
  const scrolls = Math.floor(Math.random() * 3) + 2;
  
  for (let i = 0; i < scrolls; i++) {
    const direccion = Math.random() > 0.5 ? 1 : -1;
    const cantidad = Math.random() * 300 + 100;
    
    await page.evaluate((dir, cant) => {
      window.scrollBy(0, dir * cant);
    }, direccion, cantidad);
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  }
}

/**
 * Simula movimiento natural del mouse
 * @param {Object} page - Página de Playwright
 */
async function simularMovimientoMouseNatural(page) {
  const viewport = page.viewportSize();
  const puntos = Math.floor(Math.random() * 3) + 2;
  
  for (let i = 0; i < puntos; i++) {
    const x = Math.random() * viewport.width;
    const y = Math.random() * viewport.height;
    const steps = Math.floor(Math.random() * 10) + 5;
    
    await page.mouse.move(x, y, { steps });
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200));
  }
}

/**
 * Simula pausas reflexivas típicas de usuarios
 * @param {Object} page - Página de Playwright
 */
async function simularPausasReflexivas(page) {
  const pausa = Math.random() * 3000 + 1000; // 1-4 segundos
  await new Promise(resolve => setTimeout(resolve, pausa));
}

/**
 * Detecta y maneja diferentes tipos de bloqueos
 * @param {Object} page - Página de Playwright
 * @returns {Promise<string|null>} Tipo de bloqueo detectado o null
 */
async function detectarTipoBloqueo(page) {
  const tiposBloqueo = {
    cloudflare: [
      'text="Checking your browser"',
      'text="Just a moment"',
      '.cf-browser-verification',
      '#challenge-form'
    ],
    custom: [
      'text="¡Alto, no puedes acceder!"',
      'text="servicio de seguridad"',
      'text="¿Por qué me han bloqueado?"'
    ],
    rateLimit: [
      'text="Too Many Requests"',
      'text="Rate limit exceeded"',
      'text="Demasiadas solicitudes"'
    ]
  };
  
  for (const [tipo, selectores] of Object.entries(tiposBloqueo)) {
    for (const selector of selectores) {
      try {
        const elemento = await page.locator(selector).first();
        if (await elemento.isVisible({ timeout: 1000 })) {
          logger.info(`🚫 Tipo de bloqueo detectado: ${tipo}`);
          return tipo;
        }
      } catch (error) {
        continue;
      }
    }
  }
  
  return null;
}

module.exports = {
  aplicarEvasionAvanzada,
  simularPatronesHumanos,
  detectarTipoBloqueo,
  HEADERS_REALISTAS,
  PROXIES_CHILE
};
