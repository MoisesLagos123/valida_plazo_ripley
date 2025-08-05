/**
 * Servicio de búsqueda y adición de productos por SKU
 * Maneja la búsqueda de productos específicos y su adición al carrito
 */

const logger = require('../utils/logger');
const validators = require('../utils/validators');
const { esperarElementoConRetry } = require('../config/playwright');

/**
 * SKU objetivo predefinido
 */
const SKU_OBJETIVO = process.env.TARGET_SKU || '2000377223468P';

/**
 * Selectores CSS para la búsqueda de productos
 */
const SELECTORES = {
  buscador: 'input[type="search"], input[name*="search"], input[placeholder*="buscar"], .search-input, [data-test="search-input"]',
  botonBuscar: 'button[type="submit"]:near(input[type="search"]), .search-button, [data-test="search-button"], button:has-text("Buscar")',
  resultadoProducto: '.product-item, .product-card, .search-result-item, [data-test="product-item"]',
  botonAgregarCarrito: 'button:has-text("Agregar"), button:has-text("Carrito"), .add-to-cart, [data-test="add-to-cart"]',
  mensajeNoResultados: '.no-results, .empty-results, .search-empty, [data-test="no-results"]',
  mensajeProductoAgregado: '.cart-added, .product-added, .success-message, [data-test="product-added"]'
};

/**
 * Busca un producto por SKU y lo agrega al carrito
 * @param {Object} page - Página de Playwright
 * @param {string} sku - SKU del producto a buscar
 * @returns {Promise<Object>} Resultado de la operación
 */
