import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import DiagnosticoWizard, { WizardAnswers } from '../../components/DiagnosticoWizard';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function Onboarding() {
  const navigate = useNavigate();

  const handleSubmit = async ({ answers }: { answers: WizardAnswers }) => {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error('No autenticado');

    const familiaresEnEspana = answers.family_in_spain_or_eu && answers.family_in_spain_or_eu !== 'No' ? 'Sí' : 'No';

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
        otrosIdiomas: 'No',
        cualesIdiomas: '',
        respuestas: answers,
      }),
    });

    navigate('/cliente/inicio');
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-start py-12 px-4">
      <div className="flex items-center gap-2.5 mb-10">
        <img src="/logo-light.png" alt="Quick Emigrate" className="h-9 w-auto" />
        <span className="text-[17px] font-bold tracking-tight text-on-background">Quick Emigrate</span>
      </div>
      <DiagnosticoWizard onSubmit={handleSubmit} />
    </div>
  );
}
