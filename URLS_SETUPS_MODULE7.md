# URLs para Registrar en el Sistema de Seguridad - Módulo 7

## Endpoints del Module 7 Integration Gateway que necesitas registrar:

### 1. Setups Principales
```
GET /api/security-filter/setups/active
GET /api/security-filter/setups/summary
GET /api/security-filter/setups/{setup_id}
```

### 2. Confluencias y Estadísticas
```
GET /api/security-filter/setups/confluences
GET /api/security-filter/setups/statistics
GET /api/security-filter/setups/status
```

### 3. Operaciones
```
POST /api/security-filter/setups/refresh
```

### 4. Filtros
```
GET /api/security-filter/setups/by-type/{setup_type}
GET /api/security-filter/setups/by-proximity
```

### 5. Health Check
```
GET /api/security-filter/setups/health
```

## Configuración de Proxy

Estos endpoints deben hacer proxy hacia el backend del Module 7:
- **Backend URL**: `http://localhost:8000/api/`
- **Headers requeridos**:
  - `X-API-Key: golden-fib-api-2025`
  - `Authorization: Bearer {JWT_FROM_FRONTEND}`

## Ejemplo de Configuración

Para cada endpoint, el sistema de seguridad debe:

1. Verificar el JWT del frontend
2. Agregar el X-API-Key interno
3. Hacer proxy hacia `http://localhost:8000/api/setups/active` (sin el prefijo security-filter)

### Ejemplo:
```
Frontend Request: GET /api/security-filter/setups/active
                 Headers: Authorization: Bearer {jwt_token}

Security System: GET http://localhost:8000/api/setups/active
                Headers: X-API-Key: golden-fib-api-2025
                        Authorization: Bearer {jwt_token}
```

## URLs Completas a Registrar:

1. `GET /api/security-filter/setups/active`
2. `GET /api/security-filter/setups/summary`
3. `GET /api/security-filter/setups/{setup_id}`
4. `GET /api/security-filter/setups/confluences`
5. `GET /api/security-filter/setups/statistics`
6. `POST /api/security-filter/setups/refresh`
7. `GET /api/security-filter/setups/status`
8. `GET /api/security-filter/setups/by-type/{setup_type}`
9. `GET /api/security-filter/setups/by-proximity`
10. `GET /api/security-filter/setups/health`

## Parámetros de Query permitidos:

- `/setups/refresh`: `?force=true|false`
- `/setups/by-proximity`: `?max_distance_pips=50.0`

Una vez registrados estos endpoints en tu sistema de seguridad, el frontend debería conectar correctamente con el Module 7.