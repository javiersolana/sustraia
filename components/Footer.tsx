import React from 'react';
import { Instagram } from 'lucide-react';

export const Footer = () => (
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
