# 🔄 Guía de Tokens de Strava - SUSTRAIA

## ⏰ ¿Por qué expiran los tokens?

Los tokens de acceso de Strava expiran después de **6 horas** por razones de seguridad. SUSTRAIA está configurado para **refrescar automáticamente** estos tokens usando el `refresh_token`, por lo que normalmente no deberías tener problemas.

---

## 🛠️ Sistema de Refresh Automático

El sistema está implementado en `server/services/stravaService.ts`:

```typescript
// La función getValidToken() verifica automáticamente:
// 1. Si el token expira en menos de 5 minutos
// 2. Intenta refrescarlo con el refresh_token
// 3. Actualiza la base de datos con el nuevo token
// 4. Retorna el token válido
```

**Esto significa que el usuario NO debería necesitar reconectar su cuenta manualmente.**

---

## ❌ ¿Cuándo PUEDE fallar el refresh automático?

1. **El refresh_token también ha expirado** (muy raro, pero puede pasar después de meses sin usar la app)
2. **El usuario ha revocado el acceso** desde su configuración de Strava
3. **Cambios en la aplicación de Strava** (como cuando actualizaste de 1 a 999 usuarios)
4. **Credenciales incorrectas** en las variables de entorno

---

## 🔍 Diagnóstico del Problema

### 1. Verifica las variables de entorno

Asegúrate de que tu archivo `.env` (o variables en Render) tengan las credenciales correctas:

```bash
STRAVA_CLIENT_ID=tu_client_id_aqui
STRAVA_CLIENT_SECRET=tu_client_secret_aqui
STRAVA_REDIRECT_URI=https://tudominio.com/auth/strava/callback
```

**IMPORTANTE**: Si cambiaste algo en tu aplicación de Strava (como el límite de usuarios), verifica que:
- El `CLIENT_ID` no haya cambiado
- El `CLIENT_SECRET` no haya cambiado
- La "Authorization Callback Domain" en Strava settings esté correcta

### 2. Revisa los logs del servidor

Cuando un token expira, verás en los logs:

```bash
🔄 Token expired or expiring soon for user abc123, refreshing...
✅ Token refreshed successfully for user abc123
```

Si falla el refresh, verás:

```bash
❌ Failed to refresh token for user abc123: [error details]
```

### 3. Revisa la base de datos

Conéctate a tu base de datos y revisa la tabla `StravaToken`:

```sql
SELECT userId, expiresAt, createdAt
FROM "StravaToken"
WHERE userId = 'tu_user_id';
```

Si `expiresAt` está muy en el pasado (varios meses), es posible que el refresh_token también haya expirado.

---

## 🔧 Soluciones

### Solución 1: Reconectar Strava (Usuario final)

El usuario debe:

1. Ir a su dashboard de atleta
2. Buscar la sección de "Conexión con Strava"
3. Click en "Desconectar Strava" (si está conectado)
4. Click en "Conectar con Strava"
5. Autorizar de nuevo en la página de Strava
6. ¡Listo! Nuevos tokens guardados

### Solución 2: Eliminar tokens viejos (Base de datos)

Si el usuario no puede reconectar desde la UI:

```sql
-- Elimina los tokens viejos
DELETE FROM "StravaToken" WHERE userId = 'user_id_aqui';
```

Luego el usuario puede conectar como si fuera la primera vez.

### Solución 3: Verificar credenciales de Strava

1. Ve a https://www.strava.com/settings/api
2. Verifica que tu aplicación tenga:
   - **Authorization Callback Domain**: correcto
   - **Client ID**: lo tienes en `.env`
   - **Client Secret**: haz click en "Show" y verifica que coincida con `.env`

Si cambiaste algo, **actualiza tus variables de entorno** y **redeploy** el backend.

### Solución 4: Rate Limits de Strava

Strava tiene rate limits:
- **600 requests per 15 minutes**
- **30,000 requests per day**

Si estás haciendo muchas peticiones (ej: importando actividades de 100 usuarios al mismo tiempo), podrías estar siendo bloqueado temporalmente.

**Solución**: Espera 15 minutos y vuelve a intentar.

---

## 🚀 Mejoras Futuras (Opcional)

### 1. Mostrar estado del token en UI

En el dashboard del atleta, podrías mostrar:

```typescript
// Ejemplo de componente
<div className="bg-gray-100 p-4 rounded-lg">
  <p>Strava conectado</p>
  <p className="text-sm text-gray-600">
    Token válido hasta: {new Date(expiresAt).toLocaleDateString()}
  </p>
  {needsRefresh && (
    <button onClick={reconnectStrava}>
      ⚠️ Token expirando, reconectar ahora
    </button>
  )}
</div>
```

### 2. Auto-refresh proactivo

Actualmente refrescamos cuando el token expira en < 5 minutos. Podrías hacer un job que refresque todos los tokens que expiren en las próximas 24 horas:

```typescript
// server/jobs/refreshStravaTokens.ts
export async function refreshExpiringTokens() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const expiringTokens = await prisma.stravaToken.findMany({
    where: {
      expiresAt: { lte: tomorrow }
    }
  });

  for (const token of expiringTokens) {
    try {
      await getValidToken(token.userId); // Esto los refrescará automáticamente
    } catch (error) {
      console.error(`Failed to refresh token for user ${token.userId}`);
    }
  }
}

// Ejecutar cada 6 horas con node-cron
import cron from 'node-cron';
cron.schedule('0 */6 * * *', refreshExpiringTokens);
```

### 3. Notificar al usuario cuando falle el refresh

Cuando el refresh falle, envía un email o notificación push:

```typescript
// En stravaService.ts, cuando falla el refresh:
await sendEmail(userEmail, {
  subject: 'Reconecta tu cuenta de Strava',
  body: 'Tu conexión con Strava ha expirado. Por favor, reconecta tu cuenta.'
});
```

---

## 📋 Checklist de Troubleshooting

Si un usuario reporta "Token expirado":

- [ ] Verifica que las credenciales de Strava en `.env` sean correctas
- [ ] Revisa los logs del servidor para ver el error exacto
- [ ] Comprueba la tabla `StravaToken` en la base de datos
- [ ] Intenta que el usuario desconecte y reconecte Strava desde la UI
- [ ] Si persiste, elimina el token de la BD y vuelve a conectar
- [ ] Verifica que no estés excediendo rate limits de Strava
- [ ] Asegúrate de que la aplicación de Strava esté configurada correctamente

---

## 🎯 Resumen

**El sistema de SUSTRAIA YA MANEJA el refresh automático de tokens.** Si estás viendo errores de "token expired":

1. **Causa más probable**: El usuario necesita reconectar su cuenta (el refresh_token expiró)
2. **Solución inmediata**: Desconectar y reconectar Strava desde la UI
3. **Prevención**: Los tokens se refrescan automáticamente, pero si no usas la app por meses, pueden expirar

---

## 📞 Soporte Adicional

Si después de todo esto sigues teniendo problemas:

1. Revisa la documentación oficial de Strava: https://developers.strava.com/docs/authentication/
2. Verifica que tu aplicación esté en modo "Approved" (no en modo "Sandbox")
3. Contacta con Strava Support si crees que hay un problema con tu aplicación

---

**Última actualización**: 2026-01-09
