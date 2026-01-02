# 🚀 Build Android GRATIS - SUSTRAIA

## 🎯 Método Más Rápido (5 minutos de tu tiempo)

Ya está **TODO CONFIGURADO**. Solo necesitas 3 comandos:

---

## ⚡ OPCIÓN 1: Ejecutar Script Automático (Recomendado)

### Windows:

1. Abre la carpeta `mobile` en el explorador
2. Doble click en `build-android.bat`
3. Sigue las instrucciones en pantalla

**El script hace:**
- ✅ Login en Expo
- ✅ Inicializa proyecto
- ✅ Construye APK
- ✅ Te da el link de descarga

---

## ⚡ OPCIÓN 2: Comandos Manuales

Abre terminal en la carpeta `mobile`:

```bash
# 1. Login (necesitas cuenta Expo gratis)
eas login

# 2. Inicializar proyecto
eas init --id auto

# 3. Build APK (tarda ~15 min)
eas build --platform android --profile preview
```

---

## 📋 Requisitos Previos

### ✅ Ya Configurado Por Mí:
- [x] `app.json` con permisos Android
- [x] `eas.json` con build profile
- [x] Plugins necesarios
- [x] EAS CLI instalado

### 📝 Lo Que Tú Necesitas:

1. **Cuenta Expo (GRATIS)**
   - Crear en: https://expo.dev/signup
   - Solo email y contraseña
   - Sin tarjeta de crédito

2. **Móvil Android**
   - Para instalar el APK
   - Android 5.0 o superior

---

## 📥 Después del Build

Cuando termine (recibirás email + link), tienes 2 opciones:

### Opción A - Desde el Móvil (MÁS FÁCIL):

1. Abre el link del build en tu móvil Android
2. Toca "Install" o descarga el APK
3. Abre el archivo descargado
4. Acepta "Instalar desde orígenes desconocidos"
5. ✅ ¡App instalada!

### Opción B - Desde PC:

1. Descarga el APK desde el link
2. Pasa el APK a tu móvil por:
   - USB
   - Email
   - WhatsApp
   - Google Drive
3. Abre el APK en tu móvil
4. Instala

---

## 🔧 Configurar Backend

**IMPORTANTE**: La app necesita conectarse a tu backend.

### Si tu backend está en localhost:

Tu móvil NO puede acceder a `localhost`. Opciones:

#### OPCIÓN 1 - IP Local (mismo WiFi)

```bash
# En Windows:
ipconfig

# Busca IPv4 Address (ej: 192.168.1.100)
```

Edita `mobile/lib/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3001/api'  // Tu IP aquí
  : 'https://api.sustraia.com/api';
```

**IMPORTANTE**: Móvil y PC en la MISMA red WiFi.

#### OPCIÓN 2 - ngrok (más fácil, funciona siempre)

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer backend (puerto 3001)
ngrok http 3001
```

Te dará una URL pública: `https://abc123.ngrok-free.app`

Edita `mobile/lib/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'https://abc123.ngrok-free.app/api'  // URL de ngrok
  : 'https://api.sustraia.com/api';
```

#### OPCIÓN 3 - Backend en producción

Si ya tienes backend desplegado en la nube, úsalo directamente:

```typescript
const API_BASE_URL = 'https://api.sustraia.com/api';
```

---

## 🔄 Actualizar la App

Cuando hagas cambios:

1. **Incrementar versión** en `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1",
       "android": {
         "versionCode": 2
       }
     }
   }
   ```

2. **Rebuild**:
   ```bash
   eas build --platform android --profile preview
   ```

3. **Reinstalar**: Descarga el nuevo APK e instala (sobrescribe el anterior)

---

## 🎁 Extras Ya Incluidos

Tu app ya tiene configurado:

- ✅ **Push Notifications** (Expo Notifications)
- ✅ **Image Picker** (subir fotos)
- ✅ **Deep Linking** (navegación desde notificaciones)
- ✅ **WebSocket** (chat en tiempo real)
- ✅ **Strava OAuth** (sincronización)

---

## 📊 Monitorear Builds

### Ver todos tus builds:

```bash
eas build:list
```

O visita: https://expo.dev

### Ver progreso en tiempo real:

Cuando ejecutes el build, te dará un link tipo:
```
https://expo.dev/accounts/[usuario]/projects/sustraia-mobile/builds/[id]
```

Ábrelo en el navegador para ver:
- Logs en vivo
- Progreso del build
- Errores (si hay)
- Link de descarga cuando termine

---

## 🚨 Troubleshooting

### ❌ Error: "Build failed"

**Solución:**
```bash
eas build --platform android --profile preview --clear-cache
```

### ❌ Error: "Cannot connect to backend"

**Verifica:**
1. Backend esté corriendo
2. URL en `lib/api.ts` sea correcta
3. Si usas IP local: mismo WiFi
4. Si usas ngrok: URL actualizada

### ❌ Error: "App no instala"

**Solución:**
1. Ajustes Android → Seguridad → "Instalar desde orígenes desconocidos" → Activar
2. Descarga el APK de nuevo (puede estar corrupto)

### ❌ Error: "EAS login failed"

**Solución:**
1. Verifica usuario y contraseña en expo.dev
2. Si no tienes cuenta: https://expo.dev/signup

---

## 💰 Costos

**TODO ES GRATIS:**
- ✅ Builds Android ilimitados
- ✅ Distribución del APK
- ✅ Keystore managed por Expo
- ✅ Sin límite de instalaciones
- ✅ Sin tarjeta de crédito

**NO necesitas (por ahora):**
- ❌ Google Play Developer Account ($25)
- ❌ Publicar en Play Store
- ❌ Configuraciones complejas

---

## 📱 Compartir con Testers

Puedes compartir el APK con cualquiera:

1. **Link directo** del build
2. **APK descargado** por WhatsApp, Email, Drive, etc.
3. **Sin límite** de instalaciones

---

## 🎯 Siguiente Paso: Google Play (Opcional)

Cuando estés listo para publicar en Play Store:

1. Crea cuenta Google Play Developer ($25 único)
2. Cambia a AAB en `eas.json`:
   ```json
   "production": {
     "android": {
       "buildType": "aab"
     }
   }
   ```
3. Build producción:
   ```bash
   eas build --platform android --profile production
   eas submit --platform android
   ```

**Pero por ahora, APK gratis es perfecto para testing.**

---

## ✅ Resumen Ultra Rápido

```bash
# Solo 3 comandos:
cd mobile
eas login                                          # 1 minuto
eas init --id auto                                 # 30 segundos
eas build --platform android --profile preview    # 15-20 min (espera)

# O doble-click en: build-android.bat
```

**¡Listo! 🎉**

---

## 📚 Archivos de Ayuda Creados

- `BUILD_ANDROID_GRATIS.md` - Guía detallada paso a paso
- `COMANDOS_BUILD.txt` - Lista de comandos
- `build-android.bat` - Script automático Windows
- `eas.json` - Configuración de builds
- `app.json` - Ya configurado con permisos

**TODO LISTO para empezar.**

---

**¿Dudas?** Lee `BUILD_ANDROID_GRATIS.md` para más detalles.

**¡Suerte con tu build! 🚀**
