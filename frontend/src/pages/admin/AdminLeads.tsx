import { useEffect, useState } from 'react';
import { X, ArrowRightCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Lead {
  id: string;
  nombre: string;
  email: string;
  pais: string;
  interes: string;
  mensaje: string;
  estado: string;
  notas?: string;
  createdAt: string;
}

const ESTADOS = ['nuevo', 'contactado', 'convertido', 'descartado'];

const ESTADO_BADGE: Record<string, string> = {
  nuevo:      'bg-emerald-500/15 text-emerald-400',
  contactado: 'bg-amber-500/15 text-amber-400',
  convertido: 'bg-blue-500/15 text-blue-400',
  descartado: 'bg-white/8 text-white/30',
};

const TIPOS_VISADO = [
  'Diagnóstico de viabilidad',
  'Visado de estudios',
  'Visado no lucrativo',
  'TIE/NIE',
  'Prórroga de estudios',
];

const ESTADOS_EXP_INICIAL = ['nuevo', 'en proceso'];

interface ConvertForm {
  nombre: string;
  email: string;
  pais: string;
  tipoVisado: string;
  estado: string;
  notas: string;
}

const inputCls = `w-full rounded-xl border border-white/15 px-4 py-3 text-[14.5px] text-white
                  bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 transition placeholder-white/25`;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1.5';

export default function AdminLeads() {
  const { getToken } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Lead | null>(null);
  const [editEstado, setEditEstado] = useState('');
  const [editNotas, setEditNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertForm | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<'success' | 'error' | null>(null);

  const fetchLeads = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API}/api/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const openPanel = (lead: Lead) => {
    setSelected(lead);
    setEditEstado(lead.estado);
    setEditNotas(lead.notas || '');
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const token = await getToken();
    await fetch(`${API}/api/leads/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado: editEstado, notas: editNotas }),
    });
    setSaving(false);
    setSelected(null);
    fetchLeads();
  };

  const openConvertModal = (lead: Lead) => {
    setConvertLead(lead);
    setConvertForm({
      nombre: lead.nombre,
      email: lead.email,
      pais: lead.pais || '',
      tipoVisado: TIPOS_VISADO[0],
      estado: 'nuevo',
      notas: '',
    });
    setConvertResult(null);
  };

  const handleConvert = async () => {
    if (!convertLead || !convertForm) return;
    setConverting(true);
    setConvertResult(null);
    try {
      const token = await getToken();
      const expRes = await fetch(`${API}/api/expedientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(convertForm),
      });
      if (!expRes.ok) throw new Error('Error creando expediente');
      await fetch(`${API}/api/leads/${convertLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: 'convertido' }),
      });
      setConvertResult('success');
      fetchLeads();
      setTimeout(() => { setConvertLead(null); setConvertForm(null); setConvertResult(null); }, 1500);
    } catch {
      setConvertResult('error');
    } finally {
      setConverting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-[-0.025em] text-white mb-8">Leads</h1>

        <div className="qe-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="px-6 py-10 text-center text-white/40 text-[14px]">Cargando leads...</div>
          ) : leads.length === 0 ? (
            <div className="px-6 py-10 text-center text-white/40 text-[14px]">Sin leads aún.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[600px] text-[13.5px]">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Nombre', 'Email', 'País', 'Interés', 'Mensaje', 'Estado', 'Fecha', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr
                      key={lead.id}
                      onClick={() => openPanel(lead)}
                      className={`border-b border-white/8 cursor-pointer hover:bg-white/5 transition-colors
                        ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                    >
                      <td className="px-5 py-3.5 font-medium text-white">{lead.nombre}</td>
                      <td className="px-5 py-3.5 text-white/60">{lead.email}</td>
                      <td className="px-5 py-3.5 text-white/60">{lead.pais || '—'}</td>
                      <td className="px-5 py-3.5 text-white/60">{lead.interes || '—'}</td>
                      <td className="px-5 py-3.5 text-white/40 max-w-[180px] truncate">{lead.mensaje}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${ESTADO_BADGE[lead.estado] || 'bg-white/8 text-white/30'}`}>
                          {lead.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/40">
                        {new Date(lead.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        {lead.estado !== 'convertido' && lead.estado !== 'descartado' && (
                          <button
                            onClick={() => openConvertModal(lead)}
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#25D366]
                                       bg-[#25D366]/10 hover:bg-[#25D366]/20 px-3 py-1.5 rounded-lg
                                       transition-colors whitespace-nowrap"
                          >
                            <ArrowRightCircle size={13} />
                            Convertir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Side panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full sm:w-[420px] qe-card-strong border-l border-white/10 h-full shadow-2xl flex flex-col overflow-y-auto" style={{ borderRadius: 0 }}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h2 className="text-[17px] font-semibold text-white">Detalle del lead</h2>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5">
              {[
                { label: 'Nombre', value: selected.nombre },
                { label: 'Email', value: selected.email },
                { label: 'País', value: selected.pais || '—' },
                { label: 'Interés', value: selected.interes || '—' },
                { label: 'Fecha', value: new Date(selected.createdAt).toLocaleString('es-ES') },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1">{label}</div>
                  <div className="text-[14.5px] text-white font-medium">{value}</div>
                </div>
              ))}

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1">Mensaje</div>
                <div className="text-[14px] text-white/70 leading-[1.6] bg-white/5 rounded-xl p-4">
                  {selected.mensaje}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-2 block">Estado</label>
                <select
                  value={editEstado}
                  onChange={e => setEditEstado(e.target.value)}
                  className={inputCls}
                >
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-2 block">Notas internas</label>
                <textarea
                  value={editNotas}
                  onChange={e => setEditNotas(e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder="Notas sobre este lead..."
                />
              </div>
            </div>

            <div className="px-6 py-5 border-t border-white/10">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-[#25D366] text-[#062810] font-semibold py-3.5 text-[15px]
                           hover:bg-[#2adc6c] active:scale-[0.98] transition disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert modal */}
      {convertLead && convertForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!converting) { setConvertLead(null); setConvertForm(null); } }} />
          <div className="relative qe-card-strong rounded-[24px] shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-7 py-5 border-b border-white/10">
              <h2 className="text-[18px] font-semibold text-white">Convertir a expediente</h2>
              <button
                onClick={() => { if (!converting) { setConvertLead(null); setConvertForm(null); } }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-4">
              {convertResult === 'success' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-[13.5px] text-emerald-400 font-medium">
                  <CheckCircle2 size={16} />
                  Expediente creado correctamente.
                </div>
              )}
              {convertResult === 'error' && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13.5px] text-red-400 font-medium">
                  <AlertCircle size={16} />
                  Error al crear el expediente. Inténtalo de nuevo.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nombre *</label>
                  <input
                    value={convertForm.nombre}
                    onChange={e => setConvertForm(f => f ? { ...f, nombre: e.target.value } : f)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    value={convertForm.email}
                    readOnly
                    className={`${inputCls} opacity-50 cursor-not-allowed`}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>País</label>
                <input
                  value={convertForm.pais}
                  onChange={e => setConvertForm(f => f ? { ...f, pais: e.target.value } : f)}
                  className={inputCls}
                  placeholder="Argentina, Colombia..."
                />
              </div>

              <div>
                <label className={labelCls}>Tipo de visado</label>
                <select
                  value={convertForm.tipoVisado}
                  onChange={e => setConvertForm(f => f ? { ...f, tipoVisado: e.target.value } : f)}
                  className={inputCls}
                >
                  {TIPOS_VISADO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Estado inicial</label>
                <select
                  value={convertForm.estado}
                  onChange={e => setConvertForm(f => f ? { ...f, estado: e.target.value } : f)}
                  className={inputCls}
                >
                  {ESTADOS_EXP_INICIAL.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Notas</label>
                <textarea
                  rows={3}
                  value={convertForm.notas}
                  onChange={e => setConvertForm(f => f ? { ...f, notas: e.target.value } : f)}
                  className={`${inputCls} resize-none`}
                  placeholder="Observaciones iniciales..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setConvertLead(null); setConvertForm(null); }}
                  disabled={converting}
                  className="flex-1 rounded-xl border border-white/15 font-semibold py-3 text-[14.5px] text-white/60 hover:bg-white/5 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={converting || convertResult === 'success'}
                  className="flex-1 rounded-xl bg-[#25D366] text-[#062810] font-semibold py-3 text-[14.5px] hover:bg-[#2adc6c] transition disabled:opacity-50"
                >
                  {converting ? 'Creando...' : 'Crear expediente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
