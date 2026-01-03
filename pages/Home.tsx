import React from 'react';
import { Hero } from '../src/components/landing/Hero';
import { ProgramasChoice } from '../src/components/landing/ProgramasChoice';
import { Experts } from '../src/components/landing/Experts';

export default function Home() {
  return (
    <>
      <Hero />
      <ProgramasChoice />
      <Experts />
    </>
  );
}
