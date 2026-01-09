import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import ComoFunciona from './pages/ComoFunciona';
import Contacto from './pages/Contacto';
import Login from './pages/Login';
import Register from './pages/Register';
import AthleteDashboard from './pages/dashboards/AthleteDashboard';
import CoachDashboard from './pages/dashboards/CoachDashboard';
import AthleteDetailView from './pages/dashboards/AthleteDetailView';
import ProgressView from './pages/dashboards/ProgressView';
import ActivitiesView from './pages/dashboards/ActivitiesView';
import ActivityAnalysis from './pages/dashboards/ActivityAnalysis';
import AthleteCalendarView from './pages/dashboards/AthleteCalendarView';
import CoachAthletesView from './pages/dashboards/CoachAthletesView';
import CoachCalendarView from './pages/dashboards/CoachCalendarView';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Achievements from './pages/AchievementsNew';
import Groups from './pages/Groups';
import Messages from './pages/Messages';
import StravaCallback from './pages/auth/StravaCallback';
import RequestPasswordReset from './pages/auth/RequestPasswordReset';
import ResetPassword from './pages/auth/ResetPassword';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing pages with Layout (Navbar + Footer) */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/como-funciona" element={<Layout><ComoFunciona /></Layout>} />

        {/* Contact form without Layout */}
        <Route path="/contacto" element={<Contacto />} />

        {/* Auth pages without Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Password reset pages without Layout */}
        <Route path="/request-reset" element={<RequestPasswordReset />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* OAuth callbacks */}
        <Route path="/auth/strava/callback" element={<StravaCallback />} />

        {/* Dashboard pages without Layout (have their own Sidebar) */}
        <Route path="/dashboard/atleta" element={<AthleteDashboard />} />
        <Route path="/dashboard/atleta/progreso" element={<ProgressView />} />
        <Route path="/dashboard/atleta/actividades" element={<ActivitiesView />} />
        <Route path="/dashboard/atleta/actividades/:id" element={<ActivityAnalysis />} />
        <Route path="/dashboard/atleta/calendario" element={<AthleteCalendarView />} />
        <Route path="/dashboard/coach" element={<CoachDashboard />} />
        <Route path="/dashboard/coach/atletas" element={<CoachAthletesView />} />
        <Route path="/dashboard/coach/calendario" element={<CoachCalendarView />} />
        <Route path="/coach/athlete/:athleteId" element={<AthleteDetailView />} />

        {/* Admin panel */}
        <Route path="/admin" element={<Admin />} />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />

        {/* Quick Wins: Achievements and Groups */}
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/cuadrilla" element={<Groups />} />

        {/* Messages */}
        <Route path="/messages" element={<Messages />} />
      </Routes>
    </Router>
  );
}
