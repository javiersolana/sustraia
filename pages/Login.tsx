import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, ApiError } from '../lib/api/client';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(email, password);

      // Redirect based on user role
      if (response.user.role === 'ATLETA') {
        navigate('/dashboard/atleta');
      } else if (response.user.role === 'COACH') {
        navigate('/dashboard/coach');
      } else if (response.user.role === 'ADMIN') {
        navigate('/admin');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sustraia-base flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 bg-sustraia-accent rounded-2xl flex items-center justify-center">
            <Activity className="text-white w-7 h-7" />
          </div>
          <span className="font-display font-black text-3xl tracking-tighter text-sustraia-text">SUSTRAIA</span>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl border border-sustraia-light-gray p-8 lg:p-10"
        >
          <h1 className="font-display font-black text-3xl text-sustraia-text tracking-tight mb-2">
            Bienvenido
          </h1>
          <p className="text-sustraia-gray font-medium mb-8">
            Inicia sesión para continuar
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                <p className="text-sm font-medium text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sustraia-gray" size={20} />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-sustraia-light-gray focus:border-sustraia-accent focus:outline-none transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sustraia-gray" size={20} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-sustraia-light-gray focus:border-sustraia-accent focus:outline-none transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-sustraia-light-gray text-sustraia-accent focus:ring-sustraia-accent" />
                <span className="text-sustraia-gray font-medium">Recordarme</span>
              </label>
              <Link to="/request-reset" className="text-sustraia-accent font-bold hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <motion.button
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-full bg-sustraia-accent text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-sustraia-accent-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              {!isLoading && <ArrowRight size={20} />}
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center text-sm text-sustraia-gray mt-8">
          © 2025 SUSTRAIA. Todos los derechos reservados.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
