import React from 'react';
import { motion } from 'framer-motion';
import { Timer, Heart, Target, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Program, ProgramType } from '../types';

const programs: Program[] = [
  {
    id: 'running',
    type: ProgramType.RUNNING,
    title: 'RAX RUNNING',
    subtitle: 'Domina la pista',
    description: 'Entrenamientos personalizados basados en tus métricas actuales. Desde 5K hasta Maratón, optimizamos cada zancada.',
    features: ['Planes adaptativos', 'Análisis de técnica', 'Prevención de lesiones'],
    color: 'bg-rax-red',
    iconName: 'Timer'
  },
  {
    id: 'health',
    type: ProgramType.HEALTH,
    title: 'RAX HEALTH',
    subtitle: 'Vida en movimiento',
    description: 'Conecta con la naturaleza y tu cuerpo. Programas de salud integral, nutrición y Trail Running para una vida plena.',
    features: ['Nutrición deportiva', 'Fuerza y movilidad', 'Mindfulness activo'],
    color: 'bg-rax-green',
    iconName: 'Heart'
  },
  {
    id: 'oposiciones',
    type: ProgramType.OPOSICIONES,
    title: 'RAX OPOSICIONES',
    subtitle: 'Tu plaza, tu meta',
    description: 'Preparación física de alto rendimiento para fuerzas y cuerpos de seguridad. El X que marca tu objetivo profesional.',
    features: ['Simulacros reales', 'Planificación estratégica', 'Seguimiento 24/7'],
    color: 'bg-rax-purple',
    iconName: 'Target'
  }
];

const getIcon = (name: string) => {
  switch(name) {
    case 'Timer': return <Timer size={40} />;
    case 'Heart': return <Heart size={40} />;
    case 'Target': return <Target size={40} />;
    default: return <Timer size={40} />;
  }
};

const getTextureClass = (type: ProgramType) => {
  switch(type) {
    case ProgramType.RUNNING: return 'tartan-pattern';
    case ProgramType.HEALTH: return 'mountain-pattern';
    case ProgramType.OPOSICIONES: return 'target-pattern';
    default: return '';
  }
};

export const ProgramSection: React.FC = () => {
  return (
    <section className="py-24 bg-rax-dark relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6">
            ELIGE TU <span className="text-transparent bg-clip-text bg-gradient-to-r from-rax-red via-rax-purple to-rax-green">CAMINO</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            No importa cuál sea tu meta, tenemos la metodología científica y la pasión para llevarte allí.
          </p>
        </div>

        <div className="space-y-32">
          {programs.map((program, index) => (
            <motion.div 
              id={program.id}
              key={program.id}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className={`flex flex-col ${index % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center group`}
            >
              {/* Visual Side with Texture */}
              <div className="w-full md:w-1/2 relative">
                <div className={`aspect-[4/5] md:aspect-square rounded-2xl overflow-hidden relative shadow-2xl transform transition-transform duration-700 group-hover:scale-[1.02] ${getTextureClass(program.type)}`}>
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                  
                  {/* Content inside texture card */}
                  <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                    <div className="mb-4 text-white opacity-80">
                      {getIcon(program.iconName)}
                    </div>
                    <h3 className="text-4xl font-display font-black text-white mb-2 uppercase tracking-tight">
                      {program.title}
                    </h3>
                    <p className="text-white/80 font-mono text-sm uppercase tracking-widest">
                      {program.subtitle}
                    </p>
                  </div>

                  {/* Decorative Elements specific to texture */}
                  {program.type === ProgramType.RUNNING && (
                    <div className="absolute top-0 right-0 w-full h-full opacity-20 border-[20px] border-white/10 rounded-2xl pointer-events-none"></div>
                  )}
                   {program.type === ProgramType.OPOSICIONES && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                      <Target size={300} strokeWidth={0.5} className="text-white" />
                    </div>
                  )}

                </div>
              </div>

              {/* Text Content Side */}
              <div className="w-full md:w-1/2 space-y-8">
                <div>
                  <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 ${
                    program.type === ProgramType.RUNNING ? 'text-rax-red' : 
                    program.type === ProgramType.HEALTH ? 'text-rax-green' : 'text-rax-purple'
                  }`}>
                    Metodología RAX
                  </h4>
                  <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                    {program.description}
                  </h3>
                </div>

                <ul className="space-y-4">
                  {program.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-4 text-gray-300">
                      <CheckCircle2 size={20} className={
                        program.type === ProgramType.RUNNING ? 'text-rax-red' : 
                        program.type === ProgramType.HEALTH ? 'text-rax-green' : 'text-rax-purple'
                      } />
                      <span className="font-medium text-lg">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`mt-8 px-8 py-4 rounded-sm font-bold text-white flex items-center gap-3 transition-all hover:gap-5 ${
                    program.type === ProgramType.RUNNING ? 'bg-rax-red hover:bg-red-700' : 
                    program.type === ProgramType.HEALTH ? 'bg-rax-green hover:bg-emerald-700' : 'bg-rax-purple hover:bg-purple-800'
                }`}>
                  EMPEZAR AHORA <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};