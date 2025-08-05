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
  botonLogin: 'a[href*=\"login\"], button[aria-label*=\"login\"], .login-button, [data-test=\"login-button\"]',
  campoEmail: 'input[type=\"email\"], input[name*=\"email\"], input[id*=\"email\"], input[placeholder*=\"email\"]',
  campoPassword: 'input[type=\"password\"], input[name*=\"password\"], input[id*=\"password\"]',
  botonSubmit: 'button[type=\"submit\"], input[type=\"submit\"], button:has-text(\"Iniciar\"), button:has-text(\"Ingresar\")',
  indicadorLogueado: '.user-menu, .account-menu, [data-test=\"user-logged\"], .mi-cuenta',
  mensajeError: '.error-message, .alert-danger, .login-error, [data-test=\"error-message\"]'
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
}\n\n/**\n * Busca y hace clic en el botón de login\n * @param {Object} page - Página de Playwright\n * @returns {Promise<boolean>} true si encontró y clickeó el botón\n */\nasync function buscarBotonLogin(page) {\n  const selectoresPosibles = [\n    'a[href*=\"login\"]',\n    'button[aria-label*=\"login\"]',\n    '.login-button',\n    '[data-test=\"login-button\"]',\n    'a:has-text(\"Iniciar Sesión\")',\n    'a:has-text(\"Ingresar\")',\n    'button:has-text(\"Login\")',\n    '.user-access',\n    '.account-access'\n  ];\n  \n  for (const selector of selectoresPosibles) {\n    try {\n      logger.debug(`Buscando botón login con selector: ${selector}`);\n      \n      const elemento = await page.locator(selector).first();\n      \n      if (await elemento.isVisible({ timeout: 2000 })) {\n        logger.info(`Botón de login encontrado con selector: ${selector}`);\n        await elemento.click();\n        return true;\n      }\n    } catch (error) {\n      logger.debug(`Selector ${selector} no encontrado, probando siguiente...`);\n      continue;\n    }\n  }\n  \n  return false;\n}\n\n/**\n * Rellena las credenciales en el formulario de login\n * @param {Object} page - Página de Playwright\n * @param {Object} credenciales - Email y password\n */\nasync function rellenarCredenciales(page, credenciales) {\n  logger.progress('Rellenando credenciales...');\n  \n  // Buscar campo de email\n  const campoEmail = await buscarCampoEmail(page);\n  if (!campoEmail) {\n    throw new Error('No se pudo encontrar el campo de email');\n  }\n  \n  // Buscar campo de password\n  const campoPassword = await buscarCampoPassword(page);\n  if (!campoPassword) {\n    throw new Error('No se pudo encontrar el campo de password');\n  }\n  \n  // Rellenar email\n  await campoEmail.clear();\n  await campoEmail.fill(credenciales.email);\n  logger.debug('Email ingresado correctamente');\n  \n  // Rellenar password\n  await campoPassword.clear();\n  await campoPassword.fill(credenciales.password);\n  logger.debug('Password ingresado correctamente');\n  \n  // Pequeña pausa para que los campos se procesen\n  await page.waitForTimeout(1000);\n}\n\n/**\n * Busca el campo de email en el formulario\n * @param {Object} page - Página de Playwright\n * @returns {Promise<Object|null>} Elemento del campo de email o null\n */\nasync function buscarCampoEmail(page) {\n  const selectoresEmail = [\n    'input[type=\"email\"]',\n    'input[name*=\"email\"]',\n    'input[id*=\"email\"]',\n    'input[placeholder*=\"email\"]',\n    'input[placeholder*=\"correo\"]',\n    '.email-input input',\n    '[data-test=\"email-input\"]'\n  ];\n  \n  for (const selector of selectoresEmail) {\n    try {\n      const elemento = await page.locator(selector).first();\n      if (await elemento.isVisible({ timeout: 1000 })) {\n        logger.debug(`Campo email encontrado: ${selector}`);\n        return elemento;\n      }\n    } catch (error) {\n      continue;\n    }\n  }\n  \n  return null;\n}\n\n/**\n * Busca el campo de password en el formulario\n * @param {Object} page - Página de Playwright\n * @returns {Promise<Object|null>} Elemento del campo de password o null\n */\nasync function buscarCampoPassword(page) {\n  const selectoresPassword = [\n    'input[type=\"password\"]',\n    'input[name*=\"password\"]',\n    'input[id*=\"password\"]',\n    'input[placeholder*=\"contraseña\"]',\n    '.password-input input',\n    '[data-test=\"password-input\"]'\n  ];\n  \n  for (const selector of selectoresPassword) {\n    try {\n      const elemento = await page.locator(selector).first();\n      if (await elemento.isVisible({ timeout: 1000 })) {\n        logger.debug(`Campo password encontrado: ${selector}`);\n        return elemento;\n      }\n    } catch (error) {\n      continue;\n    }\n  }\n  \n  return null;\n}\n\n/**\n * Envía el formulario de login\n * @param {Object} page - Página de Playwright\n */\nasync function enviarFormularioLogin(page) {\n  logger.progress('Enviando formulario de login...');\n  \n  const selectoresSubmit = [\n    'button[type=\"submit\"]',\n    'input[type=\"submit\"]',\n    'button:has-text(\"Iniciar\")',\n    'button:has-text(\"Ingresar\")',\n    'button:has-text(\"Login\")',\n    '.login-submit',\n    '[data-test=\"login-submit\"]'\n  ];\n  \n  for (const selector of selectoresSubmit) {\n    try {\n      const elemento = await page.locator(selector).first();\n      if (await elemento.isVisible({ timeout: 2000 })) {\n        logger.debug(`Botón submit encontrado: ${selector}`);\n        await elemento.click();\n        \n        // Esperar a que se procese el login\n        await page.waitForTimeout(3000);\n        return;\n      }\n    } catch (error) {\n      continue;\n    }\n  }\n  \n  // Si no encuentra botón submit, intentar enviar con Enter\n  logger.warn('No se encontró botón submit, intentando con Enter...');\n  await page.keyboard.press('Enter');\n  await page.waitForTimeout(3000);\n}\n\n/**\n * Verifica si el login fue exitoso\n * @param {Object} page - Página de Playwright\n * @returns {Promise<boolean>} true si el login fue exitoso\n */\nasync function verificarLoginExitoso(page) {\n  logger.progress('Verificando estado de login...');\n  \n  // Verificar si hay mensaje de error\n  const hayError = await verificarMensajeError(page);\n  if (hayError) {\n    return false;\n  }\n  \n  // Buscar indicadores de usuario logueado\n  const indicadoresLogin = [\n    '.user-menu',\n    '.account-menu',\n    '[data-test=\"user-logged\"]',\n    '.mi-cuenta',\n    '.user-info',\n    '.logout-button',\n    'a[href*=\"logout\"]',\n    'a:has-text(\"Cerrar Sesión\")'\n  ];\n  \n  for (const selector of indicadoresLogin) {\n    try {\n      const elemento = await page.locator(selector).first();\n      if (await elemento.isVisible({ timeout: 5000 })) {\n        logger.debug(`Indicador de login exitoso encontrado: ${selector}`);\n        return true;\n      }\n    } catch (error) {\n      continue;\n    }\n  }\n  \n  // Verificar cambio en la URL que indique login exitoso\n  const urlActual = page.url();\n  if (urlActual.includes('account') || urlActual.includes('mi-cuenta') || \n      !urlActual.includes('login')) {\n    logger.debug('Login verificado por cambio de URL');\n    return true;\n  }\n  \n  return false;\n}\n\n/**\n * Verifica si hay mensajes de error en el login\n * @param {Object} page - Página de Playwright\n * @returns {Promise<boolean>} true si hay errores\n */\nasync function verificarMensajeError(page) {\n  const selectoresError = [\n    '.error-message',\n    '.alert-danger',\n    '.login-error',\n    '[data-test=\"error-message\"]',\n    '.field-error',\n    '.form-error'\n  ];\n  \n  for (const selector of selectoresError) {\n    try {\n      const elemento = await page.locator(selector).first();\n      if (await elemento.isVisible({ timeout: 2000 })) {\n        const textoError = await elemento.textContent();\n        logger.error('Mensaje de error encontrado en login', { \n          selector, \n          mensaje: textoError \n        });\n        return true;\n      }\n    } catch (error) {\n      continue;\n    }\n  }\n  \n  return false;\n}\n\nmodule.exports = {\n  iniciarSesion,\n  CREDENCIALES_RIPLEY\n};"}