/**
 * Servicio de autenticación en Ripley.cl
 * Maneja el proceso de login en la plataforma
 */

const logger = require('../utils/logger');
const validators = require('../utils/validators');
const { esperarElementoConRetry } = require('../config/playwright');

/**
 * Credenciales predefinidas para Ripley
 */
const CREDENCIALES_RIPLEY = {
  email: 'devscrap2025@gmail.com',
  password: 'Dev20252025.'
};

/**
 * Selectores CSS para el proceso de login
 */
const SELECTORES = {
  botonLogin: 'a[href*="login"], button[aria-label*="login"], .login-button, [data-test="login-button"]',
  campoEmail: 'input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email"]',
  campoPassword: 'input[type="password"], input[name*="password"], input[id*="password"]',
  botonSubmit: 'button[type="submit"], input[type="submit"], button:has-text("Iniciar"), button:has-text("Ingresar")',
  indicadorLogueado: '.user-menu, .account-menu, [data-test="user-logged"], .mi-cuenta',
  mensajeError: '.error-message, .alert-danger, .login-error, [data-test="error-message"]'
};

/**
 * Inicia sesión en Ripley.cl
 * @param {Object} page - Página de Playwright
 * @param {Object} credenciales - Credenciales de login (opcional, usa las predefinidas por defecto)
 * @returns {Promise<boolean>} true si el login fue exitoso
 */
async function iniciarSesion(page, credenciales = CREDENCIALES_RIPLEY) {
  const startTime = Date.now();
  logger.startOperation('Proceso de autenticación en Ripley');
  
  try {
    // Validar credenciales
    if (!validators.validarCredenciales(credenciales)) {
      throw new Error('Credenciales inválidas proporcionadas');
    }
    
    logger.info('Navegando a la página principal de Ripley...');
    
    // Navegar a la página principal
    const baseUrl = process.env.RIPLEY_BASE_URL || 'https://www.ripley.cl';
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    
    logger.progress('Página cargada, buscando botón de login...');
    
    // Buscar y hacer clic en el botón de login
    const botonLoginEncontrado = await buscarBotonLogin(page);
    if (!botonLoginEncontrado) {
      throw new Error('No se pudo encontrar el botón de login en la página');
    }
    
    // Esperar a que aparezca el formulario de login
    logger.progress('Esperando formulario de login...');
    await page.waitForTimeout(2000); // Esperar a que se cargue el formulario
    
    // Rellenar credenciales
    await rellenarCredenciales(page, credenciales);
    
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
    
    // Capturar screenshot en caso de error para debugging
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
 * Busca y hace clic en el botón de login
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
    '.account-access'
  ];
  
  for (const selector of selectoresPosibles) {
    try {
      logger.debug(`Buscando botón login con selector: ${selector}`);
      
      const elemento = await page.locator(selector).first();
      
      if (await elemento.isVisible({ timeout: 2000 })) {
        logger.info(`Botón de login encontrado con selector: ${selector}`);
        await elemento.click();
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
 * Rellena las credenciales en el formulario de login
 * @param {Object} page - Página de Playwright
 * @param {Object} credenciales - Email y password
 */
async function rellenarCredenciales(page, credenciales) {
  logger.progress('Rellenando credenciales...');
  
  // Buscar campo de email
  const campoEmail = await buscarCampoEmail(page);
  if (!campoEmail) {
    throw new Error('No se pudo encontrar el campo de email');
  }
  
  // Buscar campo de password
  const campoPassword = await buscarCampoPassword(page);
  if (!campoPassword) {
    throw new Error('No se pudo encontrar el campo de password');
  }
  
  // Rellenar email
  await campoEmail.clear();
  await campoEmail.fill(credenciales.email);
  logger.debug('Email ingresado correctamente');
  
  // Rellenar password
  await campoPassword.clear();
  await campoPassword.fill(credenciales.password);
  logger.debug('Password ingresado correctamente');
  
  // Pequeña pausa para que los campos se procesen
  await page.waitForTimeout(1000);
}

/**
 * Busca el campo de email en el formulario
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
    '.email-input input',
    '[data-test="email-input"]'
  ];
  
  for (const selector of selectoresEmail) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 1000 })) {
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
 * Busca el campo de password en el formulario
 * @param {Object} page - Página de Playwright
 * @returns {Promise<Object|null>} Elemento del campo de password o null
 */
async function buscarCampoPassword(page) {
  const selectoresPassword = [
    'input[type="password"]',
    'input[name*="password"]',
    'input[id*="password"]',
    'input[placeholder*="contraseña"]',
    '.password-input input',
    '[data-test="password-input"]'
  ];
  
  for (const selector of selectoresPassword) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 1000 })) {
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
 * Envía el formulario de login
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
    '[data-test="login-submit"]'
  ];
  
  for (const selector of selectoresSubmit) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 2000 })) {
        logger.debug(`Botón submit encontrado: ${selector}`);
        await elemento.click();
        
        // Esperar a que se procese el login
        await page.waitForTimeout(3000);
        return;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Si no encuentra botón submit, intentar enviar con Enter
  logger.warn('No se encontró botón submit, intentando con Enter...');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
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
  
  // Buscar indicadores de usuario logueado
  const indicadoresLogin = [
    '.user-menu',
    '.account-menu',
    '[data-test="user-logged"]',
    '.mi-cuenta',
    '.user-info',
    '.logout-button',
    'a[href*="logout"]',
    'a:has-text("Cerrar Sesión")'
  ];
  
  for (const selector of indicadoresLogin) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 5000 })) {
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
      !urlActual.includes('login')) {
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
    '.form-error'
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
