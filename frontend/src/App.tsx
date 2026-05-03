import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EarlyAccessLanding from './pages/EarlyAccessLanding';
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
import Inicio from './pages/client/Inicio';
import Perfil from './pages/client/Perfil';
import Plan from './pages/client/Plan';
import SuscripcionPro from './pages/client/SuscripcionPro';
import Documentos from './pages/client/Documentos';
import Expediente from './pages/client/Expediente';
import ClientProtectedRoute from './components/ClientProtectedRoute';
import OnboardingGuard from './components/OnboardingGuard';
import Onboarding from './pages/client/Onboarding';
import DiagnosticoPage from './pages/DiagnosticoPage';
import DiagnosticoExitoPage from './pages/DiagnosticoExitoPage';
import { PreferenciasProvider } from './context/PreferenciasContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isClient = location.pathname.startsWith('/cliente');
  const isHome = location.pathname === '/';
  const isLandingRoute = isAdmin || isClient || isHome;

  return (
    <div className="font-sans selection:bg-primary-container/30">
      <ScrollToTop />
      {!isLandingRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<EarlyAccessLanding />} />
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
        <Route path="/cliente/onboarding" element={<ClientProtectedRoute><Onboarding /></ClientProtectedRoute>} />
        <Route path="/cliente" element={<PreferenciasProvider><ClientProtectedRoute><OnboardingGuard><Inicio /></OnboardingGuard></ClientProtectedRoute></PreferenciasProvider>} />
        <Route path="/cliente/inicio" element={<PreferenciasProvider><ClientProtectedRoute><OnboardingGuard><Inicio /></OnboardingGuard></ClientProtectedRoute></PreferenciasProvider>} />
        <Route path="/cliente/perfil" element={<PreferenciasProvider><ClientProtectedRoute><OnboardingGuard><Perfil /></OnboardingGuard></ClientProtectedRoute></PreferenciasProvider>} />
        <Route path="/cliente/plan" element={<PreferenciasProvider><ClientProtectedRoute><OnboardingGuard><Plan /></OnboardingGuard></ClientProtectedRoute></PreferenciasProvider>} />
        <Route path="/cliente/suscripcion-pro" element={<PreferenciasProvider><ClientProtectedRoute><OnboardingGuard><SuscripcionPro /></OnboardingGuard></ClientProtectedRoute></PreferenciasProvider>} />
        <Route path="/cliente/documentos" element={<PreferenciasProvider><ClientProtectedRoute><OnboardingGuard><Documentos /></OnboardingGuard></ClientProtectedRoute></PreferenciasProvider>} />
        <Route path="/cliente/expediente" element={<PreferenciasProvider><ClientProtectedRoute><OnboardingGuard><Expediente /></OnboardingGuard></ClientProtectedRoute></PreferenciasProvider>} />
        <Route path="/cliente/chat" element={<PreferenciasProvider><ClientProtectedRoute><OnboardingGuard><Chat /></OnboardingGuard></ClientProtectedRoute></PreferenciasProvider>} />
      </Routes>
      {!isLandingRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
