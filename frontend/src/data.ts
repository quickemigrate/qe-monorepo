import type { Faq } from './types';

export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  isPopular?: boolean;
  isFree?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0€',
    period: '',
    description: 'Para explorar si Quick Emigrate es para ti.',
    features: [
      'Diagnóstico básico (3 preguntas)',
      'Recomendación general de vía migratoria',
      'Acceso al blog y guías gratuitas',
    ],
    cta: 'Empezar gratis',
    ctaLink: '#contacto',
    isFree: true,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '59€',
    period: 'pago único',
    description: 'Tu diagnóstico completo con inteligencia artificial.',
    features: [
      'Diagnóstico completo con IA (10 preguntas)',
      'Informe PDF personalizado con tu ruta',
      'Checklist de documentos para tu perfil',
      'Alertas de riesgos específicos',
      'Recomendación de vía migratoria con probabilidad de éxito',
    ],
    cta: 'Obtener diagnóstico',
    ctaLink: '#contacto',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '39€',
    period: 'al mes',
    description: 'La plataforma completa para gestionar tu proceso.',
    features: [
      'Todo lo incluido en Starter',
      'Área privada con tracking de expediente',
      'Subida y análisis de documentos con IA',
      'Checklist dinámica actualizada en tiempo real',
      'Chat con asistente IA personalizado',
      'Alertas y recordatorios automáticos',
    ],
    cta: 'Empezar con Pro',
    ctaLink: '#contacto',
    isPopular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '399€',
    period: 'servicio completo',
    description: 'Acompañamiento humano de principio a fin.',
    features: [
      'Todo lo incluido en Pro',
      'Asesor humano dedicado a tu caso',
      'Videollamada de 45 minutos',
      'Revisión manual de tu expediente completo',
      'Acompañamiento hasta el visado aprobado',
    ],
    cta: 'Contratar Premium',
    ctaLink: '#contacto',
  },
];

export const FAQS: Faq[] = [
  {
    question: '¿Qué incluye el diagnóstico de viabilidad?',
    answer: 'Incluye una revisión inicial de tu perfil, identificación de la vía más adecuada, checklist inicial de documentos, detección de riesgos evidentes y una recomendación clara de los siguientes pasos.',
  },
  {
    question: '¿Son gestores oficiales?',
    answer: 'Somos una plataforma de asistencia digital especializada en trámites de extranjería para España. Nos enfocamos en ofrecer claridad, orden y guía experta para que tu proceso sea exitoso.',
  },
  {
    question: '¿Garantizan la aprobación del visado?',
    answer: 'Ningún servicio serio puede garantizar la aprobación, ya que depende de las autoridades consulares. Lo que sí garantizamos es que tu expediente estará impecable y cumplirá con cada requisito exigido.',
  },
  {
    question: '¿Cuánto tiempo toma el proceso?',
    answer: 'Depende del tipo de visado. Un diagnóstico se entrega en 48-72h. Otros trámites dependen de los tiempos de resolución del consulado o extranjería, pero nosotros agilizamos toda la preparación previa.',
  },
];
