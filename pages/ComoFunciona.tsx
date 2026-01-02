import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

export default function ComoFunciona() {
  const memberships = [
    {
      title: "PRO",
      price: "39€/mes",
      description: "Para opositores que buscan estructura y seguimiento profesional",
      features: ["Planificación personalizada", "Ajustes semanales", "Chat con coach", "Análisis de rendimiento"]
    },
    {
      title: "ELITE",
      price: "79€/mes",
      description: "Máxima personalización para asegurar tu plaza",
      features: ["Todo lo de PRO", "Videollamadas mensuales", "Corrección técnica ilimitada", "Nutrición orientativa"],
      highlighted: true
    },
  ];

  const features = [
    {
      number: "01",
      title: "Tu Calibración Personal",
      subtitle: "Las Primeras 4 Semanas",
      description: "Tu SUSTRAIA se adapta a ti—porque ningún opositor es igual. Durante el primer mes analizamos tu nivel de partida, disponibilidad horaria y distancia con las marcas objetivo. Establecemos tu línea base en resistencia cardiovascular, fuerza máxima y capacidad anaeróbica.",
      metrics: ["Course Navette VO2max", "Press Banca 1RM", "Dominadas AMRAP", "Tiempo Natación 50m"],
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop",
    },
    {
      number: "02",
      title: "Periodización Inteligente",
      subtitle: "Estructura de Macrociclos",
      description: "Dividimos tu preparación en bloques de 4-6 semanas con objetivos específicos: hipertrofia funcional, fuerza máxima, potencia y pico de forma. Cada fase prepara la siguiente. La app ajusta automáticamente las cargas según tu feedback diario de fatiga.",
      metrics: ["Fase Anatómica", "Bloque Fuerza", "Fase Potencia", "Taper Pre-Examen"],
      image: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?q=80&w=2074&auto=format&fit=crop",
    },
    {
      number: "03",
      title: "Análisis de Rendimiento",
      subtitle: "Métricas que Importan",
      description: "Olvida las calorías quemadas. Monitorizamos variables predictivas de éxito: velocidad aeróbica máxima (VAM), ratios de fuerza relativa, tiempos parciales en natación y capacidad de recuperación. Cada simulacro queda registrado para comparar tu evolución real.",
      metrics: ["VAM & Zonas FC", "Fuerza/Peso Corporal", "Splits Natación", "HRV Recuperación"],
      image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2070&auto=format&fit=crop",
    },
    {
      number: "04",
      title: "Integración Vida Real",
      subtitle: "Flexibilidad sin Caos",
      description: "Trabajas a turnos, tienes familia o estudias mientras entrenas. El sistema reorganiza las sesiones si saltas un día, prioriza lo crítico y redistribuye el volumen. No pierdes la estructura aunque tu semana sea impredecible.",
      metrics: ["Replanificación 48h", "Prioridad Ejercicios", "Volumen Adaptativo", "Chat Directo Coach"],
      image: "https://images.unsplash.com/photo-1486218119243-13883505764c?q=80&w=2013&auto=format&fit=crop",
    },
    {
      number: "05",
      title: "Preparación Mental",
      subtitle: "Gestión del Día D",
      description: "El nerviosismo del examen puede arruinar meses de preparación. Incluimos protocolos de respiración, visualización pre-competitiva y estrategias de pacing. Tu coach simula las condiciones exactas del examen para que llegues con confianza absoluta.",
      metrics: ["Protocolos Respiración", "Visualización Guiada", "Estrategia Pacing", "Simulacro Completo"],
      image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2070&auto=format&fit=crop",
    },
  ];

  return (
    <section className="py-32 bg-rax-cream">
      <div className="container mx-auto px-6">
        {/* Hero Claim */}
        <div className="max-w-5xl mx-auto text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display font-black text-5xl md:text-6xl lg:text-8xl tracking-tight mb-10 leading-[0.95] text-rax-darkText">
              TU RAX SE<br />
              CALIBRA A TI—<br />
              <span className="text-rax-red">PORQUE NINGÚN<br />OPOSITOR ES IGUAL</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Del primer día al examen: así transformamos tu preparación en resultados medibles.
            </p>
          </motion.div>
        </div>

        {/* Membership Options */}
        <div className="max-w-4xl mx-auto mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {memberships.map((membership, index) => (
              <div
                key={membership.title}
                className={cn(
                  "relative p-8 md:p-10 rounded-3xl border-2 transition-all hover:shadow-xl",
                  membership.highlighted
                    ? "bg-rax-darkText text-white border-rax-darkText"
                    : "bg-white border-gray-200"
                )}
              >
                {membership.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rax-red text-white text-xs font-bold px-6 py-2 rounded-full">
                    MÁS POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display font-black text-3xl mb-2">{membership.title}</h3>
                  <p className={cn(
                    "text-sm mb-4",
                    membership.highlighted ? "text-gray-300" : "text-gray-600"
                  )}>
                    {membership.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-4xl">{membership.price}</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {membership.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className={cn(
                        "w-5 h-5 shrink-0 mt-0.5",
                        membership.highlighted ? "text-rax-green" : "text-rax-green"
                      )} />
                      <span className={membership.highlighted ? "text-gray-100" : "text-rax-darkText"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Feature Sections */}
        <div className="space-y-32">
          {features.map((feature, index) => (
            <motion.div
              key={feature.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={cn(
                "grid md:grid-cols-2 gap-12 md:gap-16 items-center",
                index % 2 === 1 && "md:grid-flow-dense"
              )}
            >
              {/* Image */}
              <div className={cn("relative", index % 2 === 1 && "md:col-start-2")}>
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating number badge */}
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-rax-red rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="font-display font-black text-3xl text-white">{feature.number}</span>
                </div>
              </div>

              {/* Content */}
              <div className={cn("space-y-6", index % 2 === 1 && "md:col-start-1 md:row-start-1")}>
                <div>
                  <p className="text-rax-red font-bold uppercase tracking-wider text-sm mb-3">
                    {feature.subtitle}
                  </p>
                  <h3 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-6 leading-tight text-rax-darkText">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {feature.metrics.map((metric, i) => (
                    <div
                      key={i}
                      className="bg-white p-4 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-rax-green rounded-full"></div>
                        <p className="text-sm font-bold text-rax-darkText">{metric}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-32 text-center bg-gradient-to-br from-rax-red to-rax-purple rounded-3xl p-12 md:p-16 text-white"
        >
          <h3 className="font-display font-black text-3xl md:text-4xl mb-4">
            ¿Listo para tu calibración?
          </h3>
          <p className="text-red-100 text-lg mb-8 max-w-2xl mx-auto">
            El primer mes establecemos tu perfil de rendimiento y construimos tu planificación personalizada.
          </p>
          <Button variant="secondary" size="lg" className="bg-white text-rax-red hover:bg-gray-100">
            Empezar Ahora
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
