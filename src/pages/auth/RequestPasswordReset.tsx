import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RequestPasswordReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/request-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al solicitar restablecimiento');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-rax-cream flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          </motion.div>

          <h1 className="text-3xl font-black text-[#111111] mb-4 tracking-tighter">
            ¡Revisa tu email!
          </h1>

          <p className="text-[#666666] mb-8">
            Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
            El enlace es válido por <strong>1 hora</strong>.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[#0033FF] font-semibold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rax-cream flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-12 max-w-md w-full shadow-xl"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-12 h-12 overflow-hidden rounded-full bg-gray-200 p-1">
              <img
                src="/images/logo2.png"
                alt="RAX Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-3xl font-display font-black text-rax-darkText tracking-tighter">RAX</span>
          </div>
          <p className="text-gray-500">Restablecer contraseña</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#111111] mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#E5E5E5] focus:border-[#0033FF] focus:ring-2 focus:ring-[#0033FF]/20 outline-none transition-all"
                placeholder="tu@email.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0033FF] hover:bg-[#0022CC] text-white font-bold py-4 rounded-xl transition-all hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[#666666] text-sm hover:text-[#0033FF] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al login
            </Link>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-[#E5E5E5]">
          <p className="text-xs text-[#999999] text-center">
            Te enviaremos un email con instrucciones para restablecer tu contraseña.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
