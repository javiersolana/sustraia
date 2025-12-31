import React from 'react';
import { motion } from 'framer-motion';

const experts = [
  {
    name: "Jonander Garcia",
    role: "Especialista Resistencia & Oposiciones",
    image: "/images/jonander-garcia.jpg",
    quote: "Atleta nacional. Su metodología ha ayudado a decenas de aspirantes a conseguir su plaza en Ertzaintza y Bomberos optimizando los tiempos de carrera y natación."
  },
  {
    name: "Unai Gazpio",
    role: "MSc Sports Science & Fuerza",
    image: "/images/unai-gazpio.jpg",
    quote: "Especialista en desarrollo de fuerza aplicada. Se encarga de que ganes potencia para el press banca, cuerda y dominadas minimizando el riesgo de lesión."
  }
];

export const Experts: React.FC = () => {
  return (
    <section id="experts" className="py-16 bg-rax-cream border-t border-gray-300">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-display font-black text-rax-darkText mb-4">
            EXPERTOS EN HACER <br />
            CUMPLIR TUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-rax-red via-rax-purple to-rax-green">OBJETIVOS</span>
          </h2>
          <p className="text-lg text-gray-600 font-light italic">
            "No estás solo. Tienes a un equipo de élite en tu esquina."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
