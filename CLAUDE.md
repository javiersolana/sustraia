# SUSTRAIA - Sistema de Coaching Híbrido

## 🎯 Objetivo del Proyecto
Plataforma mobile-first para coaching deportivo que integra landing page + dashboards para atletas y coaches con sincronización Strava.

## 🏗️ Arquitectura y Estructura

### Stack Tecnológico
- **Frontend**: React 19.2 + TypeScript 5.2
- **Styling**: TailwindCSS (inline, config personalizado)
- **Animaciones**: Framer Motion 12.23
- **Iconos**: Lucide React 0.562
- **Build**: Vite + ES Modules
- **Backend**: [TU DECISION - sugiere y justifica]

### Estructura de Carpetas
```
/
├── CLAUDE.md                 # Este archivo
├── .claude/
│   ├── commands/            # Comandos personalizados
│   └── checkpoints.md       # Puntos de control
├── src/
│   ├── components/          # Componentes reutilizables (Button, etc)
│   ├── pages/
│   │   ├── Home.tsx         # Landing (NO TOCAR)
│   │   ├── ComoFunciona.tsx # Landing (NO TOCAR)
│   │   └── dashboards/      # Nueva carpeta para dashboards
│   ├── layouts/
│   └── lib/
├── public/
└── package.json
```

## 🚨 RESTRICCIONES CRÍTICAS

### NO MODIFICAR (Read-Only)
- `Home.tsx` - Landing page principal
- `ComoFunciona.tsx` - Sección de landing
- `Footer.tsx`, `Navbar.tsx`, `Layout.tsx`
- `Button.tsx`, `CompareSlider.tsx`, `CountUp.tsx`
- Sistema de diseño existente (colores, fuentes)
- Configuración de Tailwind en `index.html`

### Sistema de Diseño (ESTRICTAMENTE OBLIGATORIO)

#### Colores (usar SOLO estos)
```css
--sustraia-base: #F5F5F7       /* Fondo principal */
--sustraia-paper: #FFFFFF      /* Cards */
--sustraia-text: #111111       /* Texto principal */
--sustraia-gray: #666666       /* Texto secundario */
--sustraia-lightGray: #E5E5E5  /* Bordes */
--sustraia-accent: #0033FF     /* Azul Klein - CTAs */
--sustraia-accentHover: #0022CC
```

#### Tipografía
- **Display**: `font-display` (Archivo) - títulos, números grandes
- **Body**: `font-sans` (Inter) - párrafos, descripciones
- **Pesos**: font-black para h1/h2, font-bold para h3, font-medium para body
- **Tracking**: tracking-tighter para headlines, tracking-wider para badges

#### Componentes UI
- **Bordes**: rounded-2xl o rounded-3xl (NUNCA bordes rectos)
- **Sombras**: shadow-sm (default), shadow-xl (hover)
- **Spacing**: gap-6 o gap-8, padding p-6 o p-8
- **Hover**: hover:-translate-y-1 transition-all duration-300
- **Animaciones**: Framer Motion con `initial`, `animate`, `whileHover`

## 🔧 Comandos Esenciales

### Desarrollo
```bash
npm run dev          # Puerto 5173
npm run build        # Build producción
npm run preview      # Preview build
```

### Testing (implementar)
```bash
npm run test         # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Linting & Type Check
```bash
npm run typecheck    # TypeScript validation
npm run lint         # ESLint
npm run lint:fix     # Auto-fix
```

## 🎯 FASE 1: INTEGRACIÓN (MÁXIMA PRIORIDAD)

### Objetivo
Integrar landing existente + dashboards nuevos sin romper NADA.

### Checklist de Integración
- [ ] Instalar React Router v6
- [ ] Configurar rutas sin tocar componentes existentes
- [ ] Mover dashboards a `src/pages/dashboards/`
- [ ] Verificar build sin errores
- [ ] Probar navegación entre páginas
- [ ] Commit: "feat: integrate dashboards routing"

### Rutas a Implementar
```typescript
/ → Home (landing existente)
/como-funciona → ComoFunciona
/login → LoginPage (crear)
/dashboard/atleta → AtletaDashboard
/dashboard/coach → CoachDashboard
```

## 🤖 COMPORTAMIENTO AUTÓNOMO

### Modo de Trabajo
1. **SIEMPRE** lee archivos relevantes ANTES de codear
2. **SIEMPRE** crea un plan y lo presentas para aprobación
3. **NUNCA** modifiques código sin hacer backup (usa checkpoints)
4. **SIEMPRE** ejecuta tests después de cada cambio significativo
5. Si fallas en tests, **AUTOMATICAMENTE** corrige y reintenta hasta que pasen

### Workflow TDD (Test-Driven Development)
```
1. Escribe tests que fallan
2. Confirma que fallan (npm run test)
3. Implementa código mínimo para que pasen
4. Verifica que pasen
5. Refactoriza si necesario
6. Commit con mensaje descriptivo
```

### Uso de Thinking Modes
- **"think"**: Problemas simples (4k tokens)
- **"think hard"**: Problemas complejos (10k tokens)
- **"ultrathink"**: Arquitectura crítica (31k tokens)

## 📋 FASE 2: IMPLEMENTACIÓN BACKEND

### Stack Recomendado (decide y justifica)
Analiza y elige:
- Node.js + Express + Prisma
- Python + FastAPI + SQLAlchemy
- Go + Gin + GORM

### Base de Datos Schema
```sql
Users (id, email, role, name, created_at)
Workouts (id, user_id, date, type, description)
CompletedWorkouts (id, workout_id, user_id, metrics)
Messages (id, from_id, to_id, content, read)
Stats (id, user_id, metric_name, value, date)
StravaTokens (id, user_id, access_token, refresh_token)
```

### Prioridades de Desarrollo
1. Auth + JWT (protección de rutas)
2. Integración Strava OAuth
3. CRUD entrenamientos
4. Sistema mensajería
5. Cálculo métricas automáticas

## 🔒 Seguridad y Validación

### NUNCA hacer
- Commitear `.env` files
- Hardcodear API keys
- Exponer credenciales en logs
- Modificar `node_modules`

### SIEMPRE hacer
- Validar inputs (frontend + backend)
- Sanitizar datos de usuario
- Usar HTTPS en producción
- Rate limiting en API

## ✅ Pre-Commit Checklist
Antes de cada commit, verifica:
- [ ] `npm run typecheck` pasa
- [ ] `npm run test` pasa
- [ ] `npm run lint` sin errores
- [ ] Build funcional (`npm run build`)
- [ ] No hay `console.log` olvidados
- [ ] Código comentado eliminado

## 🐛 Debugging y Corrección Automática

### Si algo falla
1. Lee el error COMPLETO
2. Identifica archivo y línea exacta
3. **PIENSA** sobre la causa raíz (no parches)
4. Implementa fix
5. Verifica con tests
6. Si falla de nuevo → repite hasta éxito

### Logging Estratégico
```typescript
// Durante desarrollo, usa logs informativos
console.log('[DEBUG] User authenticated:', { userId, role });

