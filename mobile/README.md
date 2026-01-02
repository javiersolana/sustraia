# SUSTRAIA Mobile App

Aplicación móvil nativa para iOS y Android de la plataforma de coaching deportivo SUSTRAIA.

## 🚀 Stack Tecnológico

### Core
- **React Native 0.81.5** - Framework móvil multiplataforma
- **Expo SDK 54** - Herramientas y servicios para desarrollo React Native
- **TypeScript 5.9** - Tipado estático

### Navegación y Estado
- **Expo Router 6.0** - Navegación basada en sistema de archivos (file-based routing)
- **React Navigation** - Sistema de navegación nativo (integrado con Expo Router)
- **AsyncStorage** - Persistencia de datos local

### UI/UX
- **Lucide React Native 0.562** - Iconos modernos
- **React Native Gesture Handler** - Gestos nativos
- **React Native Safe Area Context** - Manejo de áreas seguras

### API y Comunicación
- **Axios 1.13** - Cliente HTTP
- **Socket.io Client** - WebSockets en tiempo real
- **Expo Notifications** - Push notifications con deep linking
- **Expo Device** - Información del dispositivo
- **React Native SVG** - Soporte para gráficos vectoriales
- **Expo Web Browser** - OAuth flows
- **Expo Auth Session** - OAuth 2.0 authentication
- **@react-native-community/datetimepicker** - Date picker nativo

## 📱 Características Implementadas

### Autenticación
- ✅ Login con email y contraseña
- ✅ Registro de nuevos usuarios (Atleta/Coach)
- ✅ Persistencia de sesión con JWT
- ✅ Logout

### Dashboard Atleta
- ✅ **Home**: Estadísticas semanales, objetivo semanal, progreso
- ✅ **Entrenamientos**: Lista de entrenamientos asignados por coach
- ✅ **Actividades**: Historial de actividades completadas con filtros
- ✅ **Mensajes**: Chat en tiempo real con entrenador
- ✅ **Perfil**: Gestión de cuenta, objetivo semanal, configuración

### Dashboard Coach
- ✅ **Atletas**: Lista de atletas con estadísticas y progreso
- ✅ **Búsqueda**: Filtrado de atletas
- ✅ **Vista rápida**: Estadísticas semanales/mensuales de cada atleta
- ✅ **Mensajes**: Chat en tiempo real con atletas
- ✅ **Perfil**: Configuración de cuenta

### Integraciones
- ✅ **Strava OAuth** - Flujo completo implementado con deep linking
- ✅ **Strava Sync** - Sincronización manual de actividades
- ✅ **Mensajería en Tiempo Real** - Chat coach-atleta con WebSockets (Socket.io)
- ✅ **Notificaciones Push** - Expo Notifications con deep linking
- ✅ **Crear Entrenamientos** - Formulario completo para coaches
- ✅ **Vista Detallada de Actividad** - Métricas avanzadas con análisis

## 🏗️ Arquitectura

### Estructura de Carpetas

```
mobile/
├── app/                        # Expo Router - File-based routing
│   ├── (auth)/                # Grupo de rutas de autenticación
│   │   ├── _layout.tsx        # Layout del grupo auth
│   │   ├── login.tsx          # Pantalla de login
│   │   └── register.tsx       # Pantalla de registro
│   ├── (tabs)/                # Grupo de rutas con tabs
│   │   ├── _layout.tsx        # Layout con bottom tabs
│   │   ├── home.tsx           # Dashboard atleta
│   │   ├── workouts.tsx       # Entrenamientos
│   │   ├── activities.tsx     # Actividades
│   │   ├── messages.tsx       # Lista de conversaciones
│   │   ├── profile.tsx        # Perfil + Strava
│   │   └── coach.tsx          # Dashboard coach
│   ├── chat/                  # Pantallas de chat
│   │   └── [id].tsx           # Conversación individual (WebSocket)
│   ├── workouts/              # Pantallas de entrenamientos
│   │   └── create.tsx         # Crear entrenamiento (coaches)
│   ├── activity/              # Pantallas de actividades
│   │   └── [id].tsx           # Vista detallada de actividad
│   ├── _layout.tsx            # Root layout (inicializa servicios globales)
│   └── index.tsx              # Pantalla inicial (redirect)
├── components/                # Componentes reutilizables
├── constants/                 # Constantes (colores, etc)
│   └── Colors.ts             # Sistema de diseño SUSTRAIA
├── lib/                       # Utilidades y servicios
│   ├── api.ts                # Cliente API con interceptores
│   ├── auth.ts               # Servicio de autenticación
│   ├── strava.ts             # Servicio OAuth Strava
│   ├── messaging.ts          # Servicio de mensajería
│   ├── socket.ts             # Cliente WebSocket (Socket.io)
│   └── notifications.ts      # Servicio de notificaciones push
├── assets/                    # Imágenes, iconos, fuentes
├── app.json                   # Configuración de Expo
├── package.json              # Dependencias
└── tsconfig.json             # Configuración TypeScript
```

