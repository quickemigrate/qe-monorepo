import type { Service, Faq } from './types';

export const SERVICES: Service[] = [
  {
    id: 'diagnóstico',
    title: 'Diagnóstico de viabilidad',
    description: 'Análisis detallado de tu perfil para identificar la mejor vía migratoria y probabilidades de éxito reales.',
    price: '59 €',
    isPopular: true,
  },
  {
    id: 'estudios',
    title: 'Gestión de visado de estudios',
    description: 'Gestión integral de tu visado para estudiar en España. Desde la admisión hasta la presentación consular.',
    price: '299 €',
  },
  {
    id: 'no-lucrativo',
    title: 'Gestión de visado no lucrativo',
    description: 'Para quienes desean residir en España sin realizar actividades laborales o profesionales.',
    price: '349 €',
  },
  {
    id: 'tie-nie',
    title: 'Trámites TIE / NIE',
    description: 'Asistencia para la obtención de tu Tarjeta de Identidad de Extranjero o Número de Identidad de Extranjero.',
    price: 'desde 79 €',
  },
  {
    id: 'prorroga',
    title: 'Prórroga de estancia por estudios',
    description: 'Gestión para renovar tu estancia legal como estudiante en territorio español.',
    price: 'desde 199 €',
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
