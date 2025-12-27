import React from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ArrowUpRight, Check, ChevronDown, Instagram, Shield, User, Timer, Trophy } from 'lucide-react';
import { Button } from './components/ui/Button';
import { cn } from './lib/utils';

// --- Components ---

const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 bg-sustraia-base/90 backdrop-blur-md border-b border-sustraia-text/5">
    <div className="container mx-auto px-6 h-20 flex items-center justify-between">
      <div className="font-display font-black text-2xl tracking-tight text-sustraia-text">
        SUSTRAIA
      </div>
      <div className="hidden md:flex gap-8">
        <a href="#como-funciona" className="text-sm font-medium text-sustraia-gray hover:text-sustraia-accent transition-colors">
          Cómo funciona
        </a>
        {['Oposiciones', 'Metodología', 'Coaches', 'Planes'].map((link) => (
          <a key={link} href="#" className="text-sm font-medium text-sustraia-gray hover:text-sustraia-accent transition-colors">
            {link}
          </a>
        ))}
      </div>
      <Button variant="secondary" size="sm" className="hidden sm:flex bg-black text-white hover:bg-sustraia-accent border-0">
        Area Atletas
      </Button>
    </div>
  </nav>
);

const Hero = () => {
  return (
    <section className="relative min-h-screen pt-20 flex flex-col justify-center overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12">
        
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 max-w-2xl"
        >
          <div className="inline-block px-3 py-1 mb-6 rounded-full bg-blue-100 text-sustraia-accent text-xs font-bold tracking-wider uppercase">
            Especialistas en Alto Rendimiento
          </div>
          <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tighter text-sustraia-text mb-8">
            TU PLAZA.<br />
            TU OBJETIVO.<br />
            <span className="text-sustraia-accent">TU MOMENTO.</span>
          </h1>
          <p className="font-sans text-lg md:text-xl text-sustraia-gray max-w-xl leading-relaxed mb-10">
            Plataforma de entrenamiento híbrido. Preparamos tus pruebas físicas de <strong>Ertzaintza, Bomberos y Policía</strong> con la precisión de un atleta de élite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" icon>Preparar Oposición</Button>
            <Button variant="outline" size="lg">Entrenamiento Personal</Button>
          </div>
        </motion.div>

        {/* Hero Visuals */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 w-full max-w-lg md:max-w-none relative"
        >
           <div className="aspect-[3/4] md:aspect-square rounded-3xl overflow-hidden relative shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=2070&auto=format&fit=crop" 
                className="w-full h-full object-cover grayscale contrast-125"
                alt="Training"
              />
              <div className="absolute inset-0 bg-sustraia-accent/10 mix-blend-multiply"></div>
              
              {/* Floating Badge */}
              <div className="absolute bottom-8 left-8 bg-white p-6 rounded-2xl shadow-xl max-w-xs hidden md:block">
                 <div className="flex items-center gap-3 mb-2">
                    <Shield className="text-sustraia-accent w-6 h-6" />
                    <span className="font-bold font-display text-lg">Objetivo Claro</span>
                 </div>
                 <p className="text-sm text-gray-500">Planificación específica para superar las marcas exigidas en tu convocatoria.</p>
              </div>
           </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureCard = ({ number, title, desc, delay }: { number: string, title: string, desc: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-sustraia-accent/30 transition-all group"
  >
    <div className="flex justify-between items-start mb-6">
      <span className="font-display font-bold text-4xl text-gray-200 group-hover:text-sustraia-accent transition-colors">0{number}</span>
      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-sustraia-accent transition-colors" />
    </div>
    <h3 className="font-display font-bold text-xl mb-3">{title}</h3>
    <p className="text-sustraia-gray leading-relaxed text-sm">{desc}</p>
  </motion.div>
);

const Methodology = () => (
  <section className="py-24 bg-sustraia-base">
    <div className="container mx-auto px-6">
      <div className="text-center max-w-2xl mx-auto mb-20">
        <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-6">
          ENTRENAMIENTO INTELIGENTE
        </h2>
        <p className="text-sustraia-gray text-lg">
          Olvídate de las rutinas genéricas en PDF. Creamos una estructura dinámica que se adapta a tu progreso y a las fechas de tu examen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard 
          number="1"
          title="Planificación Líquida"
          desc="Tu disponibilidad cambia, tu plan también. Ajustes semanales basados en tu fatiga y rendimiento real."
          delay={0}
        />
        <FeatureCard 
          number="2"
          title="Simulacros de Examen"
          desc="Integramos las pruebas específicas (course navette, dominadas, natación) en tu ciclo de entrenamiento."
          delay={0.2}
        />
        <FeatureCard 
          number="3"
          title="Coach Humano"
          desc="Nada sustituye el ojo experto. Chat directo para correcciones técnicas, dudas y gestión de nervios."
          delay={0.4}
        />
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => {
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
    <section id="como-funciona" className="py-32 bg-white">
      <div className="container mx-auto px-6">
        {/* Hero Claim */}
        <div className="max-w-5xl mx-auto text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display font-black text-5xl md:text-6xl lg:text-8xl tracking-tight mb-10 leading-[0.95]">
              TU SUSTRAIA SE<br />
              CALIBRA A TI—<br />
              <span className="text-sustraia-accent">PORQUE NINGÚN<br />OPOSITOR ES IGUAL</span>
            </h2>
            <p className="text-xl md:text-2xl text-sustraia-gray max-w-3xl mx-auto leading-relaxed font-medium">
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
                    ? "bg-sustraia-text text-white border-sustraia-text"
                    : "bg-white border-gray-200"
                )}
              >
                {membership.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sustraia-accent text-white text-xs font-bold px-6 py-2 rounded-full">
                    MÁS POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display font-black text-3xl mb-2">{membership.title}</h3>
                  <p className={cn(
                    "text-sm mb-4",
                    membership.highlighted ? "text-gray-300" : "text-sustraia-gray"
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
                        membership.highlighted ? "text-sustraia-accent" : "text-sustraia-accent"
                      )} />
                      <span className={membership.highlighted ? "text-gray-100" : "text-sustraia-text"}>
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
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-sustraia-accent rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="font-display font-black text-3xl text-white">{feature.number}</span>
                </div>
              </div>

              {/* Content */}
              <div className={cn("space-y-6", index % 2 === 1 && "md:col-start-1 md:row-start-1")}>
                <div>
                  <p className="text-sustraia-accent font-bold uppercase tracking-wider text-sm mb-3">
                    {feature.subtitle}
                  </p>
                  <h3 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-6 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-sustraia-gray leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {feature.metrics.map((metric, i) => (
                    <div
                      key={i}
                      className="bg-sustraia-base p-4 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-sustraia-accent rounded-full"></div>
                        <p className="text-sm font-bold text-sustraia-text">{metric}</p>
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
          className="mt-32 text-center bg-gradient-to-br from-sustraia-accent to-blue-600 rounded-3xl p-12 md:p-16 text-white"
        >
          <h3 className="font-display font-black text-3xl md:text-4xl mb-4">
            ¿Listo para tu calibración?
          </h3>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            El primer mes establecemos tu perfil de rendimiento y construimos tu planificación personalizada.
          </p>
          <Button variant="secondary" size="lg" className="bg-white text-sustraia-accent hover:bg-gray-100">
            Empezar Ahora
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

const Targets = () => (
  <section className="py-24 bg-white border-y border-gray-200">
    <div className="container mx-auto px-6">
       <h2 className="font-display font-black text-4xl mb-16 text-center">ELIGE TU CAMINO</h2>

       <div className="grid md:grid-cols-2 gap-8">
          {/* Card Oposiciones */}
          <div className="relative group overflow-hidden rounded-3xl bg-gray-900 text-white min-h-[400px] flex flex-col justify-end p-10 cursor-pointer">
             <div className="absolute inset-0 z-0">
                <img src="https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2072&auto=format&fit=crop" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" alt="Oposiciones" />
             </div>
             <div className="relative z-10">
                <div className="w-12 h-12 bg-sustraia-accent rounded-lg flex items-center justify-center mb-6">
                   <Shield className="text-white" />
                </div>
                <h3 className="font-display font-bold text-3xl mb-2">Oposiciones</h3>
                <p className="text-gray-300 mb-6 max-w-sm">
                   Ertzaintza, Bomberos, Policía Municipal. Preparamos cada prueba física al milímetro para asegurar tu apto.
                </p>
                <div className="flex items-center gap-2 font-bold text-sustraia-accent uppercase tracking-wider text-sm">
                   Ver Preparación <ArrowUpRight size={16} />
                </div>
             </div>
          </div>

          {/* Card Atleta Híbrido */}
          <div className="relative group overflow-hidden rounded-3xl bg-gray-100 text-sustraia-text min-h-[400px] flex flex-col justify-end p-10 cursor-pointer">
             <div className="absolute inset-0 z-0">
                <img src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-0 group-hover:opacity-10 transition-opacity duration-500" alt="Hybrid" />
             </div>
             <div className="relative z-10">
                <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center mb-6">
                   <User className="text-white" />
                </div>
                <h3 className="font-display font-bold text-3xl mb-2">Atleta Híbrido</h3>
                <p className="text-gray-600 mb-6 max-w-sm">
                   Mejora tu 10k, gana fuerza o transforma tu composición corporal. Entrenamiento personal sin etiquetas.
                </p>
                <div className="flex items-center gap-2 font-bold text-black uppercase tracking-wider text-sm">
                   Ver Planes <ArrowUpRight size={16} />
                </div>
             </div>
          </div>
       </div>
    </div>
  </section>
);

const Coaches = () => (
  <section className="py-24 bg-sustraia-base">
    <div className="container mx-auto px-6">
      <div className="mb-16">
        <span className="text-sustraia-accent font-bold uppercase tracking-wider text-sm mb-2 block">El Equipo</span>
        <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight">EXPERTOS EN CAMPO</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {[
          {
            name: "Jonander",
            role: "Especialista Resistencia & Oposiciones",
            desc: "Atleta nacional. Su metodología ha ayudado a decenas de aspirantes a conseguir su plaza en Ertzaintza y Bomberos optimizando los tiempos de carrera y natación.",
            img: "https://images.unsplash.com/photo-1552674605-469523254055?q=80&w=1374&auto=format&fit=crop"
          },
          {
            name: "Gazpio",
            role: "MSc Sports Science & Fuerza",
            desc: "Especialista en desarrollo de fuerza aplicada. Se encarga de que ganes potencia para el press banca, cuerda y dominadas minimizando el riesgo de lesión.",
            img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1286&auto=format&fit=crop"
          }
        ].map((coach, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100"
          >
            <div className="flex items-center gap-6 mb-6">
               <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-2 border-gray-100">
                  <img src={coach.img} alt={coach.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
               </div>
               <div>
                  <h3 className="font-display font-bold text-2xl mb-1">{coach.name}</h3>
                  <p className="text-sustraia-accent font-medium text-sm">{coach.role}</p>
               </div>
            </div>
            <p className="text-sustraia-gray leading-relaxed text-sm md:text-base">{coach.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Pricing = () => (
  <section className="py-24 bg-white">
    <div className="container mx-auto px-6 max-w-5xl">
      <div className="text-center mb-16">
        <h2 className="font-display font-black text-4xl md:text-5xl mb-4">PLANES SIMPLES</h2>
        <p className="text-sustraia-gray text-lg">Céntrate en entrenar. Nosotros nos encargamos del resto.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* PRO PLAN */}
        <div className="bg-sustraia-base p-10 rounded-3xl border border-transparent transition-all">
          <h3 className="font-display font-bold text-2xl mb-2">PRO</h3>
          <p className="text-sustraia-gray text-sm mb-6">Entrenamiento estructurado y seguimiento continuo.</p>
          <div className="flex items-baseline mb-8">
            <span className="font-display font-bold text-5xl">39€</span>
            <span className="text-sustraia-gray ml-2">/mes</span>
          </div>
          
          <ul className="space-y-4 mb-10">
            {['Planificación app móvil', 'Ajustes semanales', 'Chat directo (L-V)', 'Feedback ejercicios clave'].map((feat) => (
              <li key={feat} className="flex items-start gap-3 text-sm text-sustraia-text font-medium">
                <Check className="w-5 h-5 text-sustraia-accent shrink-0" />
                {feat}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full justify-center bg-white border-gray-200">Empezar Plan</Button>
        </div>

        {/* ELITE PLAN */}
        <div className="bg-sustraia-text text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden transform md:-translate-y-4">
          <div className="absolute top-0 right-0 bg-sustraia-accent text-white text-xs font-bold px-4 py-2 rounded-bl-xl">
            RECOMENDADO OPOSICIÓN
          </div>
          <h3 className="font-display font-bold text-2xl mb-2">ELITE</h3>
          <p className="text-gray-400 text-sm mb-6">Máxima personalización para objetivos exigentes.</p>
          <div className="flex items-baseline mb-8">
            <span className="font-display font-bold text-5xl">79€</span>
            <span className="text-gray-400 ml-2">/mes</span>
          </div>
          
          <ul className="space-y-4 mb-10">
            {['Todo lo incluido en PRO', 'Videollamada mensual', 'Corrección técnica vídeo (ilimitado)', 'Nutrición orientativa', 'Prioridad en respuestas'].map((feat) => (
              <li key={feat} className="flex items-start gap-3 text-sm font-medium">
                <Check className="w-5 h-5 text-sustraia-accent shrink-0" />
                {feat}
              </li>
            ))}
          </ul>
          <Button variant="primary" className="w-full justify-center">Seleccionar Elite</Button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-sustraia-base pt-24 pb-12 border-t border-sustraia-text/5">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-2">
          <h2 className="font-display font-black text-3xl mb-6">SUSTRAIA.</h2>
          <p className="text-sustraia-gray max-w-sm">
            Plataforma de entrenamiento nacida en San Sebastián. Expertos en preparación de Oposiciones y Rendimiento Deportivo.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider">Enlaces</h4>
          <ul className="space-y-4 text-sustraia-gray text-sm">
            <li><a href="#" className="hover:text-sustraia-accent transition-colors">Oposiciones</a></li>
            <li><a href="#" className="hover:text-sustraia-accent transition-colors">Entrenamiento Personal</a></li>
            <li><a href="#" className="hover:text-sustraia-accent transition-colors">Sobre Nosotros</a></li>
            <li><a href="#" className="hover:text-sustraia-accent transition-colors">Contacto</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider">Social</h4>
          <div className="flex gap-4">
             <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-sustraia-accent hover:text-white transition-all shadow-sm">
                <Instagram size={20} />
             </a>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-sustraia-text/5 text-sm text-sustraia-gray">
        <div>© 2024 Sustraia Performance.</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#">Aviso Legal</a>
          <a href="#">Privacidad</a>
        </div>
      </div>
    </div>
  </footer>
);

export default function App() {
  return (
    <div className="bg-sustraia-base min-h-screen">
      <Navbar />
      <Hero />
      <Methodology />
      <HowItWorksSection />
      <Targets />
      <Coaches />
      <Pricing />
      <section className="py-24 bg-sustraia-accent text-white text-center">
         <div className="container mx-auto px-6">
            <h2 className="font-display font-black text-4xl md:text-6xl mb-8 tracking-tighter">
               ¿VAS A POR LA PLAZA?<br/>EMPIEZA AHORA.
            </h2>
            <div className="flex justify-center gap-4">
               <Button variant="secondary" size="lg" className="bg-white text-sustraia-accent hover:bg-gray-100">Hablar con Coach</Button>
            </div>
         </div>
      </section>
      <Footer />
    </div>
  );
}