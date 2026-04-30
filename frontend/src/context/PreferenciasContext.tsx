import { createContext, useContext, useState, type ReactNode } from 'react';
import { TEMAS, type TemaId, type PreferenciasIA, type Preferencias, type Tema } from '../hooks/usePreferencias';

const DEFAULT: Preferencias = {
  tema: 'default',
  ia: { tono: 'neutro', detalle: 'estandar', idioma: 'espanol' },
};

const KEY = 'qe_preferencias';

function load(): Preferencias {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

function persist(p: Preferencias) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

interface PreferenciasCtx {
  prefs: Preferencias;
  tema: Tema;
  setTema: (id: TemaId) => void;
  setIA: (ia: Partial<PreferenciasIA>) => void;
}

const Ctx = createContext<PreferenciasCtx | null>(null);

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferencias>(load);

  const save = (next: Preferencias) => {
    setPrefs(next);
    persist(next);
  };

  return (
    <Ctx.Provider value={{
      prefs,
      tema: TEMAS[prefs.tema],
      setTema: (id) => save({ ...prefs, tema: id }),
      setIA: (ia) => save({ ...prefs, ia: { ...prefs.ia, ...ia } }),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePreferenciasCtx() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePreferenciasCtx must be inside PreferenciasProvider');
  return ctx;
}
