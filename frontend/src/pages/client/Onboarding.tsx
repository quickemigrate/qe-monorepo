import { useNavigate } from 'react-router-dom';
import PerfilWizard from '../../components/PerfilWizard';

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-start py-12 px-4">
      <div className="flex items-center gap-2.5 mb-10">
        <img src="/logo-light.png" alt="Quick Emigrate" className="h-9 w-auto" />
        <span className="text-[17px] font-bold tracking-tight text-on-background">Quick Emigrate</span>
      </div>
      <PerfilWizard
        showProgress={true}
        onComplete={() => navigate('/cliente/inicio')}
      />
    </div>
  );
}
