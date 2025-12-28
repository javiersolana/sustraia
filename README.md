# SUSTRAIA - Sistema de Coaching Híbrido

🏃‍♂️ Plataforma mobile-first para coaching deportivo con integración Strava.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Strava Developer Account (for OAuth)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo>
   cd sustraia
   npm install --legacy-peer-deps
   ```

2. **Setup database**
   ```bash
   # Create PostgreSQL database
   createdb sustraia

   # Configure environment
   cp .env.example .env
   # Edit .env with your database URL and secrets
   ```

3. **Run Prisma migrations**
   ```bash
   npm run db:push
   npm run db:generate
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Frontend (Vite)
   npm run dev

   # Terminal 2: Backend (Express)
   npm run server
   ```

5. **Access the app**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Prisma Studio: `npm run db:studio`

---

## 📁 Project Structure

```
sustraia/
├── components/           # React components
│   ├── ui/              # Reusable UI (Button, etc)
│   ├── dashboards/      # Dashboard-specific components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── Layout.tsx
├── pages/               # Route pages
│   ├── Home.tsx         # Landing page
│   ├── ComoFunciona.tsx # How it works
│   ├── Login.tsx        # Login page
│   └── dashboards/      # Dashboard pages
│       ├── AthleteDashboard.tsx
│       └── CoachDashboard.tsx
├── lib/                 # Utilities
│   ├── api/
│   │   └── client.ts    # API client
│   ├── types/
│   └── utils.ts
├── server/              # Backend (Express + Prisma)
│   ├── controllers/     # Request handlers
│   ├── routes/          # Route definitions
│   ├── middleware/      # Auth, validation, etc.
│   ├── services/        # Business logic (Strava, etc.)
│   ├── utils/           # Helper functions
│   ├── config/          # Configuration
│   └── index.ts         # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── tests/               # Vitest tests
│   ├── unit/            # Unit tests
│   └── integration/     # API integration tests
├── .env                 # Environment variables (gitignored)
├── .env.example         # Template
└── README.md
```

---

## 🗄️ Database Schema

### Models

- **User** - Athletes and coaches with role-based access
- **Workout** - Planned workouts (created by coaches)
- **CompletedWorkout** - Workout results (logged by athletes)
- **Message** - Coach-athlete messaging
- **Stat** - Time-series performance metrics
- **StravaToken** - OAuth tokens for Strava integration

See `prisma/schema.prisma` for full schema.

---

## 🔑 Environment Variables

Create `.env` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sustraia"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# Strava OAuth (get from https://www.strava.com/settings/api)
STRAVA_CLIENT_ID="your-client-id"
STRAVA_CLIENT_SECRET="your-client-secret"
STRAVA_REDIRECT_URI="http://localhost:5173/auth/strava/callback"
STRAVA_WEBHOOK_VERIFY_TOKEN="random-string"

# Frontend
FRONTEND_URL="http://localhost:5173"
```

---

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start Vite dev server (frontend)
npm run server       # Start Express server (backend)
```

### Database
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations (production)
npm run db:studio    # Open Prisma Studio
```

### Testing
```bash
npm run test         # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report (target: >80%)
```

### Build
```bash
npm run build        # Build frontend for production
npm run preview      # Preview production build
npm run typecheck    # TypeScript validation
```

---

## 🎯 API Documentation

See `server/API.md` for complete endpoint documentation.

### Quick Reference

**Authentication**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile

**Workouts**
- `GET /api/workouts` - List workouts
- `POST /api/workouts` - Create (coach only)
- `POST /api/workouts/:id/complete` - Complete (athlete only)

**Messages**
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - List conversations
- `GET /api/messages/with/:userId` - Get thread

**Strava**
- `GET /api/strava/auth-url` - Get OAuth URL
- `GET /api/strava/activities` - Fetch activities
- `POST /api/strava/sync` - Sync activity to workout

**Stats**
- `GET /api/stats` - Current stats
- `GET /api/stats/dashboard` - Athlete dashboard
- `GET /api/stats/coach-dashboard` - Coach dashboard

---

## 🔐 Authentication Flow

