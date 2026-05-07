import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import QuickEmigrateWizardFormV2, { SubmitPayload } from '../../components/QuickEmigrateWizardFormV2';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function Onboarding() {
  const navigate = useNavigate();

  const handleSubmit = async ({ answers, meta }: SubmitPayload) => {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error('No autenticado');

    const familiaresEnEspana = answers.family_in_spain_or_eu && answers.family_in_spain_or_eu !== 'no' ? 'Sí' : 'No';

    const idiomasRaw = (answers as any).languages || (answers as any).other_languages || (answers as any).idiomas || '';
    const otrosIdiomas = idiomasRaw && String(idiomasRaw).trim() && String(idiomasRaw).toLowerCase() !== 'no' ? 'Sí' : '';
    const cualesIdiomas = otrosIdiomas === 'Sí' ? String(idiomasRaw) : '';

    await fetch(`${API}/api/usuarios/perfil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nombre: answers.name || '',
        pais: answers.nationality || answers.country_of_residence || '',
        edad: String(answers.age || ''),
        sector: answers.current_profession || answers.study_area || '',
        estudios: answers.education_level || '',
        experiencia: answers.years_experience || '',
        situacion: answers.employment_status || '',
        medios: answers.savings_eur_range || '',
        objetivo: answers.migration_goal || '',
        plazo: answers.urgency || '',
        familiaresEnEspana,
        otrosIdiomas,
        cualesIdiomas,
        respuestas: answers,
        diagnosticoMeta: meta,
      }),
    });

    navigate('/cliente/inicio');
  };

  const handleSkip = async () => {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error('No autenticado');
    await fetch(`${API}/api/usuarios/saltar-onboarding`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    navigate('/cliente/inicio');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-start py-12 px-4">
      <div className="flex items-center gap-2.5 mb-10">
        <img src="/logo-dark.png" alt="Quick Emigrate" className="h-9 w-auto" />
        <span className="text-[17px] font-bold tracking-tight text-white">Quick Emigrate</span>
      </div>
      <QuickEmigrateWizardFormV2 onSubmit={handleSubmit} onSkip={handleSkip} />
    </div>
  );
}
