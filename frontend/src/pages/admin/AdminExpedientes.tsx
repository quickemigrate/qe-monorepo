import { useEffect, useState } from 'react';
import { X, Info, Search, Download, Trash2, Send } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Expediente {
  id: string;
  nombre: string;
  email: string;
  pais: string;
  tipoVisado: string;
  estado: string;
  notas?: string;
  createdAt: string;
}

const ESTADOS_EXP = ['nuevo', 'en proceso', 'documentación pendiente', 'presentado', 'aprobado', 'denegado'];

interface Nota {
  id: string;
  texto: string;
  autorEmail: string;
  createdAt: string;
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString('es-ES');
}

const ESTADO_BADGE: Record<string, string> = {
  'nuevo':                    'bg-emerald-500/15 text-emerald-400',
  'en proceso':               'bg-blue-500/15 text-blue-400',
  'documentación pendiente':  'bg-amber-500/15 text-amber-400',
  'presentado':               'bg-purple-500/15 text-purple-400',
  'aprobado':                 'bg-emerald-500/15 text-emerald-400',
  'denegado':                 'bg-red-500/15 text-red-400',
};

const inputCls = `w-full rounded-xl border border-white/15 px-4 py-3 text-[14.5px] text-white
                  bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 transition placeholder-white/25`;

