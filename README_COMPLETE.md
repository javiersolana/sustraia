# 🏃 SUSTRAIA - Sistema de Coaching Híbrido

Plataforma mobile-first para coaching deportivo con integración Strava y sistema de logros dopaminérgico.

## 🎯 ¿Qué es SUSTRAIA?

SUSTRAIA conecta atletas y entrenadores, permitiendo:

- 📊 **Planificación de entrenamientos** con bloques personalizables
- 🏅 **115 logros gamificados** para mantener la motivación
- 🔄 **Sincronización con Strava** automática
- 📈 **Análisis avanzado** de rendimiento
- 💬 **Sistema de mensajería** coach-atleta
- 👥 **Grupos de responsabilidad** (Cuadrilla)

---

## ✨ Características

### Sistema de Logros (115 totales)

- 🔥 **Racha** (7): 3 días hasta 365 días consecutivos
- 🎯 **Distancia** (10): 5K hasta 2000K acumulados
- 🏆 **Entrenamientos** (9): 1 hasta 1000 sesiones
- 👥 **Comunidad** (5): Grupos, mensajes, veterano
- ⚡ **Especiales** (84): Récords personales, mejoras, estilo

### Mejoras Recientes

✅ **Corrección de ritmo**: Ahora muestra el promedio (3'15) en vez del mínimo (3'10)
✅ **Estimación inteligente**: Calcula distancia para entrenamientos por tiempo/pulso
✅ **Notificaciones dopaminérgicas**: Modal de celebración al desbloquear logros
✅ **Sincronización Strava**: Revisa logros automáticamente después de sincronizar

---

## 🚀 Instalación Local

```bash
# 1. Clonar e instalar
git clone https://github.com/tu-usuario/sustraia.git
cd sustraia
npm install

# 2. Configurar .env
cp .env.example .env
# Edita .env con tus credenciales

# 3. Inicializar DB
npx prisma migrate dev
npx prisma generate

# 4. Ejecutar
npm run server     # Terminal 1 (Backend en :3001)
npm run dev        # Terminal 2 (Frontend en :5173)
```

---

## 📁 Estructura

```
sustraia/
├── src/                           # Frontend (React + TypeScript)
│   ├── pages/AchievementsNew.tsx  # Sistema de logros dopaminérgico
│   └── components/dashboards/     # Dashboards atleta/coach
├── server/                        # Backend (Node + Express)
│   ├── services/
│   │   ├── achievementService.ts  # 115 logros
│   │   └── distanceEstimator.ts   # Estimación inteligente
│   └── controllers/               # API endpoints
├── prisma/                        # Database schema
├── DEPLOYMENT_GUIDE.md            # Guía completa de despliegue
└── CLAUDE.md                      # Instrucciones para IA
```

---

## 🚢 Despliegue

Ver [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) para instrucciones completas.

**Stack recomendado:**
- Frontend: Vercel (gratis)
- Backend: Render ($7/mes o gratis con sleep)
- Database: Supabase (gratis hasta 500MB)

---

## 🛠️ Stack Tecnológico

**Frontend**: React 19.2, TypeScript, TailwindCSS, Framer Motion
**Backend**: Node.js 20+, Express, Prisma, PostgreSQL
**Integrations**: Strava API, Socket.io

---

## 📝 Licencia

MIT License - Ver [LICENSE](LICENSE)

---

**Hecho con ❤️ y mucho ☕**
