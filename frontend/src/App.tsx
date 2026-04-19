/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import SolutionSection from './components/SolutionSection';
import HowItWorksSection from './components/HowItWorksSection';
import ServicesSection from './components/ServicesSection';
import TrustSection from './components/TrustSection';
import FaqSection from './components/FaqSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="bg-surface-container-lowest min-h-screen font-sans selection:bg-primary-container/30">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <ServicesSection />
        <TrustSection />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
