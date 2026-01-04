import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'https://sustraia.onrender.com';

export default function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    localidad: '',
    expectativas: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.message || 'Error al enviar el formulario');
      }
    } catch (err) {
      setError('Error de conexión. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-rax-cream flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display font-black text-3xl text-rax-darkText mb-4">
            ¡Mensaje Enviado!
          </h2>
          <p className="text-gray-600 mb-8">
            Hemos recibido tu mensaje. Nos pondremos en contacto contigo lo antes posible. ¡Gracias por confiar en SUSTRAIN!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-rax-darkText text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rax-cream relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-400/20 to-purple-400/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-rax-darkText transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Volver</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <Link to="/" className="inline-block mb-6">
              <img src="/images/logo.png" alt="SUSTRAIN" className="h-12 mx-auto" />
            </Link>
            <h1 className="font-display font-black text-4xl md:text-5xl text-rax-darkText mb-4">
              EMPIEZA TU <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-teal-400">CAMBIO</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Cuéntanos un poco sobre ti y nos pondremos en contacto contigo.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100"
          >
            <div className="space-y-6">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-bold text-rax-darkText mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all text-rax-darkText"
                  placeholder="Tu nombre completo"
                />
              </div>

              {/* Correo */}
              <div>
                <label htmlFor="correo" className="block text-sm font-bold text-rax-darkText mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  required
                  value={formData.correo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all text-rax-darkText"
                  placeholder="tu@email.com"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-bold text-rax-darkText mb-2">
                  Teléfono <span className="text-gray-400 font-normal text-xs">(opcional)</span>
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all text-rax-darkText"
                  placeholder="+34 XXX XXX XXX"
                />
              </div>

              {/* Localidad */}
              <div>
                <label htmlFor="localidad" className="block text-sm font-bold text-rax-darkText mb-2">
                  Localidad
                </label>
                <input
                  type="text"
                  id="localidad"
                  name="localidad"
                  required
                  value={formData.localidad}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all text-rax-darkText"
                  placeholder="Ciudad, País"
                />
              </div>

              {/* Expectativas */}
              <div>
                <label htmlFor="expectativas" className="block text-sm font-bold text-rax-darkText mb-2">
                  ¿Cómo podemos ayudarte?
                </label>
                <textarea
                  id="expectativas"
                  name="expectativas"
                  required
                  rows={4}
                  value={formData.expectativas}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all text-rax-darkText resize-none"
                  placeholder="Cuéntanos tu historia, tus objetivos, cómo podemos ayudarte..."
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 bg-gradient-to-r from-purple-500 to-teal-400 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>Enviando...</span>
              ) : (
                <>
                  <span>Enviar mensaje</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Al enviar este formulario aceptas que nos pongamos en contacto contigo.
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
