import React from 'react';
import { Hero } from '../src/components/landing/Hero';
import { ProgramSection } from '../src/components/landing/ProgramSection';
import { Experts } from '../src/components/landing/Experts';

export default function Home() {
  return (
    <>
      <Hero />
      <ProgramSection />
      <Experts />
    </>
  );
}