### Sistema de Diseño

Siguiendo el sistema de diseño de SUSTRAIA:

```typescript
Colors = {
  base: '#F5F5F7',       // Fondo principal
  paper: '#FFFFFF',      // Cards y superficies
  text: '#111111',       // Texto principal
  gray: '#666666',       // Texto secundario
  lightGray: '#E5E5E5',  // Bordes
  accent: '#0033FF',     // Azul Klein - CTAs
  accentHover: '#0022CC',
  error: '#FF3030',
  success: '#34C759',
  warning: '#FF9500',
}
```

## 🔧 Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- npm o yarn
- Expo Go app (para testing en dispositivo físico)
- iOS Simulator (macOS) o Android Emulator

### Instalación

```bash
cd mobile
npm install
```

### Configuración de API

Edita `lib/api.ts` para configurar la URL del backend:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api'  // Development
  : 'https://api.sustraia.com/api';  // Production
```

**Importante para Android Emulator**: Si usas Android Emulator, usa `http://10.0.2.2:3001/api` en lugar de `localhost`.

**Importante para dispositivos físicos**: Usa la IP local de tu máquina (ej: `http://192.168.1.100:3001/api`).

## 🚀 Ejecución

### Modo Desarrollo

```bash
# Iniciar Metro bundler
npm start

# Opciones:
# - Presiona 'a' para Android
# - Presiona 'i' para iOS
# - Escanea QR con Expo Go para dispositivo físico
```

### Por Plataforma

```bash
# Android
npm run android

# iOS (solo macOS)
npm run ios

# Web (experimental)
npm run web
```

### Clear Cache

Si tienes problemas, limpia el caché:

```bash
npm run reset
```

## 📲 Testing en Dispositivo Físico

