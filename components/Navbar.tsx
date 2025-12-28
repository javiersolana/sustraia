import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';

export const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 bg-sustraia-base/90 backdrop-blur-md border-b border-sustraia-text/5">
    <div className="container mx-auto px-6 h-20 flex items-center justify-between">
      <Link to="/" className="font-display font-black text-2xl tracking-tight text-sustraia-text">
        SUSTRAIA
      </Link>
      <div className="hidden md:flex gap-8">
        <Link to="/como-funciona" className="text-sm font-medium text-sustraia-gray hover:text-sustraia-accent transition-colors">
          Cómo funciona
        </Link>
        {['Oposiciones', 'Metodología', 'Coaches', 'Planes'].map((link) => (
          <a key={link} href="#" className="text-sm font-medium text-sustraia-gray hover:text-sustraia-accent transition-colors">
            {link}
          </a>
        ))}
      </div>
      <Link to="/login">
        <Button variant="secondary" size="sm" className="hidden sm:flex bg-black text-white hover:bg-sustraia-accent border-0">
          Área Atletas
        </Button>
      </Link>
    </div>
  </nav>
);
