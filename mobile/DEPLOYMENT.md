# 📱 Guía de Deployment - SUSTRAIA Mobile

Guía completa para desplegar la aplicación móvil de SUSTRAIA en iOS (App Store) y Android (Google Play Store).

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Build de Desarrollo](#build-de-desarrollo)
4. [Build de Producción](#build-de-producción)
5. [Deployment iOS](#deployment-ios)
6. [Deployment Android](#deployment-android)
7. [Actualización de la App](#actualización-de-la-app)
8. [Troubleshooting](#troubleshooting)

---

## 🛠️ Requisitos Previos

### Para iOS

- **macOS** (obligatorio para builds iOS)
- **Xcode 14+** instalado desde App Store
- **Apple Developer Account** ($99/año)
  - Crear en: https://developer.apple.com/programs/
- **Certificados de desarrollo y distribución** configurados
- **Expo Account** (gratis)
  - Crear en: https://expo.dev/signup

### Para Android

- **Cuenta de Google Play Console** ($25 pago único)
  - Crear en: https://play.google.com/console/signup
- **Expo Account** (gratis)
- **Java Development Kit (JDK) 11+** (opcional, para builds locales)

### Común (Ambas Plataformas)

```bash
# Instalar Expo CLI globalmente
npm install -g expo-cli

# Instalar EAS CLI (Expo Application Services)
npm install -g eas-cli

# Login en Expo
eas login
```

---

## ⚙️ Configuración Inicial

### 1. Configurar `app.json`

Actualiza el archivo `app.json` con la información de tu app:

```json
{
  "expo": {
    "name": "SUSTRAIA",
    "slug": "sustraia",
    "version": "1.0.0",
    "owner": "tu-usuario-expo",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#F5F5F7"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.sustraia.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "SUSTRAIA necesita acceso a tu cámara para subir fotos de entrenamientos.",
        "NSPhotoLibraryUsageDescription": "SUSTRAIA necesita acceso a tu galería para subir fotos de entrenamientos.",
        "NSLocationWhenInUseUsageDescription": "SUSTRAIA usa tu ubicación para sincronizar actividades con Strava."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F5F5F7"
      },
      "package": "com.sustraia.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#0033FF"
        }
      ],
      "expo-image-picker"
    ],
    "extra": {
      "eas": {
        "projectId": "tu-project-id-aqui"
      }
    }
  }
}
```

### 2. Crear Assets Requeridos

Necesitas crear los siguientes archivos de imagen en la carpeta `assets/`:

#### **Icon** (`icon.png`)
- **Tamaño**: 1024x1024 px
- **Formato**: PNG con fondo sólido
- **Contenido**: Logo de SUSTRAIA

#### **Splash Screen** (`splash.png`)
- **Tamaño**: 1242x2436 px (iPhone 13 Pro Max)
- **Formato**: PNG
- **Contenido**: Logo centrado sobre fondo `#F5F5F7`

#### **Adaptive Icon Android** (`adaptive-icon.png`)
- **Tamaño**: 1024x1024 px
- **Formato**: PNG transparente
- **Contenido**: Logo sin fondo (se recortará en círculo)

#### **Notification Icon Android** (`notification-icon.png`)
- **Tamaño**: 96x96 px
- **Formato**: PNG transparente
- **Color**: Blanco sobre transparente (Android lo colorea automáticamente)

#### **Favicon** (`favicon.png`)
- **Tamaño**: 48x48 px
- **Formato**: PNG
- **Contenido**: Logo simplificado

### 3. Inicializar EAS

```bash
cd mobile
eas init
```

Esto creará un `eas.json` con la configuración de builds.

### 4. Configurar `eas.json`

Crea o actualiza `mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🧪 Build de Desarrollo

### Preview en Dispositivo Real

Para probar en tu dispositivo sin publicar:

```bash
# iOS (requiere estar en macOS)
eas build --profile preview --platform ios

# Android (genera APK)
eas build --profile preview --platform android

# Ambas plataformas
eas build --profile preview --platform all
```

Una vez completado el build (15-30 minutos):

1. Escanea el QR code que aparece
2. Descarga e instala la app en tu dispositivo
3. La app se conectará a tu backend de desarrollo

---

## 🚀 Build de Producción

### Configurar Variables de Entorno

Crea `mobile/.env.production`:

```bash
API_URL=https://api.sustraia.com
SOCKET_URL=https://api.sustraia.com
STRAVA_CLIENT_ID=tu_strava_client_id
STRAVA_REDIRECT_URI=sustraia://oauth/strava
```

Actualiza `mobile/lib/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api'
  : 'https://api.sustraia.com/api';
```

### Build de Producción

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android

# Ambas
eas build --profile production --platform all
```

Este proceso toma entre 20-40 minutos por plataforma.

---

## 🍎 Deployment iOS

### Paso 1: Crear App en App Store Connect

1. Ve a https://appstoreconnect.apple.com
2. Click en "Apps" → "+" → "Nueva App"
3. Completa:
   - **Plataforma**: iOS
   - **Nombre**: SUSTRAIA
   - **Idioma principal**: Español
   - **Bundle ID**: `com.sustraia.app` (debe coincidir con `app.json`)
   - **SKU**: `sustraia-ios` (único, no visible al público)
   - **Acceso**: Acceso completo

### Paso 2: Configurar Información de la App

#### Información de la App
- **Nombre**: SUSTRAIA
- **Subtítulo**: Coaching deportivo personalizado
- **Categoría**: Salud y Fitness
- **Categoría secundaria**: Deportes

#### Descripción
```
SUSTRAIA es tu plataforma de coaching deportivo personalizado.

🏃‍♂️ PARA ATLETAS
• Entrena con planes personalizados de tu coach
• Sincroniza automáticamente tus actividades desde Strava
• Visualiza tu progreso con gráficos detallados
• Comunicación directa con tu entrenador

👨‍🏫 PARA COACHES
• Crea entrenamientos personalizados para tus atletas
• Monitoriza el progreso en tiempo real
• Chat integrado para feedback instantáneo
• Panel de control completo

✨ CARACTERÍSTICAS
• Sincronización con Strava
• Notificaciones push en tiempo real
• Calendario interactivo de entrenamientos
• Análisis detallado de actividades
• Compartir logros en redes sociales

Comienza tu viaje hacia tus objetivos deportivos con SUSTRAIA.
```

#### Palabras Clave
```
coaching,entrenamiento,running,ciclismo,strava,fitness,deportes,atletismo,triatlón,maratón
```

#### Screenshots

Necesitas capturas de pantalla en los siguientes tamaños:

**iPhone 6.7" (iPhone 14 Pro Max)**: 1290 x 2796 px
- Login screen
- Dashboard atleta
- Lista de entrenamientos
- Chat con coach
- Perfil con Strava

**iPhone 6.5" (iPhone 11 Pro Max)**: 1242 x 2688 px
- Mismas pantallas

**iPad Pro 12.9" (3rd gen)**: 2048 x 2732 px (opcional)

### Paso 3: Configurar Privacidad

En App Store Connect → Tu App → Privacidad de la App:

#### Datos Recopilados
- ✅ **Información de contacto**: Email, nombre
- ✅ **Datos de salud y ejercicio**: Actividades deportivas, métricas
- ✅ **Identificadores**: ID de usuario
- ✅ **Datos de uso**: Análisis de app

#### Propósito
- **Funcionalidad de la app**: Todos los datos
- **Personalización**: Métricas deportivas
- **Análisis**: Datos de uso

### Paso 4: Subir Build con EAS

```bash
# Build y submit automático
eas submit --platform ios --latest

# O manualmente después del build
eas submit --platform ios --path ./path/to/app.ipa
```

Esto subirá tu app a TestFlight automáticamente.

### Paso 5: TestFlight (Beta Testing)

1. En App Store Connect → TestFlight
2. Agrega testers internos (hasta 100 gratis)
3. Crea un grupo de beta testing externo
4. Completa información de beta testing:
   - Qué probar
   - Notas de la versión

```
VERSIÓN 1.0.0 - BUILD 1

Por favor prueba:
- Flujo de login/registro
- Sincronización con Strava
- Creación de entrenamientos (coaches)
- Chat en tiempo real
- Notificaciones push

Reporta cualquier bug en: support@sustraia.com
```

5. Envía invitaciones a testers

### Paso 6: Submit para Review

Una vez probado en TestFlight:

1. App Store Connect → Preparar para Envío
2. Selecciona el build de TestFlight
3. Completa información adicional:
   - **Clasificación de contenido**
   - **Información de contacto**: support@sustraia.com
   - **URL de marketing**: https://sustraia.com
   - **URL de soporte**: https://sustraia.com/soporte
   - **Política de privacidad**: https://sustraia.com/privacidad
4. Configura precios: Gratis
5. Click en "Enviar para revisión"

**Tiempo de revisión**: 24-48 horas típicamente

---

## 🤖 Deployment Android

### Paso 1: Crear App en Google Play Console

1. Ve a https://play.google.com/console
2. Click en "Crear aplicación"
3. Completa:
   - **Nombre**: SUSTRAIA
   - **Idioma predeterminado**: Español (España)
   - **App o juego**: App
   - **Gratis o de pago**: Gratis

### Paso 2: Configurar Ficha de la Tienda

#### Detalles de la App
- **Nombre de la app**: SUSTRAIA
- **Descripción breve** (80 caracteres):
```
Coaching deportivo personalizado con sincronización Strava
```

- **Descripción completa** (4000 caracteres):
```
SUSTRAIA es tu plataforma de coaching deportivo personalizado que conecta atletas con entrenadores profesionales.

🏃‍♂️ PARA ATLETAS

Entrena de forma inteligente con planes personalizados:
• Recibe entrenamientos diseñados específicamente para ti
• Sincroniza automáticamente tus actividades desde Strava
• Visualiza tu progreso con gráficos y estadísticas detalladas
• Comunicación directa con tu entrenador vía chat en tiempo real
• Calendario interactivo de entrenamientos
• Análisis completo de cada actividad

👨‍🏫 PARA ENTRENADORES

Gestiona a tus atletas desde una única plataforma:
• Crea entrenamientos personalizados con planes estructurados
• Monitoriza el progreso de cada atleta en tiempo real
• Recibe notificaciones cuando completan entrenamientos
• Chat integrado para feedback instantáneo
• Panel de control con estadísticas de todos tus atletas

✨ CARACTERÍSTICAS PRINCIPALES

🔗 Sincronización con Strava
Conecta tu cuenta de Strava y sincroniza automáticamente todas tus actividades. No más entrada manual de datos.

📊 Análisis Detallado
Visualiza métricas completas de cada actividad: distancia, tiempo, ritmo, frecuencia cardíaca, calorías y más.

📅 Calendario Interactivo
Organiza tus entrenamientos en un calendario visual. Cambia entre vista de lista y calendario.

💬 Mensajería en Tiempo Real
Chat directo con tu coach para consultas, feedback y motivación instantánea.

🔔 Notificaciones Push
Recibe alertas cuando tu coach te asigna nuevos entrenamientos o te envía mensajes.

📸 Fotos y Notas
Documenta tus entrenamientos con fotos y notas personales.

🌐 Compartir en Redes Sociales
Comparte tus logros directamente desde la app a Instagram, Twitter, WhatsApp y más.

📈 Gráficos de Progreso
Visualiza tu evolución con gráficos semanales y mensuales de distancia y duración.

🎯 PERFECTO PARA

• Corredores de todos los niveles
• Ciclistas
• Triatletas
• Nadadores
• Entrenadores personales
• Clubs deportivos

💪 COMIENZA HOY

Ya seas un atleta buscando mejorar tu rendimiento o un entrenador queriendo ofrecer un servicio premium, SUSTRAIA es la herramienta que necesitas.

Descarga gratis y comienza tu viaje hacia tus objetivos deportivos.

🔒 PRIVACIDAD Y SEGURIDAD

Tus datos están protegidos con encriptación de extremo a extremo. Lee nuestra política de privacidad en https://sustraia.com/privacidad

📧 SOPORTE

¿Necesitas ayuda? Contáctanos en support@sustraia.com

Síguenos en redes sociales:
Instagram: @sustraia
Twitter: @sustraia
```

#### Recursos Gráficos

**Ícono de la aplicación**
- Tamaño: 512 x 512 px
- Formato: PNG de 32 bits
- Archivo: `adaptive-icon.png`

**Gráfico de funciones**
- Tamaño: 1024 x 500 px
- Formato: PNG o JPG
- Contenido: Banner promocional con logo y tagline

**Capturas de pantalla del teléfono** (mínimo 2, máximo 8)
- Tamaño: 1080 x 1920 px o superior
- Formato: PNG o JPG
- Capturas requeridas:
  1. Login/Registro
  2. Dashboard de atleta con métricas
  3. Lista de entrenamientos
  4. Chat con coach
  5. Perfil con conexión Strava
  6. Gráficos de progreso
  7. Calendario de entrenamientos
  8. Detalle de actividad

**Capturas de pantalla de tablet de 7 pulgadas** (opcional)
- Tamaño: 1200 x 1920 px

**Capturas de pantalla de tablet de 10 pulgadas** (opcional)
- Tamaño: 2560 x 1800 px

### Paso 3: Categorización

- **Categoría**: Salud y bienestar
- **Etiquetas**: Fitness, Deportes, Entrenamiento

### Paso 4: Información de Contacto

- **Correo electrónico**: support@sustraia.com
- **Teléfono**: +34 XXX XXX XXX (opcional)
- **Sitio web**: https://sustraia.com
- **Dirección**: Tu dirección física (obligatorio para apps con compras)

### Paso 5: Política de Privacidad

URL obligatoria: https://sustraia.com/privacidad

### Paso 6: Configurar Release

#### Crear Keystore para Firma

Si es tu primer release:

```bash
# EAS se encarga de esto automáticamente
# Pero si quieres crear uno manual:
keytool -genkey -v -keystore sustraia-release.keystore \
  -alias sustraia -keyalg RSA -keysize 2048 -validity 10000
```

Con EAS, simplemente:

```bash
eas build --platform android --profile production
```

EAS generará y guardará tu keystore automáticamente en la nube.

### Paso 7: Submit a Google Play

```bash
# Submit automático con EAS
eas submit --platform android --latest

# Necesitarás un Service Account JSON
# Sigue las instrucciones en: https://docs.expo.dev/submit/android/
```

#### Configurar Service Account (Primera vez)

1. Google Cloud Console → IAM & Admin → Service Accounts
2. Crear Service Account con rol "Editor"
3. Generar clave JSON
4. En Google Play Console → API Access → vincular proyecto
5. Dar permisos de "Gestión de releases" a la cuenta

### Paso 8: Crear Release

1. Google Play Console → Producción → Crear nueva release
2. Sube el AAB generado por EAS
3. Completa notas de la versión:

```
Versión 1.0.0

🎉 Lanzamiento inicial de SUSTRAIA

✨ Características:
• Sistema completo de coaching deportivo
• Sincronización con Strava
• Chat en tiempo real con tu coach
• Calendario de entrenamientos
• Gráficos de progreso
• Notificaciones push
• Análisis detallado de actividades

Para más información: https://sustraia.com
```

4. Click en "Revisar release"
5. Completar cuestionario de contenido de la app
6. Click en "Iniciar implementación en producción"

**Tiempo de revisión**: 1-3 días típicamente (primera vez puede tardar más)

### Paso 9: Pruebas Internas/Cerradas (Opcional pero Recomendado)

Antes de producción:

1. Producción → Pruebas internas → Crear nueva release
2. Agrega testers por email
3. Comparte el link de opt-in
4. Recoge feedback antes de producción

---

## 🔄 Actualización de la App

### Incrementar Versión

Edita `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",  // Incrementar versión
    "ios": {
      "buildNumber": "2"  // Incrementar build
    },
    "android": {
      "versionCode": 2  // Incrementar versionCode
    }
  }
}
```

### Build Nueva Versión

```bash
# iOS
eas build --profile production --platform ios
eas submit --platform ios --latest

# Android
eas build --profile production --platform android
eas submit --platform android --latest
```

### Notas de Versión

Prepara changelog para cada update:

```
VERSIÓN 1.1.0

🆕 Nuevas características:
• Nueva vista de estadísticas con gráficos mejorados
• Soporte para subir fotos en actividades
• Compartir actividades en redes sociales

🐛 Correcciones:
• Arreglo en sincronización de Strava
• Mejora de rendimiento en el chat
• Corrección de errores menores

💪 Mejoras:
• Interfaz más rápida y fluida
• Reducción del tamaño de la app
• Mayor precisión en métricas
```

---

## 🎨 Checklist Pre-Launch

### General
- [ ] Todas las variables de entorno configuradas
- [ ] API en producción funcionando
- [ ] Backend soporta HTTPS
- [ ] Dominio configurado
- [ ] SSL/TLS certificados activos
- [ ] Pruebas end-to-end completas
- [ ] Política de privacidad publicada
- [ ] Términos de servicio publicados

### Assets
- [ ] Icon 1024x1024 creado
- [ ] Splash screen creado
- [ ] Adaptive icon Android creado
- [ ] Notification icon creado
- [ ] Screenshots iOS en todos los tamaños
- [ ] Screenshots Android creados
- [ ] Gráfico de funciones (Android) creado

### iOS
- [ ] Apple Developer Account activo
- [ ] Bundle ID registrado
- [ ] App creada en App Store Connect
- [ ] Información completa en App Store
- [ ] Privacidad configurada
- [ ] TestFlight probado con usuarios reales

### Android
- [ ] Google Play Developer Account activo
- [ ] Service Account configurado
- [ ] Ficha de tienda completa
- [ ] Cuestionario de contenido completado
- [ ] Pruebas internas realizadas

### Funcionalidades
- [ ] Login/Logout funciona
- [ ] Registro de usuarios funciona
- [ ] Strava OAuth funciona
- [ ] Sincronización de actividades funciona
- [ ] Chat en tiempo real funciona
- [ ] Notificaciones push funcionan
- [ ] Creación de entrenamientos funciona
- [ ] Gráficos renderizan correctamente
- [ ] Fotos se suben correctamente
- [ ] Compartir en redes funciona

---

## 🚨 Troubleshooting

### Error: "Build Failed"

```bash
# Limpiar cache
eas build:clear-cache

# Re-intentar build
eas build --profile production --platform ios --clear-cache
```

### Error: "Unable to find expo package"

```bash
cd mobile
rm -rf node_modules
npm install
```

### Error: Keystore no encontrado (Android)

```bash
# EAS guardará automáticamente tu keystore
# Verifica en: https://expo.dev/accounts/[account]/projects/[project]/credentials
```

### Push Notifications no funcionan

1. Verifica que el backend registra el push token
2. Chequea permisos en dispositivo
3. Prueba con Expo's push notification tool:

```bash
npx expo-cli push:android:upload --api-key YOUR_FCM_KEY
```

### Strava OAuth falla

1. Verifica redirect URI en Strava settings:
   - Debe ser: `sustraia://oauth/strava`
2. Chequea scheme en `app.json`:
   ```json
   {
     "expo": {
       "scheme": "sustraia"
     }
   }
   ```

### App rechazada por App Store

**Razones comunes**:
- Falta política de privacidad
- Screenshots no claros
- Descripción engañosa
- Funcionalidad incompleta
- Crashes en revisión

**Solución**: Lee el feedback de Apple, corrige, y reenvía.

---

## 📊 Monitoring Post-Launch

### Analytics

Integra analytics para monitorear:

```bash
npm install --save expo-firebase-analytics
```

```typescript
import * as Analytics from 'expo-firebase-analytics';

// Track screen views
Analytics.logEvent('screen_view', {
  screen_name: 'Dashboard',
  screen_class: 'HomeScreen',
});

// Track events
Analytics.logEvent('workout_created', {
  type: 'RUN',
  distance: 5.0,
});
```

### Crash Reporting

Usa Sentry para crash reporting:

```bash
npm install --save @sentry/react-native
```

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: __DEV__ ? 'development' : 'production',
});
```

### Métricas a Monitorear

- **Crashes**: Tasa de crashes por sesión
- **Performance**: Tiempo de carga de pantallas
- **Engagement**: DAU/MAU ratio
- **Retention**: % usuarios que vuelven después de 7 días
- **Feature usage**: Qué features usan más

---

## 🎉 Post-Launch

### Marketing

1. **Landing Page**: Actualiza con links a stores
2. **Redes Sociales**: Anuncia lanzamiento
3. **Email**: Notifica a lista de espera
4. **Press Kit**: Prepara material para prensa

### Soporte

Configura:
- Email de soporte: support@sustraia.com
- FAQ en website
- Sistema de tickets (Zendesk, Intercom, etc.)
- Chat de soporte en app (opcional)

### Roadmap

Planifica updates:
- v1.1: Mejoras de feedback inicial
- v1.2: Nuevas features basadas en requests
- v2.0: Features mayores

---

## 📚 Recursos Útiles

### Documentación
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo EAS Submit](https://docs.expo.dev/submit/introduction/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

### Comunidad
- [Expo Discord](https://chat.expo.dev)
- [Expo Forums](https://forums.expo.dev)
- [React Native Community](https://www.reactnative.dev/community/overview)

### Herramientas
- [App Icon Generator](https://www.appicon.co/)
- [Screenshot Maker](https://www.applaunchpad.com/)
- [ASO Tools](https://www.apptweak.com/) - App Store Optimization

---

## ✅ Checklist de Lanzamiento Final

Antes de presionar "Submit":

- [ ] Probado en múltiples dispositivos reales
- [ ] Sin crashes conocidos
- [ ] Performance óptimo
- [ ] Backend en producción estable
- [ ] Monitoreo y alertas configurados
- [ ] Plan de soporte establecido
- [ ] Marketing preparado
- [ ] Todas las integraciones funcionando (Strava, push, etc.)
- [ ] Política de privacidad y términos actualizados
- [ ] Backup de keystores/certificados guardado

**¡Estás listo para lanzar SUSTRAIA al mundo! 🚀**

---

## 📞 Contacto

Para soporte con el deployment:
- **Email**: dev@sustraia.com
- **Documentación**: https://docs.sustraia.com

---

**© 2026 SUSTRAIA - Todos los derechos reservados**
