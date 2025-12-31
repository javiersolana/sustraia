import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProgramSection } from './components/ProgramSection';
import { Experts } from './components/Experts';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="bg-rax-dark min-h-screen text-white font-sans selection:bg-rax-red selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <ProgramSection />
        <Experts />
      </main>
      <Footer />
    </div>
  );
};

export default App;