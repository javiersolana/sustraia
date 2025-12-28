import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import ComoFunciona from './pages/ComoFunciona';
import Login from './pages/Login';
import AthleteDashboard from './pages/dashboards/AthleteDashboard';
import CoachDashboard from './pages/dashboards/CoachDashboard';
import Admin from './pages/Admin';
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
        <Route path="/dashboard/coach" element={<CoachDashboard />} />

        {/* Admin panel */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