export default function AdminExpedientes() {
  const { user, getToken } = useAuth();
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Expediente | null>(null);
  const [editEstado, setEditEstado] = useState('');
  const [saving, setSaving] = useState(false);

  const [notas, setNotas] = useState<Nota[]>([]);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [addingNota, setAddingNota] = useState(false);

  const fetchNotas = async (expId: string) => {
    setLoadingNotas(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/expedientes/${expId}/notas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotas(data.notas || []);
      }
    } finally {
      setLoadingNotas(false);
    }
  };

  const handleAddNota = async () => {
    if (!selected || !nuevaNota.trim()) return;
    setAddingNota(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/expedientes/${selected.id}/notas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ texto: nuevaNota.trim() }),
      });
      if (!res.ok) throw new Error('Error al añadir nota');
      setNuevaNota('');
      await fetchNotas(selected.id);
    } catch (err: any) {
      alert(err.message || 'Error al añadir nota');
    } finally {
      setAddingNota(false);
    }
  };

  const handleDeleteNota = async (notaId: string) => {
    if (!selected || !window.confirm('¿Eliminar esta nota?')) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/expedientes/${selected.id}/notas/${notaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al eliminar nota');
      await fetchNotas(selected.id);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar nota');
    }
  };

  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEstado, setBulkEstado] = useState<string>('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = (visibleIds: string[]) => {
    setSelectedIds(prev => {
      const allSelected = visibleIds.every(id => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      visibleIds.forEach(id => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const runBulk = async (action: 'updateEstado' | 'delete', estado?: string) => {
    if (selectedIds.size === 0) return;
    if (action === 'delete' && !window.confirm(`¿Eliminar ${selectedIds.size} expediente(s)? No se puede deshacer.`)) return;
    setBulkProcessing(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/expedientes/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: [...selectedIds], action, estado }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error en operación masiva');
      }
      clearSelection();
      setBulkEstado('');
      await fetchExpedientes();
    } catch (err: any) {
      alert(err.message || 'Error en operación masiva');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const params = new URLSearchParams();
      if (filtroEstado !== 'todos') params.set('estado', filtroEstado);
      const res = await fetch(`${API}/api/expedientes/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expedientes-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error al exportar CSV');
    } finally {
      setExporting(false);
    }
  };

  const fetchExpedientes = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API}/api/expedientes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setExpedientes(data.expedientes || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchExpedientes(); }, []);

  const openPanel = (exp: Expediente) => {
    setSelected(exp);
    setEditEstado(exp.estado);
    setNotas([]);
    setNuevaNota('');
    fetchNotas(exp.id);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const token = await getToken();
    await fetch(`${API}/api/expedientes/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado: editEstado }),
    });
    setSaving(false);
    setSelected(null);
    fetchExpedientes();
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-[-0.025em] text-white mb-6">Expedientes</h1>

        <div className="flex items-start gap-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 mb-6">
          <Info size={15} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[13px] text-blue-400">
            Los expedientes se crean desde la sección <strong className="text-blue-300">Leads</strong> al convertir un contacto.
          </p>
        </div>

        {!loading && expedientes.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1 flex items-center gap-2 qe-card rounded-xl px-3.5 py-2.5">
              <Search size={14} className="text-white/30 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="flex-1 bg-transparent text-[13.5px] text-white placeholder:text-white/30 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-white/30 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="qe-card rounded-xl px-3.5 py-2.5 text-[13.5px] text-white bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
            >
              <option value="todos">Todos los estados</option>
              {ESTADOS_EXP.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 qe-card rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-white/70 hover:text-white hover:bg-white/6 disabled:opacity-40 transition-colors"
            >
              <Download size={14} />
              {exporting ? 'Exportando…' : 'Exportar CSV'}
            </button>
          </div>
        )}

        {(() => {
          const q = search.trim().toLowerCase();
          const expFiltrados = expedientes.filter(x => {
            if (filtroEstado !== 'todos' && x.estado !== filtroEstado) return false;
            if (q && !`${x.nombre} ${x.email}`.toLowerCase().includes(q)) return false;
            return true;
          });
          const visibleIds = expFiltrados.map(x => x.id);
          const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
          return (
        <div className="qe-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="px-6 py-10 text-center text-white/40 text-[14px]">Cargando expedientes...</div>
          ) : expedientes.length === 0 ? (
            <div className="px-6 py-10 text-center text-white/40 text-[14px]">Sin expedientes aún.</div>
          ) : expFiltrados.length === 0 ? (
            <div className="px-6 py-10 text-center text-white/40 text-[14px]">Sin resultados para los filtros aplicados.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[600px] text-[13.5px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pl-5 pr-2 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={() => toggleAllVisible(visibleIds)}
                        className="accent-[#25D366] w-4 h-4 cursor-pointer"
                        aria-label="Seleccionar todos"
                      />
                    </th>
                    {['Nombre', 'Email', 'País', 'Tipo visado', 'Estado', 'Fecha'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expFiltrados.map((exp, i) => (
                    <tr
                      key={exp.id}
                      onClick={() => openPanel(exp)}
                      className={`border-b border-white/8 cursor-pointer hover:bg-white/5 transition-colors
                        ${i % 2 === 0 ? '' : 'bg-white/[0.02]'} ${selectedIds.has(exp.id) ? 'bg-[#25D366]/8' : ''}`}
                    >
                      <td className="pl-5 pr-2 py-3.5 w-8" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(exp.id)}
                          onChange={() => toggleSelect(exp.id)}
                          className="accent-[#25D366] w-4 h-4 cursor-pointer"
                          aria-label={`Seleccionar ${exp.nombre}`}
                        />
                      </td>
                      <td className="px-5 py-3.5 font-medium text-white">{exp.nombre}</td>
                      <td className="px-5 py-3.5 text-white/60">{exp.email}</td>
                      <td className="px-5 py-3.5 text-white/60">{exp.pais || '—'}</td>
                      <td className="px-5 py-3.5 text-white/60">{exp.tipoVisado || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${ESTADO_BADGE[exp.estado] || 'bg-white/8 text-white/30'}`}>
                          {exp.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/40">
                        {new Date(exp.createdAt).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
          );
        })()}
      </div>

      {/* Side panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full sm:w-[420px] qe-card-strong border-l border-white/10 h-full shadow-2xl flex flex-col overflow-y-auto" style={{ borderRadius: 0 }}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h2 className="text-[17px] font-semibold text-white">Editar expediente</h2>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5">
              {[
                { label: 'Nombre', value: selected.nombre },
                { label: 'Email', value: selected.email },
                { label: 'País', value: selected.pais || '—' },
                { label: 'Tipo de visado', value: selected.tipoVisado || '—' },
                { label: 'Fecha', value: new Date(selected.createdAt).toLocaleString('es-ES') },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-1">{label}</div>
                  <div className="text-[14.5px] text-white font-medium">{value}</div>
                </div>
              ))}

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-2 block">Estado</label>
                <select
                  value={editEstado}
                  onChange={e => setEditEstado(e.target.value)}
                  className={inputCls}
                >
                  {ESTADOS_EXP.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-2 block">
                  Timeline de notas
                </label>

                <div className="space-y-2 mb-3">
                  <textarea
                    value={nuevaNota}
                    onChange={e => setNuevaNota(e.target.value.slice(0, 5000))}
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Añadir nueva nota..."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/30">{nuevaNota.length}/5000</span>
                    <button
                      onClick={handleAddNota}
                      disabled={!nuevaNota.trim() || addingNota}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] text-[#062810] font-semibold px-4 py-2 text-[13px] hover:bg-[#2adc6c] disabled:opacity-40 transition-colors"
                    >
                      <Send size={13} />
                      {addingNota ? 'Añadiendo…' : 'Añadir nota'}
                    </button>
                  </div>
                </div>

                {selected.notas && (
                  <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-3 mb-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-400/80 mb-1">
                      Nota legacy (campo único)
                    </div>
                    <div className="text-[13px] text-white/70 whitespace-pre-wrap">{selected.notas}</div>
                  </div>
                )}

                {loadingNotas ? (
                  <div className="text-[12px] text-white/40 text-center py-4">Cargando notas…</div>
                ) : notas.length === 0 && !selected.notas ? (
                  <div className="text-[12px] text-white/30 text-center py-4">Sin notas todavía.</div>
                ) : (
                  <ul className="space-y-3">
                    {notas.map(n => {
                      const initial = (n.autorEmail?.[0] || '?').toUpperCase();
                      const isOwn = n.autorEmail === user?.email;
                      return (
                        <li key={n.id} className="flex items-start gap-3 rounded-xl bg-[#0A0A0A] border border-white/8 p-3">
                          <div className={`shrink-0 w-8 h-8 rounded-full grid place-items-center text-[13px] font-bold
                            ${isOwn ? 'bg-[#25D366] text-[#062810]' : 'bg-white/10 text-white/70'}`}>
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="text-[12px] font-semibold text-white truncate">{n.autorEmail}</div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-white/30">{formatRelative(n.createdAt)}</span>
                                {isOwn && (
                                  <button
                                    onClick={() => handleDeleteNota(n.id)}
                                    className="text-white/30 hover:text-red-400 transition-colors"
                                    aria-label="Eliminar nota"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[13px] text-white/70 leading-[1.5] whitespace-pre-wrap break-words">
                              {n.texto}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
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

      {selectedIds.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-24px)]">
          <div className="qe-card-strong rounded-2xl border border-white/15 shadow-2xl px-4 py-3 flex flex-wrap items-center gap-3">
            <span className="text-[13px] font-semibold text-white whitespace-nowrap">
              {selectedIds.size} seleccionado{selectedIds.size === 1 ? '' : 's'}
            </span>
            <div className="h-5 w-px bg-white/15" />
            <select
              value={bulkEstado}
              onChange={e => setBulkEstado(e.target.value)}
              disabled={bulkProcessing}
              className="rounded-lg bg-[#0A0A0A] border border-white/15 px-3 py-2 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
            >
              <option value="">Cambiar estado…</option>
              {ESTADOS_EXP.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <button
              disabled={!bulkEstado || bulkProcessing}
              onClick={() => runBulk('updateEstado', bulkEstado)}
              className="rounded-lg bg-[#25D366] text-[#062810] font-bold px-4 py-2 text-[13px] hover:bg-[#2adc6c] disabled:opacity-40 transition-colors"
            >
              Aplicar
            </button>
            <button
              disabled={bulkProcessing}
              onClick={() => runBulk('delete')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 text-red-400 font-semibold px-3 py-2 text-[13px] hover:bg-red-500/25 disabled:opacity-40 transition-colors"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
            <button
              disabled={bulkProcessing}
              onClick={clearSelection}
              className="text-white/50 hover:text-white text-[13px] px-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
