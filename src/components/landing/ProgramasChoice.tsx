import React from 'react';
import { motion } from 'framer-motion';
import { Mountain, Target, Trophy, ArrowRight } from 'lucide-react';

export const ProgramasChoice = () => {
  const programs = [
    {
      id: 'running',
      title: 'RUNNING & TRAIL',
      subtitle: 'MONTAÑA | ASFALTO | ULTRAS',
      description: 'Desde tu primer 5K hasta ultras de montaña. Entrenamiento periodizado con métricas que importan: VAM, umbrales, potencia. Para corredores que quieren resultados reales.',
      features: [
        'Planes adaptativos según tu disponibilidad',
        'Integración Strava automática',
        'Análisis de rendimiento semanal',
        'Preparación mental pre-carrera'
      ],
      image: '/images/running.jpeg',
      color: 'from-rax-green to-emerald-600',
      icon: Mountain,
      cta: 'Empezar a Correr'
    },
    {
      id: 'cambio',
      title: 'CAMBIO FÍSICO',
      subtitle: 'FUERZA | HIPERTROFIA | RENDIMIENTO',
      description: 'Transformación corporal basada en ciencia. No dietas milagro, no trucos. Solo periodización inteligente, tracking honesto y resultados sostenibles. Gamificado para que sea adictivo.',
      features: [
        'Programación de fuerza progresiva',
        'Nutrición orientativa sin restricciones extremas',
        'Métricas corporales y de rendimiento',
        'Sistema de logros y hábitos'
      ],
      image: '/images/cambio.jpeg',
      color: 'from-rax-purple to-purple-700',
      icon: Target,
      cta: 'Transformarme Ahora'
    },
    {
      id: 'oposiciones',
      title: 'OPOSICIONES',
      subtitle: 'POLICÍA | BOMBEROS | MILITAR',
      description: 'La parte física no debería ser tu obstáculo. Supera las pruebas con sobrada y céntrate en estudiar. Sistema específico para Course Navette, dominadas, press banca y natación.',
      features: [
        'Protocolos específicos por cuerpo (CNP, bomberos, militar)',
        'Simulacros cronometrados de examen',
        'Trabajo técnico en cada prueba',
        'Planificación hasta el día del examen'
      ],
      image: '/images/oposiciones.jpeg',
      color: 'from-rax-red to-red-700',
      icon: Trophy,
      cta: 'Preparar Mi Plaza'
    }
  ];

  return (
    <section className="py-24 bg-rax-dark relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-rax-red rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rax-purple rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-black text-5xl md:text-6xl lg:text-7xl tracking-tight text-white mb-6">
            NUESTROS <span className="text-rax-red">P</span>ROGRAMAS
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-medium">
            <span className="text-rax-green">RUNNING & TRAIL</span> | <span className="text-rax-purple">CAMBIO FÍSICO</span> | <span className="text-rax-red">OPOSICIONES</span>
          </p>
        </motion.div>

        {/* Programs Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {programs.map((program, index) => {
            const Icon = program.icon;
            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group relative"
              >
                {/* Card */}
                <div className="relative h-full bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-500 hover:shadow-2xl hover:shadow-rax-red/20">
                  {/* Image with overlay */}
                  <div className="relative h-64 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-b ${program.color} opacity-60 z-10 group-hover:opacity-50 transition-opacity duration-500`}></div>
                    <img
                      src={program.image}
                      alt={program.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Icon Badge */}
                    <div className="absolute top-4 right-4 z-20 w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-8">
                    <h3 className="font-display font-black text-3xl text-white mb-2">
                      {program.title}
                    </h3>
                    <p className={`text-sm font-bold uppercase tracking-wider mb-4 bg-gradient-to-r ${program.color} bg-clip-text text-transparent`}>
                      {program.subtitle}
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      {program.description}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-2 mb-8">
                      {program.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                          <div className="w-1.5 h-1.5 bg-rax-red rounded-full mt-1.5 shrink-0"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button className={`w-full bg-gradient-to-r ${program.color} text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 group/btn`}>
                      <span className="text-sm">{program.cta}</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
