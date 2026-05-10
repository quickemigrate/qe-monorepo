import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EarlyAccessLanding from './pages/EarlyAccessLanding';
import ProtectedRoute from './components/ProtectedRoute';
import ClientProtectedRoute from './components/ClientProtectedRoute';
import OnboardingGuard from './components/OnboardingGuard';
import CookieBanner from './components/CookieBanner';
import { PreferenciasProvider } from './context/PreferenciasContext';

const AboutPage = lazy(() => import('./pages/AboutPage'));
const BlogListPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogListPage })));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const DiagnosticoPage = lazy(() => import('./pages/DiagnosticoPage'));
const DiagnosticoExitoPage = lazy(() => import('./pages/DiagnosticoExitoPage'));

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'));
const AdminExpedientes = lazy(() => import('./pages/admin/AdminExpedientes'));
const AdminBlog = lazy(() => import('./pages/admin/AdminBlog'));
const Conocimiento = lazy(() => import('./pages/admin/Conocimiento'));
const Usuarios = lazy(() => import('./pages/admin/Usuarios'));
const Notificaciones = lazy(() => import('./pages/admin/Notificaciones'));
const Config = lazy(() => import('./pages/admin/Config'));

const ClientLogin = lazy(() => import('./pages/client/ClientLogin'));
const AuthAction = lazy(() => import('./pages/client/AuthAction'));
const Onboarding = lazy(() => import('./pages/client/Onboarding'));
const Inicio = lazy(() => import('./pages/client/Inicio'));
const Perfil = lazy(() => import('./pages/client/Perfil'));
const Plan = lazy(() => import('./pages/client/Plan'));
const SuscripcionPro = lazy(() => import('./pages/client/SuscripcionPro'));
const Documentos = lazy(() => import('./pages/client/Documentos'));
const Expediente = lazy(() => import('./pages/client/Expediente'));
const Chat = lazy(() => import('./pages/client/Chat'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function RouteFallback() {
  return (
    <div className="min-h-[60vh] grid place-items-center bg-[#0A0A0A]">
      <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-[#25D366] animate-spin" />
    </div>
  );
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
      <Suspense fallback={<RouteFallback />}>
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
          <Route path="/admin/notificaciones" element={<ProtectedRoute><Notificaciones /></ProtectedRoute>} />
          <Route path="/admin/config" element={<ProtectedRoute><Config /></ProtectedRoute>} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="/diagnostico" element={<DiagnosticoPage />} />
          <Route path="/diagnostico/exito" element={<DiagnosticoExitoPage />} />
          <Route path="/cliente/login" element={<ClientLogin />} />
          <Route path="/cliente/auth-action" element={<AuthAction />} />
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
      </Suspense>
      {!isLandingRoute && <Footer />}
      <CookieBanner />
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
