import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import SolutionSection from './components/SolutionSection';
import HowItWorksSection from './components/HowItWorksSection';
import ServicesSection from './components/ServicesSection';
import TrustSection from './components/TrustSection';
import FaqSection from './components/FaqSection';
import ContactSection from './components/ContactSection';
import AboutPage from './pages/AboutPage';
import { BlogListPage, BlogPostPage } from './pages/BlogPage';

const HomePage = () => (
  <div className="bg-surface-container-lowest min-h-screen font-sans selection:bg-primary-container/30">
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
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="font-sans selection:bg-primary-container/30">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
