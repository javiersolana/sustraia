import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenEmail, setTokenEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token no encontrado');
      setVerifying(false);
      return;
    }

    // Verify token validity
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/verify-reset-token/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setTokenValid(true);
          setTokenEmail(data.email);
        } else {
          setError(data.error || 'Token inválido o expirado');
        }
      })
      .catch(() => {
        setError('Error al verificar el token');
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al restablecer contraseña');
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-xl"
        >
          <div className="w-12 h-12 border-4 border-[#0033FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#666666]">Verificando token...</p>
        </motion.div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-xl"
        >
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />

          <h1 className="text-3xl font-black text-[#111111] mb-4 tracking-tighter">
            Token inválido
          </h1>

          <p className="text-[#666666] mb-8">
            {error || 'El enlace ha expirado o ya fue utilizado. Por favor, solicita uno nuevo.'}
          </p>

          <Link
            to="/request-reset"
            className="inline-block bg-[#0033FF] hover:bg-[#0022CC] text-white font-bold px-8 py-4 rounded-xl transition-all hover:-translate-y-1 shadow-lg"
          >
            Solicitar nuevo enlace
          </Link>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
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
            ¡Contraseña actualizada!
          </h1>

          <p className="text-[#666666] mb-8">
            Tu contraseña ha sido restablecida correctamente.<br />
            Redirigiendo al login...
          </p>

          <Link
            to="/login"
            className="inline-block bg-[#0033FF] hover:bg-[#0022CC] text-white font-bold px-8 py-4 rounded-xl transition-all hover:-translate-y-1 shadow-lg"
          >
            Ir al login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-12 max-w-md w-full shadow-xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#111111] tracking-tighter mb-2">
            SUSTRAIA
          </h1>
          <p className="text-[#666666]">Nueva contraseña</p>
          {tokenEmail && (
            <p className="text-sm text-[#999999] mt-2">
              {tokenEmail}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-semibold text-[#111111] mb-2">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-xl border border-[#E5E5E5] focus:border-[#0033FF] focus:ring-2 focus:ring-[#0033FF]/20 outline-none transition-all"
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#111111]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#111111] mb-2">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#E5E5E5] focus:border-[#0033FF] focus:ring-2 focus:ring-[#0033FF]/20 outline-none transition-all"
                placeholder="Repite la contraseña"
                required
                disabled={loading}
                minLength={6}
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
            {loading ? 'Actualizando...' : 'Restablecer contraseña'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-[#E5E5E5]">
          <p className="text-xs text-[#999999] text-center">
            Asegúrate de usar una contraseña segura que no hayas utilizado antes.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
