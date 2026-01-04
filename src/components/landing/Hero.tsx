import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-rax-cream overflow-hidden flex items-center pt-16">

      {/* Decorative Background Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-400/15 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-20 w-[300px] h-[300px] bg-purple-400/10 rounded-full blur-[80px] mix-blend-screen pointer-events-none" />

      {/* Abstract Lines / Texture Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-8 items-center relative z-10">

        {/* Left: Typography & CTA */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-display font-black text-rax-darkText leading-[0.9] tracking-tighter mb-4">
              TU <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-purple-700">OBJETIVO</span>,<br />
              TU <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">MOMENTO</span>.
            </h1>

            <p className="text-xl text-gray-600 font-light max-w-lg leading-relaxed border-l-4 border-gray-300 pl-6">
              <span className="text-rax-darkText font-bold">SUSTRAIN</span> unifica running, salud y oposición en una metodología única.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-4 items-center"
          >
            <Link
              to="/contacto"
              className="bg-rax-darkText text-white px-8 py-4 font-black text-lg tracking-wide hover:bg-gray-800 transition-colors flex items-center gap-2 group rounded-xl"
            >
              ZONA ATLETAS
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <div className="pt-6 flex items-center gap-8 text-gray-500 font-mono text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              ZONA ATLETAS
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse delay-75"></div>
              HEALTH
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-150"></div>
              OPOSICIONES
            </div>
          </div>
        </div>

        {/* Right: Dynamic Visual Composition */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-[600px] hidden md:block"
        >
          {/* Main Character Image - Masked/Styled */}
          <div className="absolute inset-0 z-20">
            <img
              src="/images/hero-runner.jpg"
              alt="Elite Runner"
              className="w-full h-full object-cover object-center rounded-sm mask-image-linear-gradient grayscale hover:grayscale-0 transition-all duration-700"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 0% 100%)' }}
            />
            {/* Gradient Overlay on Image */}
            <div className="absolute inset-0 bg-gradient-to-tr from-rax-dark/80 via-transparent to-transparent z-30" style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 0% 100%)' }}></div>
          </div>

          {/* Graphical Elements Behind */}
          <div className="absolute top-10 right-0 w-2/3 h-full border-r-2 border-purple-500/30 z-10 transform translate-x-4 translate-y-4"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-400/20 blur-2xl rounded-full z-0"></div>

        </motion.div>
      </div>
    </div>
  );
};
