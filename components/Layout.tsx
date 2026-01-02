import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FloatingCTA } from './FloatingCTA';
import { useLocation } from 'react-router-dom';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/como-funciona';

  return (
    <div className="bg-sustraia-base min-h-screen">
      <Navbar />
      <main className="pt-20">
        {children}
      </main>
      <Footer />
      {isLandingPage && <FloatingCTA />}
    </div>
  );
};
