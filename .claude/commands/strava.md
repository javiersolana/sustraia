# Integración Completa con Strava

**ultrathink and implement full Strava integration**

SCOPE:
1. OAuth 2.0 flow (authorization + token exchange)
2. Token storage seguro (DB)
3. Token refresh automático
4. Webhook para nuevas actividades
5. Sincronización bidireccional
6. Manejo de errores y rate limits
7. Tests end-to-end

IMPLEMENTATION:
1. Backend endpoint `/api/strava/auth` (redirect to Strava)
2. Callback endpoint `/api/strava/callback` (exchange code for token)
3. Token refresh job (cronjob cada 30 min)
4. Webhook endpoint `/api/strava/webhook` (receive activities)
5. Sync service (fetch activities, map to workouts)
6. Frontend: botón "Conectar Strava" en dashboard
7. UI: estado de conexión (conectado/desconectado)

TESTS:
- Unit tests para cada servicio
- Integration tests para OAuth flow
- Mock Strava API responses
- Test webhook handling
- Test token refresh logic

SECURITY:
- Tokens encriptados en DB
- HTTPS obligatorio
- CSRF protection
- Rate limit: 100 req/15min per user

Don't stop until it works flawlessly with comprehensive test coverage.

