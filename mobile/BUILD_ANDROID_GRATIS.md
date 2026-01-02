# 🤖 Build Android GRATIS - Guía Paso a Paso

## 🎯 Método Rápido y Gratuito

Vamos a usar **EAS Build** con el plan gratuito que te da builds ilimitados para Android.

---

## ✅ Paso 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

---

## ✅ Paso 2: Login en Expo

Si no tienes cuenta de Expo, créala GRATIS en: https://expo.dev/signup

```bash
cd mobile
eas login
```

Introduce tu email y contraseña de Expo.

---

## ✅ Paso 3: Configurar el Proyecto

```bash
eas build:configure
```

Esto actualizará tu `app.json` con el Project ID de Expo.

**Cuando te pregunte:**
- "Select platform": Selecciona **Android** (o All si quieres iOS también)

---

## ✅ Paso 4: Build APK (GRATIS)

Ahora genera el APK que podrás instalar directamente en tu móvil:

```bash
eas build --platform android --profile preview
```

**¿Qué va a pasar?**
1. EAS subirá tu código a la nube
2. Construirá el APK en servidores de Expo (GRATIS)
3. Te dará un link de descarga cuando termine (~15-20 minutos)

**Durante el proceso te preguntará:**

1. **"Generate a new Android Keystore?"** → Responde: **YES**
   - EAS generará y guardará tu keystore automáticamente en la nube
   - No tienes que preocuparte por nada

2. Verás algo como:
   ```
   ✔ Build started, it may take a few minutes to complete.
   Build details: https://expo.dev/accounts/[tu-usuario]/projects/sustraia-mobile/builds/[build-id]
   ```

---

## ✅ Paso 5: Descargar e Instalar el APK

Una vez que el build termine (recibirás un email):

### Opción A: Desde el Móvil (MÁS FÁCIL)

1. Abre el link del build en tu móvil Android
2. Click en **"Install"** o **"Download"**
3. Abre el APK descargado
4. Acepta "Instalar apps de origen desconocido" si te lo pide
5. ¡Listo! La app se instalará

### Opción B: Desde el PC

1. Descarga el APK desde el link del build
2. Conecta tu móvil Android por USB
3. Copia el APK a tu teléfono
4. En el móvil, abre el archivo con un explorador de archivos
5. Instala el APK

---

## 🔥 Paso 6: Configurar Backend URL

**IMPORTANTE**: Antes de usar la app, asegúrate de que tu backend esté accesible.

### Si tu backend está en localhost:

Tu móvil NO puede acceder a `localhost` del PC. Necesitas:

**Opción 1: Usar ngrok (GRATIS)**

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer tu backend (asumiendo que corre en puerto 3001)
ngrok http 3001
```

Ngrok te dará una URL pública tipo: `https://abc123.ngrok-free.app`

Actualiza `mobile/lib/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'https://abc123.ngrok-free.app/api'  // URL de ngrok
  : 'https://api.sustraia.com/api';
```

**Opción 2: Usar IP local de tu PC**

```bash
# En Windows, obtén tu IP local:
ipconfig

# Busca "IPv4 Address" bajo tu adaptador WiFi
# Ejemplo: 192.168.1.100
```

Actualiza `mobile/lib/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3001/api'  // Tu IP local
  : 'https://api.sustraia.com/api';
```

**IMPORTANTE**: Tu móvil y PC deben estar en la misma red WiFi.

---

## 🎉 ¡Listo!

Ahora puedes:
1. Abrir la app en tu móvil
2. Hacer login
3. Probar todas las funcionalidades
4. Compartir el APK con amigos/testers

---

## 🔄 Actualizar la App

Cuando hagas cambios en el código:

1. Incrementa la versión en `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1",  // Cambiar aquí
       "android": {
         "versionCode": 2    // Incrementar
       }
     }
   }
   ```

2. Genera nuevo build:
   ```bash
   eas build --platform android --profile preview
   ```

3. Descarga e instala el nuevo APK (sobrescribirá la versión anterior)

---

## 💰 Costos

**TODO GRATIS:**
- ✅ Builds Android ilimitados con EAS
- ✅ Distribución del APK
- ✅ Keystore gestionado por Expo
- ✅ Sin límite de instalaciones

**NO necesitas:**
- ❌ Google Play Developer Account ($25)
- ❌ Publicar en Play Store
- ❌ Certificados ni configuraciones complejas

---

## 📊 Monitorear Builds

Ver todos tus builds:
```bash
eas build:list
```

O visita: https://expo.dev/accounts/[tu-usuario]/projects/sustraia-mobile/builds

---

## 🚨 Troubleshooting

### Error: "Failed to build"

```bash
# Limpia cache y reintenta
eas build --platform android --profile preview --clear-cache
```

### Error: "Cannot connect to backend"

Verifica que:
1. Tu backend esté corriendo
2. La URL en `lib/api.ts` sea correcta
3. Si usas IP local, móvil y PC estén en la misma WiFi
4. Si usas ngrok, la URL esté actualizada

### Error: "App no instala"

1. Habilita "Instalar desde orígenes desconocidos" en ajustes Android
2. Verifica que el APK no esté corrupto (descarga de nuevo)

---

## 🎯 Siguiente Paso: Publicar en Google Play (Opcional)

Si después quieres publicar en Google Play:

1. Crea cuenta Google Play Developer ($25 único)
2. Cambia build type a AAB en `eas.json`:
   ```json
   "production": {
     "android": {
       "buildType": "aab"
     }
   }
   ```
3. Build producción: `eas build --platform android --profile production`
4. Submit: `eas submit --platform android`

Pero por ahora, con APK y distribución directa es GRATIS y más rápido.

---

## 📱 Compartir con Testers

Manda el link del build a tus testers:
```
https://expo.dev/accounts/[tu-usuario]/projects/sustraia-mobile/builds/[build-id]
```

O descarga el APK y compártelo por:
- WhatsApp
- Email
- Google Drive
- Telegram

---

**¡Disfruta tu app! 🚀**
