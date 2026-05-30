import { usePlanes } from '../hooks/usePlanes';
import { HeroGeometric } from '../components/ui/shape-landing-hero';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TrustBand from '../components/landing/TrustBand';
import IncludesSection from '../components/landing/IncludesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import NotForYouSection from '../components/landing/NotForYouSection';
import PricingSection from '../components/landing/PricingSection';
import FaqSection from '../components/landing/FaqSection';
import '../styles/early-access.css';
import '../styles/landing-sections.css';

export default function HomePage() {
  const { planes } = usePlanes();
  const pro = planes.find(p => p.id === 'pro');
  const precioTexto = pro?.precioTexto ?? '39€/mes';
  const precioViejo = '59€/mes';

  return (
    <div className="ea-root">
      <Navbar />
      <HeroGeometric precioTexto={precioTexto} />
      <TrustBand />
      <IncludesSection precioTexto={precioTexto} />
      <HowItWorksSection precioTexto={precioTexto} />
      <NotForYouSection />
      <PricingSection precioTexto={precioTexto} precioViejo={precioViejo} />
      <FaqSection />
      <Footer />
    </div>
  );
}
