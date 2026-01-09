# 🚀 Guía de Despliegue - SUSTRAIA

Esta guía cubre el despliegue completo de SUSTRAIA en producción usando:
- **Frontend**: Vercel
- **Backend**: Render
- **Base de Datos**: Supabase (PostgreSQL)

---

## 📋 Pre-requisitos

Antes de empezar, asegúrate de tener:

- ✅ Cuenta en [Vercel](https://vercel.com)
- ✅ Cuenta en [Render](https://render.com)
- ✅ Cuenta en [Supabase](https://supabase.com)
- ✅ Cuenta en [Strava Developers](https://developers.strava.com)
- ✅ Repositorio en GitHub con el código

---

## 🗄️ PASO 1: Configurar Supabase (Base de Datos)

### 1.1 Crear Proyecto en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Clic en "New Project"
3. Completa:
   - **Name**: `sustraia-prod`
   - **Database Password**: (genera uno seguro y guárdalo)
   - **Region**: Elige la más cercana (Europe West para España)
4. Espera 2-3 minutos mientras se crea

### 1.2 Obtener Credenciales

Una vez creado, ve a **Settings > Database** y copia:

```bash
# Connection string (pooling - para Prisma)
DATABASE_URL="postgresql://postgres.xxxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true"

# Direct connection (para migraciones)
DIRECT_URL="postgresql://postgres.xxxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

### 1.3 Ejecutar Migraciones

Desde tu terminal local:

```bash
# 1. Configura las variables de entorno localmente
cp .env.example .env
# Edita .env y pega tus URLs de Supabase

# 2. Ejecuta las migraciones
npx prisma migrate deploy

# 3. Genera el cliente de Prisma
npx prisma generate

# 4. Seed de achievements (opcional pero recomendado)
# Esto lo haremos desde el backend desplegado
```

---

## 🔧 PASO 2: Configurar Backend en Render

### 2.1 Crear Web Service

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Clic en "New +" > "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `sustraia-api`
   - **Region**: Frankfurt (EU Central)
   - **Branch**: `main`
   - **Root Directory**: `./` (vacío si está en la raíz)
   - **Runtime**: Node
   - **Build Command**:
     ```bash
     npm install && npx prisma generate
     ```
   - **Start Command**:
     ```bash
     npm run server
     ```
   - **Instance Type**: Starter (gratis) o Standard si necesitas más recursos

### 2.2 Configurar Variables de Entorno

En **Environment** > **Environment Variables**, agrega:

```bash
# Database
DATABASE_URL=tu_url_de_supabase_pooling
DIRECT_URL=tu_url_de_supabase_direct

# Server
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=genera_un_secret_seguro_aqui_min_32_chars

# Strava OAuth
STRAVA_CLIENT_ID=tu_strava_client_id
STRAVA_CLIENT_SECRET=tu_strava_client_secret
STRAVA_REDIRECT_URI=https://sustraia.vercel.app/auth/strava/callback
STRAVA_WEBHOOK_VERIFY_TOKEN=genera_otro_token_aleatorio

# Frontend URL (para CORS)
FRONTEND_URL=https://sustraia.vercel.app

# Email (opcional - para notificaciones)
# Si usas Gmail SMTP:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password
EMAIL_FROM=Sustraia <noreply@sustraia.com>
```

**Importante**: Para `JWT_SECRET` usa un generador seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3 Desplegar

1. Clic en "Create Web Service"
2. Espera ~5-10 min mientras se construye
3. Una vez desplegado, copia tu URL: `https://sustraia-api.onrender.com`

### 2.4 Seed de Achievements

Una vez desplegado, ejecuta el seed:

```bash
# Opción 1: Desde Postman o Thunder Client
POST https://sustraia-api.onrender.com/api/achievements/seed
Headers:
  Authorization: Bearer <tu_token_de_admin>

# Opción 2: Crear un script temporal
# Agrega esto a server/index.ts temporalmente:
// await seedAchievements();
# Luego redeploy y quítalo
```

---

## 🌐 PASO 3: Configurar Frontend en Vercel

### 3.1 Conectar Repositorio

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Clic en "Add New..." > "Project"
3. Importa tu repositorio de GitHub
4. Configura:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (o donde esté tu package.json)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.2 Configurar Variables de Entorno

En **Settings** > **Environment Variables**, agrega:

```bash
# Backend API URL
VITE_API_URL=https://sustraia-api.onrender.com

# Modo
NODE_ENV=production
```

**Importante**: En Vercel, las variables con prefijo `VITE_` son las únicas accesibles en el frontend.

### 3.3 Configurar Dominio (Opcional)

Si tienes un dominio propio:

1. Ve a **Settings** > **Domains**
2. Agrega tu dominio: `www.sustraia.com`
3. Sigue las instrucciones para configurar DNS
4. Vercel proporciona SSL automático

### 3.4 Desplegar

1. Clic en "Deploy"
2. Espera ~2-3 min
3. Tu app estará en: `https://sustraia.vercel.app` (o tu dominio)

---

## 🏃 PASO 4: Configurar Strava OAuth

### 4.1 Crear Aplicación en Strava

1. Ve a [Strava Settings](https://www.strava.com/settings/api)
2. Crea una nueva aplicación:
   - **Application Name**: Sustraia
   - **Category**: Training
   - **Club**: (opcional)
   - **Website**: https://sustraia.vercel.app
   - **Authorization Callback Domain**: `sustraia.vercel.app`

3. Copia:
   - **Client ID**
   - **Client Secret**

### 4.2 Actualizar Variables de Entorno

Regresa a Render y actualiza:

```bash
STRAVA_CLIENT_ID=tu_client_id_de_strava
STRAVA_CLIENT_SECRET=tu_client_secret_de_strava
STRAVA_REDIRECT_URI=https://sustraia.vercel.app/auth/strava/callback
```

Haz lo mismo en Vercel si necesitas exponer estas variables al frontend.

---

## 🔔 PASO 5: Configurar Webhooks de Strava (Opcional)

Para recibir actividades automáticamente:

### 5.1 Crear Webhook Subscription

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=TU_CLIENT_ID \
  -F client_secret=TU_CLIENT_SECRET \
  -F 'callback_url=https://sustraia-api.onrender.com/api/strava/webhook' \
  -F 'verify_token=TU_WEBHOOK_VERIFY_TOKEN'
```

### 5.2 Verificar

```bash
curl -G https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=TU_CLIENT_ID \
  -d client_secret=TU_CLIENT_SECRET
```

---

## ✅ PASO 6: Verificar Despliegue

### 6.1 Checklist de Backend

```bash
# Health check
curl https://sustraia-api.onrender.com/health

# Verificar que las rutas funcionen
curl https://sustraia-api.onrender.com/api/achievements

# Verificar CORS (debe devolver 200, no error)
curl -H "Origin: https://sustraia.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://sustraia-api.onrender.com/api/auth/login
```

### 6.2 Checklist de Frontend

1. Abre https://sustraia.vercel.app
2. Verifica:
   - ✅ Landing page se carga correctamente
   - ✅ Puedes hacer login
   - ✅ Dashboard del atleta/coach se muestra
   - ✅ Puedes conectar Strava
   - ✅ Logros se cargan en `/achievements`

---

## 🐛 Troubleshooting Común

### Error: "CORS policy blocked"

**Causa**: El backend no está permitiendo requests del frontend.

**Solución**: Verifica que en `server/index.ts` tengas:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

Y que `FRONTEND_URL` esté configurada en Render.

### Error: "Prisma Client not generated"

**Causa**: El cliente de Prisma no se generó en el build.

**Solución**: Agrega `npx prisma generate` a tu Build Command en Render:

```bash
npm install && npx prisma generate
```

### Error: "JWT token invalid"

**Causa**: El `JWT_SECRET` no coincide entre builds.

**Solución**: Usa el mismo `JWT_SECRET` siempre. Nunca lo cambies después del primer despliegue.

### Backend se queda "dormido" (Render Free Tier)

**Causa**: Render duerme los servicios gratuitos después de 15 min de inactividad.

**Solución Temporal**: Usa un servicio de ping como [UptimeRobot](https://uptimerobot.com) para hacer ping cada 10 min.

**Solución Permanente**: Upgrade a Render Starter ($7/mes).

### Frontend no encuentra el API

**Causa**: Variable `VITE_API_URL` no está configurada.

**Solución**: En Vercel > Settings > Environment Variables, agrega:

```bash
VITE_API_URL=https://sustraia-api.onrender.com
```

Luego redeploy.

---

## 🔄 Actualizaciones Futuras

### Actualizar Backend

1. Haz push a tu branch `main`
2. Render detectará el cambio y redeployará automáticamente
3. Si cambiaste el schema de Prisma:
   ```bash
   # Localmente primero
   npx prisma migrate dev --name nombre_de_migracion
   git add prisma/migrations
   git commit -m "feat: add nueva migracion"
   git push

   # Render ejecutará automáticamente: npx prisma migrate deploy
   ```

### Actualizar Frontend

1. Haz push a `main`
2. Vercel redeployará automáticamente
3. Si agregaste nuevas variables de entorno, agrégalas en Vercel Settings primero

---

## 📊 Monitoreo

### Logs en Render

- Ve a tu servicio > Logs
- Usa filtros para buscar errores: `error`, `ERROR`, `failed`

### Logs en Vercel

- Ve a tu proyecto > Deployments > [último deploy] > Build Logs
- Para runtime logs: usa Vercel Analytics (de pago)

### Supabase Logs

- Database > Logs
- Puedes ver queries lentas, errores de conexión, etc.

---

## 💰 Costos Estimados

### Setup Gratuito (Ideal para empezar)

- ✅ Vercel: Gratis (hasta 100GB bandwidth/mes)
- ✅ Render: Gratis (se duerme después de 15 min inactividad)
- ✅ Supabase: Gratis (hasta 500MB DB, 2GB bandwidth)
- **Total**: $0/mes

### Setup Recomendado (Producción)

- ✅ Vercel Pro: $20/mes (dominio custom, analytics)
- ✅ Render Starter: $7/mes (siempre activo, 512MB RAM)
- ✅ Supabase Pro: $25/mes (8GB DB, backups diarios)
- **Total**: ~$52/mes

---

## 🎯 Próximos Pasos

1. **Monitoreo**: Configura alertas en Render/Vercel para downtime
2. **Analytics**: Agrega Google Analytics o Plausible
3. **Performance**: Usa Lighthouse para optimizar
4. **SEO**: Agrega meta tags en landing pages
5. **Email Marketing**: Conecta con Mailchimp/SendGrid

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de Render/Vercel
2. Verifica variables de entorno
3. Prueba endpoints con Postman
4. Busca en la documentación oficial:
   - [Render Docs](https://render.com/docs)
   - [Vercel Docs](https://vercel.com/docs)
   - [Supabase Docs](https://supabase.com/docs)

---

## 🎉 ¡Listo!

Tu aplicación SUSTRAIA ahora está en producción con:
- ✅ 115 logros implementados
- ✅ Sistema de sincronización con Strava
- ✅ Notificaciones dopaminérgicas
- ✅ Estimación inteligente de distancia
- ✅ Cálculo correcto de ritmo promedio
- ✅ Backend + Frontend + DB escalables

**URL de Producción**: https://sustraia.vercel.app
**API de Producción**: https://sustraia-api.onrender.com

¡A correr! 🏃‍♂️💨
