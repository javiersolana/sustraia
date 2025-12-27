import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'athlete' | 'coach' | null>(null);

  const handleLogin = (selectedRole: 'athlete' | 'coach') => {
    if (selectedRole === 'athlete') {
      navigate('/dashboard/atleta');
    } else {
      navigate('/dashboard/coach');
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
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sustraia-gray" size={20} />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-sustraia-light-gray focus:border-sustraia-accent focus:outline-none transition-colors font-medium"
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
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-sustraia-light-gray focus:border-sustraia-accent focus:outline-none transition-colors font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-sustraia-light-gray text-sustraia-accent focus:ring-sustraia-accent" />
                <span className="text-sustraia-gray font-medium">Recordarme</span>
              </label>
              <a href="#" className="text-sustraia-accent font-bold hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Role Selection (Demo) */}
            <div className="pt-4">
              <p className="text-xs text-sustraia-gray font-bold uppercase tracking-wide mb-3">
                Demo: Selecciona tu rol
              </p>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLogin('athlete')}
                  className="py-4 px-6 rounded-2xl border-2 border-sustraia-accent bg-blue-50 text-sustraia-accent font-bold hover:bg-sustraia-accent hover:text-white transition-all"
                >
                  Atleta
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLogin('coach')}
                  className="py-4 px-6 rounded-2xl border-2 border-sustraia-accent bg-blue-50 text-sustraia-accent font-bold hover:bg-sustraia-accent hover:text-white transition-all"
                >
                  Coach
                </motion.button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-4 px-6 rounded-full bg-sustraia-accent text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-sustraia-accent-hover transition-all flex items-center justify-center gap-2"
            >
              Iniciar Sesión
              <ArrowRight size={20} />
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-sustraia-gray">
              ¿No tienes cuenta?{' '}
              <a href="#" className="text-sustraia-accent font-bold hover:underline">
                Regístrate
              </a>
            </p>
          </div>
        </motion.div>

        <p className="text-center text-sm text-sustraia-gray mt-8">
          © 2025 SUSTRAIA. Todos los derechos reservados.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
