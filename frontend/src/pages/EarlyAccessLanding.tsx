import { usePlanes } from '../hooks/usePlanes';
import { HeroGeometric } from '../components/ui/shape-landing-hero';
import DiagnosticPreviewSection from '../components/DiagnosticPreviewSection';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import IncludesSection from '../components/landing/IncludesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import PricingSection from '../components/landing/PricingSection';
import '../styles/early-access.css';
import '../styles/landing-sections.css';

export default function EarlyAccessLanding() {
  const { planes } = usePlanes();
  const starter = planes.find(p => p.id === 'starter');
  const precioTexto = starter?.precioTexto ?? '19€';
  const precioViejo = '59€';

  return (
    <div className="ea-root">
      <Navbar />
      <HeroGeometric />
      <DiagnosticPreviewSection />
      <IncludesSection precioTexto={precioTexto} />
      <HowItWorksSection precioTexto={precioTexto} />
      <PricingSection precioTexto={precioTexto} precioViejo={precioViejo} />
      <Footer />
    </div>
  );
}
