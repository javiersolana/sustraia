import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import ComoFunciona from './pages/ComoFunciona';
import Login from './pages/Login';
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
import StravaCallback from './pages/auth/StravaCallback';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing pages with Layout (Navbar + Footer) */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/como-funciona" element={<Layout><ComoFunciona /></Layout>} />

        {/* Login page without Layout */}
        <Route path="/login" element={<Login />} />

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
      </Routes>
    </Router>
  );
}
