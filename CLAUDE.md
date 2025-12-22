# EA-Golden Frontend

## Descripción del Proyecto

Dashboard web para visualización y gestión de estrategias de trading de oro (XAUUSD). El sistema consume datos de un backend Python (Orchestrator/Module 7) a través de un proxy de seguridad que maneja autenticación JWT.

**Propósito**: Interfaz de trading profesional que muestra análisis Fibonacci, Order Blocks dinámicos, setups de trading, calendario económico y ejecución de trades manuales.

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| HTML5 | - | Estructura de páginas |
| CSS3 | - | Estilos modulares (Vanilla CSS) |
| JavaScript | ES6+ Modules | Lógica de aplicación |
| Plotly.js | Latest (CDN) | Gráficos dinámicos |

> **Sin frameworks**: Este proyecto usa JavaScript vanilla con ES6 modules. No usa React, Vue, ni otros frameworks.

---

## Estructura del Proyecto

```
Ea-Golden/
├── index.html              # Fibonacci Strategy Report (página principal)
├── setups.html             # Setups Trading Dashboard
├── economicCalendar_modular.html  # Calendario Económico
├── tradeExecution.html     # Ejecución manual de trades
├── login.html              # Página de login
├── css/
│   ├── variables.css       # Variables CSS (colores, spacing)
│   ├── base.css            # Reset y estilos base
│   ├── menu.css            # Menú hamburguesa lateral
│   ├── fibonacci.css       # Estilos para index.html
│   ├── orderblocks.css     # Estilos Order Blocks
│   ├── config.css          # Estilos configuración
│   ├── setups.css          # Estilos setups.html
│   ├── calendar.css        # Estilos calendario
│   ├── trade.css           # Estilos trade execution
│   └── login.css           # Estilos login
└── js/
    ├── shared/             # Código compartido
    │   ├── api.js          # Cliente API con JWT
    │   ├── constants.js    # Constantes y helpers centralizados
    │   ├── utils.js        # Utilidades comunes
    │   └── menu.js         # Lógica menú hamburguesa
    ├── auth/               # Autenticación
    │   ├── authService.js  # Gestión de tokens JWT
    │   ├── authGuard.js    # Protección de rutas
    │   └── login.js        # Lógica de login
    ├── fibonacci/          # Módulo Fibonacci Report
    │   ├── main.js         # Inicialización
    │   ├── tabs.js         # Navegación tabs
    │   ├── timeframes.js   # Cards de timeframes
    │   ├── orderBlocks.js  # Order Blocks estáticos
    │   ├── obDynamics.js   # Order Blocks dinámicos (gráficos)
    │   ├── notes.js        # Sección notas
    │   ├── nivelesD.js     # Niveles desactivados
    │   └── config.js       # Configuración
    ├── setups/             # Módulo Setups Trading
    │   ├── main.js         # Inicialización
    │   ├── setupsList.js   # Lista de setups
    │   ├── setupDetail.js  # Modal de detalle
    │   ├── confluences.js  # Zonas de confluencia
    │   ├── statistics.js   # Estadísticas
    │   ├── proximity.js    # Alertas proximidad
    │   ├── setupsAlmacenados.js  # Setups guardados
    │   └── autoRefresh.js  # Auto-actualización
    ├── calendar/           # Módulo Calendario
    │   ├── main.js
    │   ├── filters.js
    │   ├── events.js
    │   ├── calendar-integration.js
    │   └── autoRefresh.js
    ├── trade/              # Módulo Trade Execution
    │   ├── main.js
    │   ├── tradeForm.js
    │   └── tradeList.js
    └── services/           # Servicios API
        ├── setupsApi.js    # API de setups
        ├── setupsAlmacenadosApi.js  # API setups guardados
        └── tradeService.js # API de trades
```

---

## Convenciones de Código

### Naming
- **Archivos**: `camelCase.js`, `kebab-case.css`
- **Clases CSS**: `kebab-case` (ej: `.summary-card`, `.tab-button`)
- **IDs HTML**: `camelCase` (ej: `#mainContent`, `#setupDetailModal`)
- **Variables JS**: `camelCase`
- **Clases JS**: `PascalCase` (ej: `ApiClient`, `AuthService`)
- **Constantes**: `UPPER_SNAKE_CASE`

### Estructura de Módulos JS
```javascript
/**
 * Nombre del Módulo
 * Descripción breve de la funcionalidad
 */

import { dependency } from '../path/to/module.js';

export class MyService {
    constructor() {
        // Inicialización
    }
    
    async publicMethod() {
        // Métodos públicos con async/await
    }
}

// Singleton export
export const myService = new MyService();

// Export global para debugging en consola
window.myService = myService;
```

### Patrones de Componentes
- **Singleton**: Cada servicio exporta una instancia única
- **ES6 Modules**: Imports/exports nativos del navegador
- **Lazy Loading**: `authService` se carga dinámicamente para evitar dependencias circulares

### Manejo de Estado
- **LocalStorage**: Tokens JWT y datos de usuario
- **Variables globales en window**: Para debugging (`window.apiClient`, `window.authService`)
- **Estado en DOM**: IDs únicos para elementos dinámicos

### Estilos CSS
- **Variables CSS**: Definidas en `variables.css`
- **Sin preprocesadores**: CSS vanilla
- **Mobile-first**: Media queries para desktop

---

## Integración con Security Filter

### Base URL
```javascript
const BASE_URL = 'https://securityfilter-golden.onrender.com/api';
```

### Autenticación JWT

Todas las peticiones (excepto login) requieren autenticación:

```javascript
// Headers requeridos
{
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer <JWT_TOKEN>'
}
```

