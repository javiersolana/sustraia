import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-rax-cream flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img
            src="/images/logo.png"
            alt="SUSTRAIN Logo"
            className="h-16 w-auto"
          />
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="font-display font-black text-3xl text-rax-darkText tracking-tight mb-2">
            Bienvenido
          </h1>
          <p className="text-gray-500 font-medium">
            Inicia sesión para continuar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-50 border border-red-200"
            >
              <p className="text-sm font-medium text-red-600">{error}</p>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-bold text-rax-darkText mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border-2 border-gray-200 focus:border-rax-darkText focus:outline-none transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-rax-darkText mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border-2 border-gray-200 focus:border-rax-darkText focus:outline-none transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-rax-darkText focus:ring-rax-darkText" />
              <span className="text-gray-500 font-medium">Recordarme</span>
            </label>
            <Link to="/request-reset" className="text-rax-darkText font-bold hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <motion.button
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl bg-rax-darkText text-white font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            {!isLoading && <ArrowRight size={20} />}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-rax-darkText font-bold hover:underline">
              Regístrate
            </Link>
          </p>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          © 2025 SUSTRAIN. Todos los derechos reservados.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