// En producción, usa logging estructurado
logger.info('User authenticated', { userId, role, timestamp });
```

## 📦 Gestión de Dependencias

### Antes de instalar
1. Investiga alternativas
2. Verifica bundle size
3. Lee documentación oficial
4. Instala versión específica (no @latest)

### Comandos
```bash
npm install <package>@<version>
npm update                    # Actualizar según package.json
npm audit fix                 # Fix vulnerabilidades
```

## 🎨 Convenciones de Código

### Naming
- Componentes: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase con `use` prefix (`useAuth.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

### Imports Order
```typescript
// 1. React & third party
import React from 'react';
import { motion } from 'framer-motion';

// 2. Internal components
import { Button } from '@/components/ui/Button';

// 3. Utils & types
import { cn } from '@/lib/utils';
import type { User } from '@/types';

// 4. Styles (si hay)
import './styles.css';
```

## 🚀 Optimización y Performance

### React Best Practices
- Usa `React.memo()` para componentes pesados
- Implementa lazy loading: `React.lazy(() => import('./Component'))`
- Evita re-renders innecesarios con `useMemo` y `useCallback`

### Bundle Optimization
- Code splitting por ruta
- Tree shaking habilitado
- Comprimir imágenes (WebP)
- Lazy load imágenes fuera de viewport

## 📝 Commits y Mensajes

### Formato (Conventional Commits)
```
feat: add Strava OAuth integration
fix: resolve dashboard loading issue
docs: update API documentation
refactor: optimize workout calculation
test: add unit tests for auth service
```

## 🎯 Comandos Personalizados

### `/init`
Auto-generar/actualizar este CLAUDE.md basado en el proyecto actual

### `/review`
Revisar cambios recientes contra checklist de calidad

### `/test <component>`
Generar tests comprehensivos para componente

### `/optimize`
Analizar bundle size y sugerir optimizaciones

## 💡 Principios de Trabajo

1. **Clarity over Cleverness**: Código legible > código "inteligente"
2. **Fail Fast**: Detecta errores temprano con validación estricta
3. **Progressive Enhancement**: Funcionalidad básica primero, features avanzadas después
4. **Mobile First**: Diseña para móvil, escala a desktop
5. **Accessibility**: Siempre incluye ARIA labels y keyboard navigation

## 📈 Métricas de Calidad

### Targets
- Test coverage: >80%
- TypeScript strict mode: 100%
- Lighthouse performance: >90
- Bundle size: <500KB (initial load)
- First Contentful Paint: <1.5s

## 🔄 Context Management

### Cuando el contexto se llene
- Usa `/compact` para comprimir conversación
- Crea checkpoints antes de cambios grandes
- Guarda estado en archivos temporales si necesario
- Resume trabajo desde último checkpoint

## 🎉 Filosofía "Vibe Coding"

- **Confianza**: Delega tareas complejas sin micromanage
- **Autonomía**: Claude decide cómo implementar, tú defines qué implementar
- **Iteración**: Primera versión OK, segunda versión GREAT
- **Feedback**: Tests fallan → Claude auto-corrige → loop hasta éxito

---

## ⚡ ULTRA COMANDOS

**"ultrathink and build the entire Strava integration with OAuth, token refresh, webhook handling, and automatic workout sync. Include comprehensive tests and error handling. Don't stop until everything works perfectly."**

Este prompt activa:
- Máximo thinking budget (31k tokens)
- Modo autónomo completo
- Auto-corrección en loop
- Testing comprehensivo
- Error handling robusto