async function buscarYAgregarProducto(page, sku = SKU_OBJETIVO) {
  const startTime = Date.now();
  logger.startOperation(`Búsqueda y adición de producto SKU: ${sku}`);
  
  try {
    // Validar SKU
    if (!validators.validarSku(sku)) {
      throw new Error(`SKU inválido: ${sku}`);
    }
    
    // Realizar búsqueda
    logger.progress('Iniciando búsqueda de producto...');
    const busquedaExitosa = await realizarBusqueda(page, sku);
    
    if (!busquedaExitosa) {
      throw new Error('No se pudo realizar la búsqueda del producto');
    }
    
    // Buscar el producto en los resultados
    logger.progress('Buscando producto en resultados...');
    const productoEncontrado = await buscarProductoEnResultados(page, sku);
    
    if (!productoEncontrado) {
      return {
        sku,
        exito: false,
        mensaje: 'Producto no encontrado en los resultados de búsqueda',
        timestamp: validators.generarTimestamp()
      };
    }
    
    // Agregar al carrito
    logger.progress('Agregando producto al carrito...');
    const agregadoAlCarrito = await agregarAlCarrito(page);
    
    const duration = Date.now() - startTime;
    
    if (agregadoAlCarrito) {
      logger.endOperation(`Búsqueda y adición de producto SKU: ${sku}`, duration);
      logger.success(`✅ Producto ${sku} agregado al carrito exitosamente`);
      
      return {
        sku,
        exito: true,
        mensaje: 'Producto agregado con éxito',
        timestamp: validators.generarTimestamp()
      };
    } else {
      throw new Error('No se pudo agregar el producto al carrito');
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('❌ Error durante búsqueda y adición de producto', {
      sku,
      error: error.message,
      duration: `${duration}ms`
    });
    
    // Capturar screenshot para debugging
    try {
      await page.screenshot({ 
        path: `error-busqueda-${sku}-${Date.now()}.png`, 
        fullPage: true 
      });
      logger.info('Screenshot de error guardado para debugging');
    } catch (screenshotError) {
      logger.warn('No se pudo capturar screenshot de error');
    }
    
    return {
      sku,
      exito: false,
      mensaje: `Error: ${error.message}`,
      timestamp: validators.generarTimestamp()
    };
  }
}

/**
 * Realiza la búsqueda del producto por SKU
 * @param {Object} page - Página de Playwright
 * @param {string} sku - SKU a buscar
 * @returns {Promise<boolean>} true si la búsqueda fue exitosa
 */
async function realizarBusqueda(page, sku) {
  try {
    // Buscar campo de búsqueda
    const campoBuscador = await buscarCampoBuscador(page);
    if (!campoBuscador) {
      throw new Error('No se pudo encontrar el campo de búsqueda');
    }
    
    logger.debug('Campo de búsqueda encontrado');
    
    // Limpiar y escribir SKU
    await campoBuscador.clear();
    await campoBuscador.fill(sku);
    logger.debug(`SKU "${sku}" ingresado en el buscador`);
    
    // Buscar botón de búsqueda o usar Enter
    const botonBuscar = await buscarBotonBusqueda(page);
    
    if (botonBuscar) {
      await botonBuscar.click();
      logger.debug('Botón de búsqueda clickeado');
    } else {
      // Si no hay botón, usar Enter
      await page.keyboard.press('Enter');
      logger.debug('Búsqueda enviada con Enter');
    }
    
    // Esperar a que se carguen los resultados
    await page.waitForTimeout(3000);
    
    // Verificar que no haya mensaje de "sin resultados"
    const hayResultados = await verificarResultadosBusqueda(page);
    
    return hayResultados;
    
  } catch (error) {
    logger.error('Error durante la búsqueda', { error: error.message });
    return false;
  }
}

/**
 * Busca el campo de búsqueda en la página
 * @param {Object} page - Página de Playwright
 * @returns {Promise<Object|null>} Elemento del buscador o null
 */
async function buscarCampoBuscador(page) {
  const selectoresBuscador = [
    'input[type="search"]',
    'input[name*="search"]',
    'input[name*="query"]',
    'input[placeholder*="buscar"]',
    'input[placeholder*="Buscar"]',
    '.search-input',
    '.search-field',
    '[data-test="search-input"]',
    '#search',
    '.search-box input'
  ];
  
  for (const selector of selectoresBuscador) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 2000 })) {
        logger.debug(`Campo buscador encontrado: ${selector}`);
        return elemento;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Busca el botón de búsqueda
 * @param {Object} page - Página de Playwright
 * @returns {Promise<Object|null>} Elemento del botón o null
 */
async function buscarBotonBusqueda(page) {
  const selectoresBoton = [
    'button[type="submit"]:near(input[type="search"])',
    '.search-button',
    '[data-test="search-button"]',
    'button:has-text("Buscar")',
    'button:has-text("Search")',
    '.search-submit',
    'button.search-btn'
  ];
  
  for (const selector of selectoresBoton) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 1000 })) {
        logger.debug(`Botón búsqueda encontrado: ${selector}`);
        return elemento;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Verifica que existan resultados de búsqueda
 * @param {Object} page - Página de Playwright
 * @returns {Promise<boolean>} true si hay resultados
 */
async function verificarResultadosBusqueda(page) {
  // Verificar si hay mensaje de "sin resultados"
  const selectoresSinResultados = [
    '.no-results',
    '.empty-results',
    '.search-empty',
    '[data-test="no-results"]',
    '.no-products-found'
  ];
  
  for (const selector of selectoresSinResultados) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 2000 })) {
        logger.warn('Mensaje de "sin resultados" encontrado');
        return false;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Verificar si hay productos en los resultados
  const selectoresProductos = [
    '.product-item',
    '.product-card',
    '.search-result-item',
    '[data-test="product-item"]',
    '.product-list-item'
  ];
  
  for (const selector of selectoresProductos) {
    try {
      const elementos = await page.locator(selector);
      const count = await elementos.count();
      if (count > 0) {
        logger.debug(`${count} productos encontrados en resultados`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  logger.warn('No se encontraron productos en los resultados');
  return false;
}

/**
 * Busca el producto específico en los resultados por SKU
 * @param {Object} page - Página de Playwright
 * @param {string} sku - SKU del producto a buscar
 * @returns {Promise<boolean>} true si el producto fue encontrado
 */
async function buscarProductoEnResultados(page, sku) {
  try {
    // Buscar producto por SKU en el texto de los resultados
    const selectoresProductos = [
      `.product-item:has-text("${sku}")`,
      `.product-card:has-text("${sku}")`,
      `.search-result-item:has-text("${sku}")`,
      `[data-sku="${sku}"]`,
      `[data-product-id="${sku}"]`
    ];
    
    for (const selector of selectoresProductos) {
      try {
        const elemento = await page.locator(selector).first();
        if (await elemento.isVisible({ timeout: 3000 })) {
          logger.debug(`Producto encontrado con selector: ${selector}`);
          
          // Hacer scroll al producto si es necesario
          await elemento.scrollIntoViewIfNeeded();
          
          // Hacer clic en el producto para ver detalles
          await elemento.click();
          await page.waitForTimeout(2000);
          
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Si no se encuentra directamente, buscar en todos los productos
    logger.debug('Búsqueda directa fallida, revisando todos los productos...');
    return await buscarEnTodosLosProductos(page, sku);
    
  } catch (error) {
    logger.error('Error buscando producto en resultados', { error: error.message });
    return false;
  }
}

/**
 * Busca el SKU en todos los productos de la página de resultados
 * @param {Object} page - Página de Playwright
 * @param {string} sku - SKU a buscar
 * @returns {Promise<boolean>} true si el producto fue encontrado
 */
async function buscarEnTodosLosProductos(page, sku) {
  const selectoresProductos = [
    '.product-item',
    '.product-card',
    '.search-result-item'
  ];
  
  for (const selector of selectoresProductos) {
    try {
      const productos = await page.locator(selector);
      const count = await productos.count();
      
      logger.debug(`Revisando ${count} productos con selector: ${selector}`);
      
      for (let i = 0; i < count; i++) {
        const producto = productos.nth(i);
        const textoProducto = await producto.textContent();
        
        if (textoProducto && textoProducto.includes(sku)) {
          logger.debug(`Producto con SKU ${sku} encontrado en posición ${i}`);
          
          // Hacer scroll y clic en el producto
          await producto.scrollIntoViewIfNeeded();
          await producto.click();
          await page.waitForTimeout(2000);
          
          return true;
        }
      }
    } catch (error) {
      logger.debug(`Error revisando productos con selector ${selector}: ${error.message}`);
      continue;
    }
  }
  
  return false;
}

/**
 * Agrega el producto al carrito
 * @param {Object} page - Página de Playwright
 * @returns {Promise<boolean>} true si el producto fue agregado
 */
async function agregarAlCarrito(page) {
  try {
    // Buscar botón "Agregar al carrito"
    const botonAgregar = await buscarBotonAgregarCarrito(page);
    
    if (!botonAgregar) {
      throw new Error('No se encontró el botón "Agregar al carrito"');
    }
    
    logger.debug('Botón "Agregar al carrito" encontrado');
    
    // Hacer clic en el botón
    await botonAgregar.click();
    logger.debug('Botón "Agregar al carrito" clickeado');
    
    // Esperar confirmación
    await page.waitForTimeout(3000);
    
    // Verificar que el producto fue agregado
    const productoAgregado = await verificarProductoAgregado(page);
    
    return productoAgregado;
    
  } catch (error) {
    logger.error('Error agregando producto al carrito', { error: error.message });
    return false;
  }
}

/**
 * Busca el botón "Agregar al carrito"
 * @param {Object} page - Página de Playwright
 * @returns {Promise<Object|null>} Elemento del botón o null
 */
async function buscarBotonAgregarCarrito(page) {
  const selectoresBotones = [
    'button:has-text("Agregar al carrito")',
    'button:has-text("Agregar")',
    'button:has-text("Add to cart")',
    '.add-to-cart',
    '.btn-add-cart',
    '[data-test="add-to-cart"]',
    'button[aria-label*="Agregar"]',
    '.product-add-button'
  ];
  
  for (const selector of selectoresBotones) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 2000 }) && await elemento.isEnabled()) {
        logger.debug(`Botón agregar carrito encontrado: ${selector}`);
        return elemento;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Verifica que el producto fue agregado al carrito
 * @param {Object} page - Página de Playwright
 * @returns {Promise<boolean>} true si el producto fue agregado
 */
async function verificarProductoAgregado(page) {
  // Buscar mensajes de confirmación
  const selectoresConfirmacion = [
    '.cart-added',
    '.product-added',
    '.success-message',
    '[data-test="product-added"]',
    'text="Producto agregado"',
    'text="Agregado al carrito"',
    '.notification-success'
  ];
  
  for (const selector of selectoresConfirmacion) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 5000 })) {
        logger.debug(`Confirmación de producto agregado: ${selector}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Verificar cambios en el contador del carrito
  const selectoresContador = [
    '.cart-count',
    '.cart-counter',
    '.basket-count',
    '[data-test="cart-count"]'
  ];
  
  for (const selector of selectoresContador) {
    try {
      const elemento = await page.locator(selector).first();
      if (await elemento.isVisible({ timeout: 3000 })) {
        const contador = await elemento.textContent();
        if (contador && parseInt(contador) > 0) {
          logger.debug(`Contador de carrito actualizado: ${contador}`);
          return true;
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  logger.warn('No se pudo verificar que el producto fue agregado al carrito');
  return false;
}

module.exports = {
  buscarYAgregarProducto,
  SKU_OBJETIVO
};
