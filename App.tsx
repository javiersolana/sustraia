import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import ComoFunciona from './pages/ComoFunciona';
import Login from './pages/Login';
import AthleteDashboard from './pages/dashboards/AthleteDashboard';
import CoachDashboard from './pages/dashboards/CoachDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing pages with Layout (Navbar + Footer) */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/como-funciona" element={<Layout><ComoFunciona /></Layout>} />

        {/* Login page without Layout */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard pages without Layout (have their own Sidebar) */}
        <Route path="/dashboard/atleta" element={<AthleteDashboard />} />
        <Route path="/dashboard/coach" element={<CoachDashboard />} />
      </Routes>
    </Router>
  );
}
