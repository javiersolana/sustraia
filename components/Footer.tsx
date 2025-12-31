import React from 'react';
import { Instagram, Twitter, Mail } from 'lucide-react';

export const Footer = () => (
  <footer className="bg-black text-white py-12 border-t border-gray-900">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-center">

        <div className="mb-8 md:mb-0 flex flex-col items-center md:items-start">
           <div className="flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8 overflow-hidden rounded-full bg-white/10 p-0.5">
                <img
                  src="/images/logo-rax.jpg"
                  alt="RAX Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-display font-black tracking-tighter">RAX</span>
           </div>
           <p className="text-gray-500 text-sm">© 2024 RAX Performance. Todos los derechos reservados.</p>
        </div>

        <div className="flex space-x-6">
          <a href="#" className="text-gray-400 hover:text-white transition-colors">
            <Instagram size={24} />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">
            <Twitter size={24} />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">
            <Mail size={24} />
          </a>
        </div>
      </div>
    </div>
  </footer>
);
