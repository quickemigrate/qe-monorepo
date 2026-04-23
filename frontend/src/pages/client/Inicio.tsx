import { Link } from 'react-router-dom';
import { MessageCircle, FolderOpen, FileText, User, ArrowRight } from 'lucide-react';
import ClientLayout from '../../components/client/ClientLayout';
import { useAuth } from '../../context/AuthContext';
import { useClientePlan } from '../../hooks/useClientePlan';

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-600',
  pro:     'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
};

const PLAN_LABEL: Record<string, string> = {
  starter: 'Plan Starter',
  pro:     'Plan Pro',
  premium: 'Plan Premium',
};

interface CardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  to: string;
  accent?: boolean;
}

function QuickCard({ icon: Icon, title, description, to, accent }: CardProps) {
  return (
    <Link
      to={to}
      className={`group flex flex-col gap-3 p-5 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5
        ${accent
          ? 'bg-on-background border-white/8 text-white'
          : 'bg-white border-black/5 text-on-background'
        }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
        ${accent ? 'bg-white/10' : 'bg-surface-container-low'}`}>
        <Icon size={19} className={accent ? 'text-[#25D366]' : 'text-on-background/50'} />
      </div>
      <div>
        <div className={`text-[14.5px] font-semibold mb-0.5 ${accent ? 'text-white' : 'text-on-background'}`}>
          {title}
        </div>
        <div className={`text-[13px] leading-[1.5] ${accent ? 'text-white/50' : 'text-on-background/50'}`}>
          {description}
        </div>
      </div>
      <div className={`flex items-center gap-1 text-[12px] font-semibold mt-auto
        ${accent ? 'text-[#25D366]' : 'text-on-background/40 group-hover:text-on-background transition-colors'}`}>
        Ir ahora <ArrowRight size={13} />
      </div>
    </Link>
  );
}

export default function Inicio() {
  const { user } = useAuth();
  const { plan, mensajesUsados, mensajesLimit, loading } = useClientePlan();

  const nombre = user?.displayName || user?.email?.split('@')[0] || 'Cliente';
  const isPro = plan === 'pro' || plan === 'premium';
  const isPremium = plan === 'premium';

  return (
    <ClientLayout>
      <div className="p-8 max-w-[700px]">
        {/* Saludo */}
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-on-background">
            Bienvenido, {nombre}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-[14px] text-on-background/50">Tu área privada de Quick Emigrate</p>
            {!loading && plan && (
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${PLAN_BADGE[plan]}`}>
                {PLAN_LABEL[plan]}
              </span>
            )}
          </div>
        </div>

        {/* Barra mensajes (solo pro/premium) */}
        {!loading && isPro && mensajesLimit > 0 && (
          <div className="bg-white rounded-2xl border border-black/5 p-5 mb-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-[13px] text-on-background/50 mb-1.5">Mensajes del Asistente IA este mes</div>
              <div className="h-1.5 rounded-full bg-black/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-container transition-all"
                  style={{ width: `${Math.min((mensajesUsados / mensajesLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[15px] font-semibold text-on-background">{mensajesUsados}</span>
              <span className="text-[13px] text-on-background/40"> / {mensajesLimit}</span>
            </div>
          </div>
        )}

        {/* Accesos rápidos */}
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-on-background/40 mb-3">
          Acceso rápido
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickCard
            icon={User}
            title="Mi Perfil"
            description="Gestiona tu cuenta y contraseña"
            to="/cliente/perfil"
          />

          {isPro && (
            <QuickCard
              icon={MessageCircle}
              title="Asistente IA"
              description="Resuelve tus dudas sobre el proceso"
              to="/cliente/chat"
              accent
            />
          )}

          {isPro && (
            <QuickCard
              icon={FolderOpen}
              title="Mis Documentos"
              description="Sube y gestiona tu documentación"
              to="/cliente/documentos"
            />
          )}

          {isPremium && (
            <QuickCard
              icon={FileText}
              title="Mi Expediente"
              description="Sigue el estado de tu proceso migratorio"
              to="/cliente/expediente"
            />
          )}

          {!loading && !isPro && (
            <Link
              to="/cliente/plan"
              className="flex flex-col gap-3 p-5 rounded-2xl border border-dashed border-black/10
                         bg-surface-container-low text-on-background/40 hover:border-black/20 transition-all"
            >
              <div className="text-[14px] font-semibold">Desbloquea más funciones</div>
              <div className="text-[13px] leading-[1.5]">
                Con el plan Pro obtienes el Asistente IA y gestión de documentos.
              </div>
              <div className="text-[12px] font-semibold text-primary-container flex items-center gap-1 mt-auto">
                Ver planes <ArrowRight size={13} />
              </div>
            </Link>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
