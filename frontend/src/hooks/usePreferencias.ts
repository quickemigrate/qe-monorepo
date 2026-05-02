export type TemaId = 'default' | 'oceano' | 'bosque' | 'aurora' | 'atardecer' | 'minimal';
export type Tono = 'formal' | 'neutro' | 'cercano';
export type Detalle = 'breve' | 'estandar' | 'detallado';
export type IdiomaIA = 'espanol' | 'ingles' | 'portugues';

export interface PreferenciasIA {
  tono: Tono;
  detalle: Detalle;
  idioma: IdiomaIA;
}

export interface Preferencias {
  tema: TemaId;
  ia: PreferenciasIA;
}

export interface Tema {
  id: TemaId;
  name: string;
  isDark: boolean;
  sidebar: string;
  sidebarBorder: string;
  accent: string;
  activeItemBg: string;
  main: string;
  preview: string;
  logo: string;
}

export const TEMAS: Record<TemaId, Tema> = {
  default: {
    id: 'default', name: 'Clásico', isDark: true,
    sidebar: '#0a0a0a', sidebarBorder: 'rgba(255,255,255,0.08)',
    accent: '#25D366', activeItemBg: 'rgba(37,211,102,0.15)',
    main: '#0A0A0A',
    preview: 'linear-gradient(135deg, #0a0a0a 50%, #111111 50%)',
    logo: '/logo-dark.png',
  },
  oceano: {
    id: 'oceano', name: 'Océano', isDark: true,
    sidebar: '#0c2340', sidebarBorder: 'rgba(255,255,255,0.1)',
    accent: '#38bdf8', activeItemBg: 'rgba(56,189,248,0.15)',
    main: '#0A0A0A',
    preview: 'linear-gradient(135deg, #0c2340 50%, #111111 50%)',
    logo: '/logo-dark.png',
  },
  bosque: {
    id: 'bosque', name: 'Bosque', isDark: true,
    sidebar: '#14291e', sidebarBorder: 'rgba(255,255,255,0.08)',
    accent: '#4ade80', activeItemBg: 'rgba(74,222,128,0.15)',
    main: '#0A0A0A',
    preview: 'linear-gradient(135deg, #14291e 50%, #111111 50%)',
    logo: '/logo-dark.png',
  },
  aurora: {
    id: 'aurora', name: 'Aurora', isDark: true,
    sidebar: '#1e1246', sidebarBorder: 'rgba(255,255,255,0.1)',
    accent: '#a78bfa', activeItemBg: 'rgba(167,139,250,0.18)',
    main: '#0A0A0A',
    preview: 'linear-gradient(135deg, #1e1246 50%, #111111 50%)',
    logo: '/logo-dark.png',
  },
  atardecer: {
    id: 'atardecer', name: 'Atardecer', isDark: true,
    sidebar: '#6b1f0f', sidebarBorder: 'rgba(255,255,255,0.1)',
    accent: '#fb923c', activeItemBg: 'rgba(251,146,60,0.15)',
    main: '#0A0A0A',
    preview: 'linear-gradient(135deg, #6b1f0f 50%, #111111 50%)',
    logo: '/logo-dark.png',
  },
  minimal: {
    id: 'minimal', name: 'Minimal', isDark: false,
    sidebar: '#f8fafc', sidebarBorder: 'rgba(0,0,0,0.07)',
    accent: '#3b82f6', activeItemBg: 'rgba(59,130,246,0.1)',
    main: '#ffffff',
    preview: 'linear-gradient(135deg, #e2e8f0 50%, #ffffff 50%)',
    logo: '/logo-light.png',
  },
};

// Re-export context hook as usePreferencias for convenience
export { usePreferenciasCtx as usePreferencias } from '../context/PreferenciasContext';
