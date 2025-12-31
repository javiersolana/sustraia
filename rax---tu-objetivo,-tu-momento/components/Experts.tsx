import React from 'react';
import { motion } from 'framer-motion';

const experts = [
  {
    name: "Dr. Elena García",
    role: "Directora de Rendimiento",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=2787&auto=format&fit=crop",
    quote: "La ciencia aplicada al deporte es lo que separa un buen resultado de un récord."
  },
  {
    name: "Marc Torres",
    role: "Head Coach Oposiciones",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop",
    quote: "No entrenamos para aprobar. Entrenamos para ser los mejores de la promoción."
  },
  {
    name: "Sofía Mendez",
    role: "Nutrición y Salud",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2788&auto=format&fit=crop",
    quote: "Tu cuerpo es el motor. La nutrición es el combustible de tu éxito."
  }
];

export const Experts: React.FC = () => {
  return (
    <section id="experts" className="py-24 bg-gradient-to-b from-rax-dark to-black border-t border-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6">
            EXPERTOS EN HACER <br />
            <span className="text-gray-500">CUMPLIR TUS OBJETIVOS</span>
          </h2>
          <p className="text-xl text-gray-400 font-light italic">
            "No estás solo. Tienes a un equipo de élite en tu esquina."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {experts.map((expert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group relative"
            >
              <div className="h-[400px] w-full overflow-hidden rounded-xl grayscale group-hover:grayscale-0 transition-all duration-500 relative">
                <img 
                  src={expert.image} 
                  alt={expert.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                
                <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-rax-red font-bold text-xs uppercase tracking-widest mb-1">{expert.role}</p>
                  <h3 className="text-2xl font-bold text-white mb-3">{expert.name}</h3>
                  <div className="h-0.5 w-0 group-hover:w-full bg-white transition-all duration-500 mb-4"></div>
                  <p className="text-gray-300 text-sm italic opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    "{expert.quote}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};