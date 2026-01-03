import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Users, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, ApiError } from '../../lib/api/client';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ATLETA' | 'COACH'>('ATLETA');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await register(email, password, name, role);

      // Redirect based on user role
      if (response.user.role === 'ATLETA') {
        navigate('/dashboard/atleta');
      } else if (response.user.role === 'COACH') {
        navigate('/dashboard/coach');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error al crear cuenta. Por favor, intenta de nuevo.');
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
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="relative w-12 h-12 overflow-hidden rounded-full bg-gray-200 p-1">
            <img
              src="/images/logo2.png"
              alt="RAX Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-display font-black text-3xl tracking-tighter text-rax-darkText">RAX</span>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl border border-sustraia-light-gray p-8 lg:p-10"
        >
          <h1 className="font-display font-black text-3xl text-sustraia-text tracking-tight mb-2">
            Crear Cuenta
          </h1>
          <p className="text-sustraia-gray font-medium mb-8">
            Únete a la comunidad de coaching
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
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-sustraia-gray" size={20} />
                <input
                  type="text"
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-sustraia-light-gray focus:border-sustraia-accent focus:outline-none transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

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
                  minLength={6}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-sustraia-light-gray focus:border-sustraia-accent focus:outline-none transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-sustraia-gray mt-1 ml-1">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-3">
                Tipo de Cuenta
              </label>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  type="button"
                  onClick={() => setRole('ATLETA')}
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    role === 'ATLETA'
                      ? 'border-sustraia-accent bg-blue-50'
                      : 'border-sustraia-light-gray hover:border-sustraia-accent/50'
                  }`}
                >
                  <User size={24} className={role === 'ATLETA' ? 'text-sustraia-accent' : 'text-sustraia-gray'} />
                  <span className={`font-bold text-sm ${role === 'ATLETA' ? 'text-sustraia-accent' : 'text-sustraia-text'}`}>
                    Atleta
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => setRole('COACH')}
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    role === 'COACH'
                      ? 'border-sustraia-accent bg-blue-50'
                      : 'border-sustraia-light-gray hover:border-sustraia-accent/50'
                  }`}
                >
                  <Users size={24} className={role === 'COACH' ? 'text-sustraia-accent' : 'text-sustraia-gray'} />
                  <span className={`font-bold text-sm ${role === 'COACH' ? 'text-sustraia-accent' : 'text-sustraia-text'}`}>
                    Coach
                  </span>
                </motion.button>
              </div>
            </div>

            <motion.button
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-full bg-sustraia-accent text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-sustraia-accent-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              {!isLoading && <ArrowRight size={20} />}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-sustraia-gray">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-sustraia-accent font-bold hover:underline">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </motion.div>

        <p className="text-center text-sm text-gray-500 mt-8">
          © 2025 RAX. Todos los derechos reservados.
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
