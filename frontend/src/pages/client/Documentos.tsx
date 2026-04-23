import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import ClientLayout from '../../components/client/ClientLayout';
import { useClientePlan } from '../../hooks/useClientePlan';

export default function Documentos() {
  const { plan, loading } = useClientePlan();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && plan === 'starter') {
      navigate('/cliente/plan', { replace: true });
    }
  }, [plan, loading]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="p-8 text-[14px] text-on-background/40">Cargando...</div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="p-8 max-w-[600px]">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-on-background mb-8">
          Mis Documentos
        </h1>

        <div className="bg-white rounded-2xl border border-black/5 p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-5">
            <FolderOpen size={28} className="text-on-background/25" />
          </div>
          <h2 className="text-[18px] font-semibold text-on-background mb-2">
            Próximamente
          </h2>
          <p className="text-[14px] text-on-background/50 max-w-[320px]">
            Aquí podrás subir y gestionar todos los documentos de tu proceso migratorio de forma segura.
          </p>
        </div>
      </div>
    </ClientLayout>
  );
}