1. Instala **Expo Go** desde:
   - [App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Ejecuta `npm start`

3. Escanea el QR con:
   - **iOS**: App nativa de Cámara
   - **Android**: App Expo Go

4. Asegúrate de que tu dispositivo y computadora estén en la **misma red WiFi**

## 🔐 Autenticación

### Flow de Autenticación

1. Usuario ingresa credenciales en `(auth)/login.tsx` o `(auth)/register.tsx`
2. `authService.login()` o `authService.register()` hace POST al backend
3. Backend devuelve JWT token + datos de usuario
4. Token se guarda en AsyncStorage
5. Usuario redirigido a dashboard según rol:
   - **ATLETA** → `(tabs)/home`
   - **COACH** → `(tabs)/coach`
6. API client (`lib/api.ts`) intercepta requests y agrega token automáticamente
7. Si token expira (401), se limpia storage y redirige a login

## 🔔 Notificaciones Push

### Implementación con Expo Notifications

El sistema de notificaciones push está completamente integrado:

1. **Registro Automático**: Al iniciar sesión, la app solicita permisos y registra el push token
2. **Deep Linking**: Las notificaciones navegan automáticamente a la pantalla relevante
3. **Badge Count**: Soporte para contador de notificaciones en el ícono de la app
4. **Configuración Android**: Canal de notificaciones configurado con vibración y sonido

**Uso**:
```typescript
// El servicio se inicializa automáticamente en app/_layout.tsx
await notificationService.registerForPushNotifications();

// Escuchar cuando el usuario toca una notificación
notificationService.addNotificationResponseListener((response) => {
  const data = response.notification.request.content.data;
  if (data.type === 'message') {
    // Navegar al chat
  }
});
```

**Importante**: Las notificaciones push solo funcionan en dispositivos físicos, no en simuladores/emuladores.

## 💬 WebSockets en Tiempo Real

### Socket.io Integration

El chat utiliza WebSockets para mensajes instantáneos sin polling:

1. **Conexión Automática**: Se conecta al iniciar sesión
2. **Autenticación JWT**: El token se envía en el handshake
3. **Reconexión Automática**: 5 intentos si se pierde conexión
4. **Eventos en Tiempo Real**:
   - `new_message` - Nuevo mensaje recibido
   - `messages_read` - Mensajes marcados como leídos
   - `user_typing` - Indicador de escritura (preparado)

**Configuración del Backend Requerida**:
```typescript
// Backend necesita Socket.io server
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: { origin: '*' }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT
  next();
});

io.on('connection', (socket) => {
  socket.on('new_message', (data) => {
    io.to(`user_${data.toId}`).emit('new_message', message);
  });
});
```

## 🏋️ Crear Entrenamientos (Coaches)

Los coaches pueden crear entrenamientos desde su dashboard:

1. **Acceso**: Dashboard Coach → Card de Atleta → Botón "Nuevo entrenamiento"
2. **Formulario Completo**:
   - Título (obligatorio)
   - Tipo: RUN, RIDE, SWIM, STRENGTH, YOGA, OTHER
   - Fecha (date picker nativo)
   - Distancia y duración (opcional)
   - Intensidad: SUAVE, MODERADO, INTENSO, MÁXIMO
   - Descripción y notas
3. **Asignación**: Pre-relleno automático con el atleta seleccionado
4. **Envío**: POST a `/api/workouts` con validación

## 📊 Vista Detallada de Actividad

Vista completa de métricas de una actividad completada:

**Métricas Mostradas**:
- **Primarias** (destacadas): Distancia, Duración
- **Secundarias** (grid): FC media, FC máxima, Calorías, Ritmo medio
- **Análisis**: Campo `humanReadable` con descripción del entrenamiento
- **Extras**: Notas, sensaciones, badge de Strava si está sincronizado

**Cálculos Automáticos**:
```typescript
// Ritmo medio (min/km)
const formatPace = (distance?: number, duration?: number) => {
  const paceMinPerKm = duration / 60 / distance;
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.floor((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
};
```

**Navegación**: Desde Activities tab → Click en actividad → Vista detallada

## 💬 Features Avanzadas de Mensajería

### Badge Contador de Mensajes No Leídos

El tab de Mensajes muestra un badge rojo con el número de mensajes no leídos:

**Características**:
- Actualización automática cada 10 segundos
- Actualización instantánea al recibir nuevo mensaje (WebSocket)
- Se oculta cuando unreadCount = 0
- Funciona tanto para atletas como coaches

**Implementación**:
```typescript
// En app/(tabs)/_layout.tsx
const [unreadCount, setUnreadCount] = useState<number>(0);

useEffect(() => {
  loadUnreadCount();
  const interval = setInterval(loadUnreadCount, 10000);
  socketService.onNewMessage(() => loadUnreadCount());
  return () => clearInterval(interval);
}, []);

// En tab de mensajes
tabBarBadge: unreadCount > 0 ? unreadCount : undefined
```

### Typing Indicator (Indicador de Escritura)

Muestra "Escribiendo..." cuando el otro usuario está escribiendo:

**Características**:
- Aparece cuando el usuario comienza a escribir
- Desaparece automáticamente después de 3 segundos de inactividad
- Se cancela al enviar mensaje
- Funciona vía WebSocket en tiempo real

**Eventos WebSocket**:
```typescript
// Emitir cuando usuario escribe
socket.emit('typing', { toUserId, isTyping: true });

// Escuchar cuando otro usuario escribe
socket.on('user_typing', ({ userId, isTyping }) => {
  setIsTyping(isTyping);
});
```

### Confirmación de Lectura (Read Receipts)

Iconos de check al estilo WhatsApp:

**Estados**:
- ✓ (gris) - Mensaje enviado pero no leído
- ✓✓ (verde) - Mensaje leído por el destinatario

**Características**:
- Solo visible en mensajes propios (enviados)
- Actualización instantánea vía WebSocket
- Campo `read: boolean` en interfaz Message

**Eventos WebSocket**:
```typescript
// Backend emite cuando se marcan mensajes como leídos
socket.emit('messages_read', { userId });

// Cliente actualiza UI
socket.on('messages_read', ({ userId }) => {
  setMessages(prev =>
    prev.map(msg => msg.toId === userId ? {...msg, read: true} : msg)
  );
});
```

### Online/Offline Status

Indicador de estado en tiempo real:

**Características**:
- Dot verde junto al nombre cuando está online
- Texto "En línea" en color verde
- "Visto hace Xm/h/d" cuando está offline
- Actualización automática vía WebSocket

**UI**:
- Online: Dot verde + "En línea" (verde)
- Offline reciente: "Visto hace 5m"
- Offline: "Visto hace 2h" / "Visto ayer" / "Visto hace 3d"

**Eventos WebSocket**:
```typescript
// Solicitar status al entrar al chat
socket.emit('get_user_status', { userId });

// Escuchar cambios de status
socket.on('user_status', ({ userId, isOnline, lastSeen }) => {
  setIsOnline(isOnline);
  setLastSeen(lastSeen);
});
```

**Backend Requerido**:
```typescript
// Trackear usuarios conectados
const onlineUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  const userId = socket.userId; // from JWT
  onlineUsers.set(userId, socket.id);

  // Broadcast online status
  io.emit('user_status', { userId, isOnline: true });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    io.emit('user_status', {
      userId,
      isOnline: false,
      lastSeen: new Date().toISOString()
    });
  });
});
```

## 🎨 Componentes y Patrones

### Patrón de Pantalla Estándar

```tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import api from '../../lib/api';
import Colors from '../../constants/Colors';

export default function MyScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView>
        {/* Content */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
});
```

## 🔄 Estado y Datos

### Carga de Datos
- Todas las pantallas usan `useEffect` + `api.get()` para cargar datos
- Estado de loading con `ActivityIndicator`
- Pull-to-refresh con `RefreshControl`

### Cache Local
- JWT token en AsyncStorage (`auth_token`)
- Datos de usuario en AsyncStorage (`user_data`)

### Sincronización
- No hay estado global (Redux/Context) aún
- Cada pantalla maneja su propio estado
- Refresh manual con pull-to-refresh

## 📡 Integración con Backend

### Endpoints Utilizados

```typescript
// Auth
POST /api/auth/login
POST /api/auth/register

// Stats
GET /api/stats/dashboard

// Workouts
GET /api/workouts
GET /api/workouts/completed

// Coach
GET /api/coach/athletes

// Profile
PATCH /api/users/profile

// Strava
GET /api/strava/status
POST /api/strava/exchange
POST /api/strava/disconnect
POST /api/strava/sync

// Messaging
GET /api/messages/conversations
GET /api/messages/:userId
POST /api/messages
PATCH /api/messages/:userId/read
GET /api/messages/unread-count

// Workouts
POST /api/workouts                     # Crear entrenamiento
GET /api/workouts/completed/:id        # Detalle de actividad

// Notifications
POST /api/notifications/register       # Registrar push token

// WebSocket Events (Socket.io)
socket.on('new_message')               # Nuevo mensaje en tiempo real
socket.on('messages_read')             # Marcar mensajes como leídos
socket.on('user_typing')               # Indicador de escritura
socket.on('user_status')               # Estado online/offline
socket.emit('typing')                  # Emitir estado de escritura
socket.emit('get_user_status')         # Solicitar estado de usuario
```

### Interceptores

El cliente API incluye interceptores automáticos:

```typescript
// Request: Agrega token a headers
config.headers.Authorization = `Bearer ${token}`;

// Response: Si 401, limpia storage y token
if (error.response?.status === 401) {
  await AsyncStorage.removeItem('auth_token');
}
```

## 🎯 Próximos Pasos

### ✅ Completado
- [x] Implementar Strava OAuth flow completo
- [x] Sistema de mensajería coach-atleta
- [x] Notificaciones push con Expo Notifications
- [x] WebSockets para mensajería en tiempo real (Socket.io)
- [x] Crear entrenamientos desde coach dashboard
- [x] Vista detallada de actividad con métricas avanzadas

### ✅ Completado Recientemente
- [x] Badge contador de mensajes no leídos en tab
- [x] Typing indicator en chat
- [x] Online/offline status
- [x] Confirmación de lectura (double check)

### Mediano Plazo
- [ ] Gráficos de progreso con react-native-chart-kit
- [ ] Calendario de entrenamientos interactivo
- [ ] Subida de fotos/notas en actividades
- [ ] Compartir actividades en redes sociales
- [ ] Indicador de unread messages con badge

### Largo Plazo
- [ ] Modo offline con cache local
- [ ] Integración con Stripe para pagos in-app
- [ ] Apple Health / Google Fit integration
- [ ] Apple Watch / Wear OS companion apps

## 🏗️ Build para Producción

### Development Build (Recomendado)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login a Expo
eas login

# Configurar proyecto
eas build:configure

# Build para Android
eas build --platform android --profile development

# Build para iOS
eas build --platform ios --profile development
```

### Producción (App Stores)

```bash
# Build para stores
eas build --platform all --profile production

# Submit a stores
eas submit --platform all
```

## 🐛 Troubleshooting

### Error: "Unable to connect to server"
- Verifica que el backend esté corriendo (`npm run server` en carpeta raíz)
- Revisa la URL en `lib/api.ts`
- Para Android Emulator usa `10.0.2.2` en lugar de `localhost`
- Para dispositivo físico usa la IP local de tu máquina

### Error: "Invalid token" o loops de login
- Limpia AsyncStorage: Desinstala y reinstala la app
- Verifica que el backend esté devolviendo el token correcto

### Pantalla en blanco
- Ejecuta `npm run reset` para limpiar cache
- Revisa logs con `npx react-native log-android` o `npx react-native log-ios`

### Problemas con dependencias
- Borra `node_modules` y reinstala: `rm -rf node_modules && npm install`
- Si persiste: `npm install --legacy-peer-deps`

## 📚 Recursos

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 🤝 Contribución

Esta es la app móvil de SUSTRAIA. Para contribuir:

1. Mantén el sistema de diseño consistente
2. Usa TypeScript estricto
3. Sigue los patrones de componentes existentes
4. Documenta código complejo

## 📄 Licencia

Propiedad de SUSTRAIA © 2026