1. User registers/logs in via `/api/auth/register` or `/api/auth/login`
2. Backend returns JWT token
3. Frontend stores token in localStorage
4. All subsequent requests include `Authorization: Bearer <token>` header
5. Middleware validates token and attaches `req.user`

---

## 🎨 Frontend Usage

### Using the API Client

```typescript
import { api, useAuth } from './lib/api/client';

// In a component
function LoginPage() {
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await login('user@example.com', 'password');
      console.log('Logged in:', response.user);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
}

// Fetch workouts
const { workouts } = await api.workouts.getAll();

// Complete workout
await api.workouts.complete('workout-id', {
  actualDuration: 1800,
  actualDistance: 5000,
  avgHeartRate: 145,
});
```

---

## 🏗️ Backend Architecture

### Tech Stack
- **Express** - Web framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Vitest** - Testing

### Key Features
✅ Role-based access control (RBAC)
✅ JWT authentication with auto-refresh
✅ Strava OAuth2 integration
✅ Webhook support for real-time activity sync
✅ Comprehensive validation (express-validator)
✅ Error handling middleware
✅ >80% test coverage

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests are organized:
- `tests/unit/` - Utility functions (JWT, password hashing)
- `tests/integration/` - API endpoints (auth, workouts, messages, stats)

Target coverage: **>80%** (enforced in vitest.config.ts)

---

## 🚀 Deployment

### Backend (Railway/Render/Fly.io)

1. Set environment variables
2. Run migrations: `npm run db:migrate`
3. Start server: `npm run server`

### Frontend (Vercel/Netlify)

1. Build: `npm run build`
2. Deploy `dist/` folder
3. Set `VITE_API_URL` to production API URL

---

## 🔄 Strava Integration Setup

1. **Create Strava App**
   - Go to https://www.strava.com/settings/api
   - Create new application
   - Set Authorization Callback Domain to your domain

2. **Configure .env**
   ```env
   STRAVA_CLIENT_ID="your-client-id"
   STRAVA_CLIENT_SECRET="your-client-secret"
   STRAVA_REDIRECT_URI="http://localhost:5173/auth/strava/callback"
   ```

3. **Setup Webhook (optional - for auto-sync)**
   ```bash
   curl -X POST https://www.strava.com/api/v3/push_subscriptions \
     -F client_id=YOUR_CLIENT_ID \
     -F client_secret=YOUR_CLIENT_SECRET \
     -F callback_url=https://your-domain.com/api/strava/webhook \
     -F verify_token=YOUR_VERIFY_TOKEN
   ```

4. **User Flow**
   - User clicks "Connect Strava"
   - Redirected to Strava OAuth
   - Approves access
   - Redirected back with code
   - Backend exchanges code for tokens
   - Tokens stored in database with auto-refresh

---

## 📊 Design System

### Colors
```css
--sustraia-base: #F5F5F7       /* Background */
--sustraia-paper: #FFFFFF      /* Cards */
--sustraia-text: #111111       /* Text */
--sustraia-gray: #666666       /* Secondary text */
--sustraia-lightGray: #E5E5E5  /* Borders */
--sustraia-accent: #0033FF     /* Blue Klein - CTAs */
--sustraia-accentHover: #0022CC
```

### Typography
- **Display**: `font-display` (Archivo) - Titles
- **Body**: `font-sans` (Inter) - Paragraphs

### Components
- Rounded corners: `rounded-2xl`, `rounded-3xl`
- Shadows: `shadow-sm`, `shadow-xl` on hover
- Spacing: `gap-6`, `gap-8`, `p-6`, `p-8`
- Hover animations: `hover:-translate-y-1 transition-all duration-300`

---

## 🤝 Contributing

1. Follow existing code style
2. Write tests for new features
3. Ensure `npm run typecheck` passes
4. Maintain >80% test coverage
5. Update API documentation if adding endpoints

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🐛 Troubleshooting

### Database Connection Errors
```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change PORT in .env
```

### Prisma Client Not Generated
```bash
npm run db:generate
```

### Tests Failing
```bash
# Ensure test database is clean
npm run db:push
npm run test
```

---

## 📞 Support

For issues, please open a GitHub issue with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, etc.)

---

Built with ❤️ by the SUSTRAIA team
