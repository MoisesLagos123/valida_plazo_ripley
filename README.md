# 🚀 Validador de Plazos de Entrega Ripley

Aplicación Node.js que automatiza la validación de fechas de compromiso de entrega en ripley.cl utilizando web scraping con Playwright.

## 🎯 Objetivo Principal

Desarrollar una solución robusta y eficiente para automatizar el proceso de validación de fechas de compromiso de entrega en la plataforma de e-commerce Ripley Chile, proporcionando información precisa sobre los plazos de entrega de productos específicos.

## 📋 Características Principales

- ✅ Autenticación automatizada en ripley.cl
- 🔍 Búsqueda y adición de productos por SKU
- 📅 Extracción precisa de fechas de compromiso de entrega
- 🛡️ Manejo robusto de errores y excepciones
- 📊 Estructura de datos consistente para resultados
- 🔄 Sistema de reintentos automáticos
- 📝 Logging detallado del proceso

## 🏗️ Arquitectura del Proyecto

```
valida_plazo_ripley/
├── package.json           # Configuración del proyecto y dependencias
├── README.md             # Documentación del proyecto
├── .gitignore           # Archivos excluidos del control de versiones
├── .env.example         # Plantilla de variables de entorno
└── src/
    ├── main.js          # Controlador principal
    ├── config/
    │   └── playwright.js # Configuración del navegador
    ├── services/
    │   ├── login.js     # Servicio de autenticación
    │   ├── buscarSku.js # Servicio de búsqueda de productos
    │   └── carrito.js   # Servicio de gestión del carrito
    └── utils/
        ├── logger.js    # Sistema de logging
        └── validators.js # Validadores de datos
```

## 🛠️ Tecnologías Utilizadas

- **Runtime**: Node.js (v18+)
- **Automatización**: Playwright con navegador Chromium
- **Arquitectura**: Modular con separación de responsabilidades
- **Patrones**: Async/await, manejo robusto de errores

## 📦 Instalación

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm (incluido con Node.js)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/MoisesLagos123/valida_plazo_ripley.git
   cd valida_plazo_ripley
   ```

2. **Instalar dependencias y configurar Playwright**
   ```bash
   npm run setup
   ```
   
   O paso a paso:
   ```bash
   npm install
   npx playwright install chromium
   ```

3. **Configurar variables de entorno (opcional)**
   ```bash
   cp .env.example .env
   # Editar .env con tu configuración personalizada
   ```

## 🚀 Uso

### Ejecución Básica

```bash
npm start
```

### Ejecución en Modo Desarrollo

```bash
npm run dev
```

### Scripts Disponibles

- `npm start` - Ejecuta la aplicación
- `npm run dev` - Ejecuta en modo desarrollo con inspector
- `npm run setup` - Instala dependencias y configura Playwright
- `npm run install-playwright` - Instala solo el navegador Chromium

## ⚙️ Configuración

### Variables de Entorno

Puedes personalizar el comportamiento de la aplicación mediante las siguientes variables de entorno:

```env
# Configuración del navegador
HEADLESS=false              # Ejecutar navegador en modo visible
SLOW_MO=100                 # Velocidad de ejecución (ms)

# Timeouts
PAGE_TIMEOUT=30000          # Timeout de página (ms)
ELEMENT_TIMEOUT=10000       # Timeout de elementos (ms)

# Configuración de reintentos
MAX_RETRIES=3               # Número máximo de reintentos
RETRY_DELAY=2000           # Delay entre reintentos (ms)

# SKU objetivo
TARGET_SKU=2000377223468P   # SKU del producto a validar
```

### Credenciales

El sistema utiliza las siguientes credenciales predefinidas para Ripley:
- **Email**: devscrap2025@gmail.com
- **Password**: Dev20252025.

## 📊 Estructura de Datos de Salida

La aplicación retorna un array con la siguiente estructura:

```javascript
const resultados = [
  {
    sku: "2000377223468P",
    fecha_compromiso: "dd-mm-aaaa", // formato chileno
    estado: "Producto agregado con éxito" | "Error: [descripción]",
    timestamp: "2025-01-XX HH:mm:ss" // fecha de ejecución
  }
];
```

## 🔧 Desarrollo

### Estructura de Módulos

#### `src/main.js`
Orquestador principal que coordina todo el flujo de ejecución.

#### `src/services/login.js`
- **Función**: `iniciarSesion(page, credenciales)`
- **Responsabilidad**: Manejo de autenticación en ripley.cl
- **Retorno**: Boolean indicando éxito/fallo

#### `src/services/buscarSku.js`
- **Función**: `buscarYAgregarProducto(page, sku)`
- **Responsabilidad**: Búsqueda y adición de productos al carrito
- **Retorno**: Objeto con resultado de la operación

#### `src/services/carrito.js`
- **Función**: `obtenerFechaCompromiso(page)`
- **Responsabilidad**: Extracción de fecha de entrega del carrito
- **Retorno**: String con fecha formateada

### Estándares de Código

- **Manejo de Errores**: Try/catch en todas las operaciones async
- **Logging**: Console.log para resultados finales, errores críticos y estados de progreso
- **Comentarios**: JSDoc para funciones principales
- **Variables**: Nomenclatura descriptiva, evitar variables globales

## 🚨 Manejo de Errores

La aplicación maneja los siguientes tipos de errores de forma robusta:

- ❌ Producto no disponible
- 🔌 Fallas de conexión de red
- 🎯 Elementos no encontrados en DOM
- ⏱️ Timeouts de página
- 🔐 Errores de autenticación
- 📄 Problemas de navegación

## 🔍 Troubleshooting

### Problemas Comunes

1. **Error de instalación de Playwright**
   ```bash
   npx playwright install chromium --force
   ```

2. **Timeout en elementos**
   - Aumentar `ELEMENT_TIMEOUT` en .env
   - Verificar la estabilidad de la conexión a internet

3. **Producto no encontrado**
   - Verificar que el SKU sea válido
   - Comprobar disponibilidad del producto en ripley.cl

## 📝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas:

1. Revisa la sección de [Troubleshooting](#-troubleshooting)
2. Busca en los [Issues existentes](https://github.com/MoisesLagos123/valida_plazo_ripley/issues)
3. Crea un [nuevo Issue](https://github.com/MoisesLagos123/valida_plazo_ripley/issues/new) si es necesario

## 🔄 Estado del Proyecto

- ✅ Configuración inicial completa
- ⏳ Implementación de servicios en progreso
- ⏳ Testing y validación pendiente
- ⏳ Optimizaciones de rendimiento pendientes

---

**Desarrollado con ❤️ por el Equipo de Desarrollo**