### Flujo de Autenticación

```
1. Usuario → POST /api/login {username, password}
2. Server  → {data: {access_token, refresh_token, user}}
3. Frontend almacena tokens en localStorage
4. Cada petición incluye Authorization header
5. Si 401 → Intenta refresh con /api/refresh
6. Si refresh falla → Logout y redirect a login.html
```

### Endpoints Disponibles

#### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/login` | Login con credenciales |
| POST | `/api/logout` | Cerrar sesión |
| POST | `/api/refresh` | Renovar access token |
| GET | `/api/validate-token` | Validar token actual |
| GET | `/api/csrf-token` | Obtener token CSRF |
| GET | `/api/health` | Health check del sistema |

#### Fibonacci Report
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/security-filter/fibonacci-report` | Reporte completo de Fibonacci |
| POST | `/api/security-filter/process-ob-report` | Procesar Order Blocks dinámicos |

#### Calendario Económico
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/security-filter/economic-calendar` | Eventos económicos del día |

#### Setups Trading (Module 7)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/security-filter/setups/active` | Setups activos con confluencias |
| GET | `/api/security-filter/setups/summary` | Resumen para widgets |
| GET | `/api/security-filter/setups/{id}` | Detalle de setup específico |
| GET | `/api/security-filter/setups/confluences` | Zonas de confluencia |
| GET | `/api/security-filter/setups/statistics` | Estadísticas del sistema |
| GET | `/api/security-filter/setups/status` | Estado del sistema |
| GET | `/api/security-filter/setups/by-type/{type}` | Filtrar por SIMPLE/COMPLEX |
| GET | `/api/security-filter/setups/by-proximity?max_distance_pips=50` | Por proximidad |
| POST | `/api/security-filter/setups/refresh?force=true` | Forzar actualización |
| GET | `/api/security-filter/setups/health` | Health check del módulo |

#### Setups Almacenados
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/security-filter/setups/stored` | Listar setups almacenados |
| GET | `/api/security-filter/setups/stored/{id}` | Detalle de setup almacenado |

#### Trade Execution
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/security-filter/trades` | Trades activos |
| POST | `/api/security-filter/trades` | Ejecutar nuevo trade |

### Ejemplo de Petición

```javascript
import { apiClient } from './js/shared/api.js';

// GET request autenticado
const data = await apiClient.get('/security-filter/setups/active');

// POST request autenticado
const result = await apiClient.post('/security-filter/setups/refresh', null);
```

### Manejo de Errores

```javascript
try {
    const data = await apiClient.get('/security-filter/setups/active');
} catch (error) {
    // Errores comunes:
    // - "Authentication failed" → Token expirado
    // - "Request timeout" → Servidor no responde (60s timeout)
    // - "Network error" → Sin conexión
    console.error(error.message);
}
```

---

## Variables de Entorno

Este proyecto es 100% frontend y no requiere variables de entorno. La configuración está hardcodeada:

```javascript
// js/shared/api.js
this.baseUrl = 'https://securityfilter-golden.onrender.com/api';
this.timeout = 60000; // 60 segundos

// js/auth/authService.js
this.tokenKey = 'ea_golden_token';
this.userKey = 'ea_golden_user';
this.csrfTokenKey = 'ea_golden_csrf';
```

---

## Comandos de Desarrollo

```bash
# No hay build process - abrir directamente en navegador
# Usar servidor local para evitar problemas CORS con ES6 modules:

# Con Python
python -m http.server 8080

# Con Node.js
npx serve .

# Con VS Code
# Usar extensión "Live Server"
```

---

## Reglas de Negocio Críticas

1. **Solo XAUUSD**: El sistema está diseñado exclusivamente para trading de oro
2. **Timeframes soportados**: M5, M15, M30, H1, H1_I, H4, D1
3. **Tipos de Setup**:
   - `COMPLEX`: Setups con múltiples confirmaciones
   - `SIMPLE`: Setups básicos
4. **Scoring**: 0-10 (≥7.0 = Excelente, ≥5.0 = Bueno, ≥3.0 = Regular)
5. **Proximidad**: Alerta cuando precio está a ≤20 pips del setup
6. **Auto-refresh**: Los datos se actualizan automáticamente cada 30-60 segundos

---

## Decisiones Arquitectónicas

1. **Sin frameworks**: Vanilla JS para máxima compatibilidad y rendimiento
2. **ES6 Modules nativos**: Sin bundler (Webpack/Vite), carga directa en navegador
3. **Singleton pattern**: Servicios como instancias únicas para estado compartido
4. **Security Filter como proxy**: El frontend nunca se comunica directamente con el backend Python
5. **JWT en localStorage**: Tokens almacenados localmente con auto-refresh
6. **CSS modular sin preprocesador**: Cada página carga solo los CSS que necesita

---

## Testing

No hay configuración de testing automatizado. Para probar manualmente:

1. Abrir DevTools Console
2. Verificar que no hay errores de carga de módulos
3. Probar login/logout
4. Verificar que los datos cargan correctamente
5. Los servicios están expuestos en `window` para testing:
   ```javascript
   // En consola del navegador
   await window.apiClient.get('/security-filter/setups/active');
   window.authService.getCurrentUser();
   ```

---

## Notas para Claude

- Siempre usar `async/await` para llamadas API
- Los archivos JS usan `export`/`import` de ES6 modules
- Cargar primero `authGuard.js` en cada página protegida
- El menú hamburguesa y estilos base son compartidos via `menu.js` y `menu.css`
- Para agregar nueva funcionalidad: crear módulo en carpeta correspondiente, importar en `main.js`
