import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import { BlogListPage } from './pages/BlogPage';
import ArticlePage from './pages/ArticlePage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLeads from './pages/admin/AdminLeads';
import AdminExpedientes from './pages/admin/AdminExpedientes';
import ProtectedRoute from './components/ProtectedRoute';
import AdminBlog from './pages/admin/AdminBlog';
import Conocimiento from './pages/admin/Conocimiento';
import Usuarios from './pages/admin/Usuarios';
import Config from './pages/admin/Config';
import Chat from './pages/client/Chat';
import ClientLogin from './pages/client/ClientLogin';
import ClientDashboard from './pages/client/ClientDashboard';
import Perfil from './pages/client/Perfil';
import Plan from './pages/client/Plan';
import Documentos from './pages/client/Documentos';
import Expediente from './pages/client/Expediente';
import ClientProtectedRoute from './components/ClientProtectedRoute';
import DiagnosticoPage from './pages/DiagnosticoPage';
import DiagnosticoExitoPage from './pages/DiagnosticoExitoPage';

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

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isClient = location.pathname.startsWith('/cliente');

  return (
    <div className="font-sans selection:bg-primary-container/30">
      {!isAdmin && !isClient && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/nosotros" element={<AboutPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<ArticlePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/leads" element={<ProtectedRoute><AdminLeads /></ProtectedRoute>} />
        <Route path="/admin/expedientes" element={<ProtectedRoute><AdminExpedientes /></ProtectedRoute>} />
        <Route path="/admin/blog" element={<ProtectedRoute><AdminBlog /></ProtectedRoute>} />
        <Route path="/admin/conocimiento" element={<ProtectedRoute><Conocimiento /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
        <Route path="/admin/config" element={<ProtectedRoute><Config /></ProtectedRoute>} />
        <Route path="/diagnostico" element={<DiagnosticoPage />} />
        <Route path="/diagnostico/exito" element={<DiagnosticoExitoPage />} />
        <Route path="/cliente/login" element={<ClientLogin />} />
        <Route path="/cliente" element={<ClientProtectedRoute><ClientDashboard /></ClientProtectedRoute>} />
        <Route path="/cliente/perfil" element={<ClientProtectedRoute><Perfil /></ClientProtectedRoute>} />
        <Route path="/cliente/plan" element={<ClientProtectedRoute><Plan /></ClientProtectedRoute>} />
        <Route path="/cliente/documentos" element={<ClientProtectedRoute><Documentos /></ClientProtectedRoute>} />
        <Route path="/cliente/expediente" element={<ClientProtectedRoute><Expediente /></ClientProtectedRoute>} />
        <Route path="/cliente/chat" element={<ClientProtectedRoute><Chat /></ClientProtectedRoute>} />
      </Routes>
      {!isAdmin && !isClient && <Footer />}
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
