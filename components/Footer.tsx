import React from 'react';
import { Instagram, Twitter, Mail } from 'lucide-react';

export const Footer = () => (
  <footer className="bg-rax-cream text-rax-darkText py-12 border-t border-gray-300">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-center">

        <div className="mb-8 md:mb-0 flex flex-col items-center md:items-start">
           <div className="flex items-center gap-3 mb-4">
              <img
                src="/images/logo.png"
                alt="SUSTRAIN Logo"
                className="h-16 md:h-20 w-auto"
              />
           </div>
           <p className="text-gray-600 text-sm">© 2025 SUSTRAIN. Todos los derechos reservados.</p>
        </div>

        <div className="flex space-x-6">
          <a href="#" className="text-gray-600 hover:text-rax-darkText transition-colors">
            <Instagram size={24} />
          </a>
          <a href="#" className="text-gray-600 hover:text-rax-darkText transition-colors">
            <Twitter size={24} />
          </a>
          <a href="#" className="text-gray-600 hover:text-rax-darkText transition-colors">
            <Mail size={24} />
          </a>
        </div>
      </div>
    </div>
  </footer>
);
