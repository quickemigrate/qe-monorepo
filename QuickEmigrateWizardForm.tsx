import React, { useMemo, useState } from "react";

/**
 * Quick Emigrate — Wizard Adaptativo de Diagnóstico Migratorio
 * ------------------------------------------------------------
 * Archivo TSX autocontenido para integrar en Next.js / React.
 *
 * Qué incluye:
 * - Formulario tipo wizard por bloques progresivos.
 * - Preguntas obligatorias, opcionales y condicionales.
 * - Lógica showIf basada en respuestas anteriores.
 * - Validación básica por paso.
 * - Barra de progreso.
 * - Resumen final.
 * - Exportación JSON para pruebas.
 * - Callback onSubmit para conectar con Firebase/API/Cloud Function.
 *
 * Recomendación:
 * - Mantener este archivo como primera versión funcional.
 * - Más adelante separar `QUESTION_BLOCKS` a questions.config.ts.
 * - El scoring final debe calcularse en backend, no aquí.
 */

export type FieldType =
  | "checkbox"
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "textarea"
  | "single_select"
  | "multi_select";

export type Operator =
  | "equals"
  | "not_equals"
  | "in"
  | "not_in"
  | "contains"
  | "exists"
  | "not_exists"
  | "gte"
  | "lte"
  | "gt"
  | "lt";

export type Condition = {
  field: string;
  operator: Operator;
  value?: any;
};

export type LogicGroup = {
  mode: "all" | "any";
  conditions: Condition[];
};

export type Question = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  optionalButRecommended?: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  diagnosticUse?: string;
  showIf?: LogicGroup;
  sensitive?: boolean;
};

export type QuestionBlock = {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  showIf?: LogicGroup;
};

export type WizardAnswers = Record<string, any>;

export type QuickEmigrateWizardFormProps = {
  initialAnswers?: WizardAnswers;
  onSubmit?: (payload: {
    answers: WizardAnswers;
    internalAssessment: InternalAssessment;
    visibleBlocks: string[];
    submittedAt: string;
  }) => void | Promise<void>;
};

export type InternalAssessment = {
  requires_human_review: boolean;
  human_review_reasons: string[];
  main_candidate_routes: string[];
  economic_risk_level: "low" | "medium" | "high" | "critical";
  documentation_risk_level: "low" | "medium" | "high" | "critical";
  legal_risk_level: "low" | "medium" | "high" | "critical";
  urgency_risk_level: "low" | "medium" | "high";
};

const LATAM_COUNTRIES = [
  "Argentina",
  "Bolivia",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Ecuador",
  "El Salvador",
  "Guatemala",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
  "Otra",
];

const SPAIN_CITIES = [
  "Madrid",
  "Barcelona",
  "Valencia",
  "Sevilla",
  "Málaga",
  "Alicante",
  "Zaragoza",
  "Bilbao",
  "Murcia",
  "Otra",
  "No lo sé todavía",
];

const showIfSpain = {
  mode: "any",
  conditions: [
    { field: "current_location", operator: "contains", value: "España" },
  ],
} as LogicGroup;

const showIfStudy = {
  mode: "any",
  conditions: [
    { field: "migration_goal", operator: "equals", value: "Estudiar" },
    { field: "willing_to_study_in_spain", operator: "not_equals", value: "No" },
  ],
} as LogicGroup;

const showIfNonLucrative = {
  mode: "any",
  conditions: [
    { field: "migration_goal", operator: "equals", value: "Vivir en España sin trabajar" },
    { field: "main_priority", operator: "equals", value: "Vivir en España sin trabajar" },
  ],
} as LogicGroup;

const showIfDigitalNomad = {
  mode: "any",
  conditions: [
    { field: "migration_goal", operator: "equals", value: "Teletrabajar para una empresa o clientes extranjeros" },
    { field: "remote_work", operator: "not_equals", value: "No" },
  ],
} as LogicGroup;

const showIfEmployeeWork = {
  mode: "any",
  conditions: [
    { field: "migration_goal", operator: "equals", value: "Trabajar por cuenta ajena" },
    { field: "job_offer_spain", operator: "not_equals", value: "No" },
  ],
} as LogicGroup;

const showIfSelfEmployment = {
  mode: "any",
  conditions: [
    { field: "migration_goal", operator: "equals", value: "Trabajar como autónomo o emprender" },
    { field: "wants_self_employment", operator: "in", value: ["Sí", "Tal vez"] },
  ],
} as LogicGroup;

const showIfRegularization = {
  mode: "any",
  conditions: [
    { field: "migration_goal", operator: "equals", value: "Regularizar mi situación en España" },
    { field: "current_location", operator: "equals", value: "En España en situación irregular" },
    { field: "current_location", operator: "equals", value: "En España con estancia caducada" },
    { field: "spain_legal_status", operator: "in", value: ["Turista con los 90 días vencidos", "En situación irregular", "Estancia caducada"] },
  ],
} as LogicGroup;

const showIfFamily = {
  mode: "any",
  conditions: [
    { field: "migration_goal", operator: "equals", value: "Reunirme con familiares" },
    { field: "family_in_spain_or_eu", operator: "not_equals", value: "No" },
    { field: "family_accompanying", operator: "not_equals", value: "Viajaría solo/a" },
  ],
} as LogicGroup;

const showIfAsylum = {
  mode: "any",
  conditions: [
    { field: "migration_goal", operator: "equals", value: "Solicitar protección internacional/asilo" },
    { field: "current_location", operator: "equals", value: "En España como solicitante de asilo/protección internacional" },
  ],
} as LogicGroup;

const showIfNationality = {
  mode: "any",
  conditions: [
    { field: "migration_goal", operator: "equals", value: "Obtener nacionalidad española" },
    { field: "spanish_ancestry", operator: "not_equals", value: "No" },
    { field: "has_legal_residence_spain", operator: "equals", value: "Sí" },
  ],
} as LogicGroup;

export const QUESTION_BLOCKS: QuestionBlock[] = [
  {
    id: "consent",
    title: "Consentimiento y aviso legal",
    description: "Antes de empezar, confirma que entiendes el alcance del diagnóstico.",
    questions: [
      {
        id: "diagnostic_disclaimer_accepted",
        label:
          "¿Aceptas que este diagnóstico tiene carácter orientativo y no constituye asesoramiento legal ni garantiza la aprobación de ningún visado o autorización?",
        type: "checkbox",
        required: true,
        helpText: "Sin esta aceptación no se debe iniciar el cuestionario.",
      },
      {
        id: "diagnostic_data_consent",
        label:
          "¿Autorizas a Quick Emigrate a usar la información que proporciones para generar un diagnóstico migratorio personalizado?",
        type: "checkbox",
        required: true,
      },
    ],
  },
  {
    id: "basic_data",
    title: "Datos básicos del usuario",
    description: "Datos mínimos para personalizar el diagnóstico y ubicar el caso.",
    questions: [
      { id: "name", label: "¿Cuál es tu nombre?", type: "text", required: true },
      { id: "email", label: "¿Cuál es tu correo electrónico?", type: "email", required: true },
      { id: "phone", label: "¿Cuál es tu número de WhatsApp o teléfono?", type: "tel", required: false },
      { id: "age", label: "¿Cuántos años tienes?", type: "number", required: true },
      {
        id: "nationality",
        label: "¿Cuál es tu nacionalidad?",
        type: "single_select",
        required: true,
        options: LATAM_COUNTRIES,
      },
      {
        id: "second_nationality_exists",
        label: "¿Tienes otra nacionalidad además de la anterior?",
        type: "single_select",
        required: true,
        options: ["No", "Sí", "No lo sé"],
      },
      {
        id: "second_nationality",
        label: "¿Cuál es tu segunda nacionalidad?",
        type: "text",
        required: true,
        showIf: {
          mode: "all",
          conditions: [{ field: "second_nationality_exists", operator: "equals", value: "Sí" }],
        },
      },
      {
        id: "country_of_residence",
        label: "¿En qué país resides actualmente?",
        type: "text",
        required: true,
      },
      {
        id: "current_city",
        label: "¿En qué ciudad resides actualmente?",
        type: "text",
        required: true,
      },
      {
        id: "current_location",
        label: "¿Dónde estás actualmente?",
        type: "single_select",
        required: true,
        options: [
          "En mi país de origen",
          "En otro país fuera de España",
          "En España como turista",
          "En España con visado de estudios",
          "En España con residencia legal",
          "En España en situación irregular",
          "En España como solicitante de asilo/protección internacional",
          "En España con estancia caducada",
          "No lo sé exactamente",
        ],
      },
      {
        id: "target_city_spain",
        label: "¿En qué ciudad o provincia de España estás o quieres vivir?",
        type: "single_select",
        required: true,
        options: SPAIN_CITIES,
      },
    ],
  },
  {
    id: "migration_goal",
    title: "Objetivo migratorio",
    description: "Identifica la intención principal y las prioridades reales del usuario.",
    questions: [
      {
        id: "migration_goal",
        label: "¿Cuál es tu objetivo principal en España?",
        type: "single_select",
        required: true,
        options: [
          "Estudiar",
          "Trabajar por cuenta ajena",
          "Trabajar como autónomo o emprender",
          "Teletrabajar para una empresa o clientes extranjeros",
          "Vivir en España sin trabajar",
          "Reunirme con familiares",
          "Regularizar mi situación en España",
          "Solicitar protección internacional/asilo",
          "Obtener nacionalidad española",
          "No lo tengo claro, quiero saber qué opción me conviene",
        ],
      },
      {
        id: "main_priority",
        label: "¿Qué es más importante para ti ahora mismo?",
        type: "single_select",
        required: true,
        options: [
          "Entrar legalmente en España",
          "Conseguir permiso para trabajar",
          "Regularizarme lo antes posible",
          "Estudiar y luego trabajar",
          "Traer a mi familia",
          "Vivir en España sin trabajar",
          "Ahorrar costes",
          "Reducir el riesgo de rechazo",
          "Llegar lo antes posible",
          "Conseguir una residencia estable a largo plazo",
        ],
      },
      {
        id: "urgency",
        label: "¿Cuándo quieres iniciar el proceso o viajar a España?",
        type: "single_select",
        required: true,
        options: [
          "Inmediatamente",
          "En menos de 1 mes",
          "En 1 a 3 meses",
          "En 3 a 6 meses",
          "En 6 a 12 meses",
          "En más de 12 meses",
          "Ya estoy en España",
        ],
      },
      {
        id: "six_month_plan",
        label: "¿Cuál es tu plan ideal para los primeros 6 meses en España?",
        type: "textarea",
        required: true,
        placeholder: "Ejemplo: estudiar, trabajar, vivir con familiares, buscar empleo, ahorrar, etc.",
      },
      {
        id: "medium_term_goals",
        label: "¿Qué resultado te gustaría conseguir en España a medio plazo?",
        type: "multi_select",
        required: false,
        options: [
          "Trabajar legalmente",
          "Estudiar",
          "Traer a mi familia",
          "Obtener residencia estable",
          "Obtener nacionalidad española",
          "Emprender",
          "Homologar mi título",
          "Mejorar calidad de vida",
          "Ahorrar dinero",
          "Salir de una situación de inseguridad en mi país",
        ],
      },
    ],
  },
  {
    id: "legal_status",
    title: "Situación legal y migratoria",
    description: "Detecta bloqueos legales, historial migratorio y necesidad de revisión humana.",
    questions: [
      {
        id: "previous_spain_stay",
        label: "¿Has estado antes en España?",
        type: "single_select",
        required: true,
        options: [
          "No",
          "Sí, como turista",
          "Sí, como estudiante",
          "Sí, con residencia",
          "Sí, en situación irregular",
          "Sí, pero no recuerdo mi situación exacta",
        ],
      },
      {
        id: "previous_spain_stay_details",
        label: "¿Cuándo estuviste en España y durante cuánto tiempo?",
        type: "textarea",
        required: true,
        showIf: {
          mode: "all",
          conditions: [{ field: "previous_spain_stay", operator: "not_equals", value: "No" }],
        },
      },
      {
        id: "spain_entry_date",
        label: "Si estás actualmente en España, ¿en qué fecha entraste?",
        type: "date",
        required: true,
        showIf: showIfSpain,
      },
      {
        id: "spain_legal_status",
        label: "Si estás en España, ¿cuál es tu situación actual?",
        type: "single_select",
        required: true,
        showIf: showIfSpain,
        options: [
          "Turista dentro de los 90 días",
          "Turista con los 90 días vencidos",
          "Estudiante",
          "Residente legal",
          "Solicitante de asilo",
          "En situación irregular",
          "Estancia caducada",
          "No lo sé",
        ],
      },
      {
        id: "overstay_history",
        label: "¿Has superado alguna vez el tiempo permitido de estancia en España o en zona Schengen?",
        type: "single_select",
        required: true,
        options: ["No", "Sí", "No lo sé"],
      },
      {
        id: "overstay_details",
        label: "¿Cuánto tiempo excediste la estancia y en qué país ocurrió?",
        type: "textarea",
        required: true,
        showIf: {
          mode: "all",
          conditions: [{ field: "overstay_history", operator: "equals", value: "Sí" }],
        },
      },
      {
        id: "previous_denials",
        label: "¿Te han denegado antes un visado, residencia, asilo o trámite migratorio?",
        type: "single_select",
        required: true,
        options: ["No", "Sí, en España", "Sí, en otro país Schengen", "Sí, en otro país no Schengen", "No lo sé"],
      },
      {
        id: "previous_denial_reason",
        label: "¿Qué trámite te denegaron, cuándo y cuál fue el motivo?",
        type: "textarea",
        required: true,
        showIf: {
          mode: "all",
          conditions: [{ field: "previous_denials", operator: "not_equals", value: "No" }],
        },
      },
      {
        id: "criminal_record",
        label: "¿Tienes antecedentes penales o policiales en algún país?",
        type: "single_select",
        required: true,
        sensitive: true,
        options: ["No", "Sí", "No lo sé", "Prefiero explicarlo"],
      },
      {
        id: "criminal_record_details",
        label: "¿En qué país, por qué motivo y en qué año?",
        type: "textarea",
        required: true,
        sensitive: true,
        showIf: {
          mode: "any",
          conditions: [
            { field: "criminal_record", operator: "equals", value: "Sí" },
            { field: "criminal_record", operator: "equals", value: "No lo sé" },
            { field: "criminal_record", operator: "equals", value: "Prefiero explicarlo" },
          ],
        },
      },
      {
        id: "expulsion_or_ban",
        label: "¿Tienes alguna orden de expulsión, prohibición de entrada o procedimiento sancionador abierto?",
        type: "single_select",
        required: true,
        sensitive: true,
        options: ["No", "Sí", "No lo sé"],
      },
      {
        id: "expulsion_or_ban_details",
        label: "Explica brevemente la situación.",
        type: "textarea",
        required: true,
        sensitive: true,
        showIf: {
          mode: "any",
          conditions: [
            { field: "expulsion_or_ban", operator: "equals", value: "Sí" },
            { field: "expulsion_or_ban", operator: "equals", value: "No lo sé" },
          ],
        },
      },
    ],
  },
  {
    id: "family",
    title: "Familia y acompañantes",
    description: "Calcula dependientes, vías familiares y requisitos económicos adicionales.",
    questions: [
      {
        id: "marital_status",
        label: "¿Cuál es tu estado civil?",
        type: "single_select",
        required: true,
        options: ["Soltero/a", "Casado/a", "Pareja de hecho registrada", "Pareja no registrada", "Divorciado/a", "Viudo/a"],
      },
      {
        id: "family_accompanying",
        label: "¿Viajarías solo/a o con familiares?",
        type: "single_select",
        required: true,
        options: ["Viajaría solo/a", "Con pareja", "Con hijos", "Con pareja e hijos", "Con padres u otros familiares", "No lo sé todavía"],
      },
      {
        id: "dependents_count",
        label: "¿Cuántas personas dependerían económicamente de ti en España?",
        type: "number",
        required: true,
      },
      {
        id: "minor_children",
        label: "¿Tienes hijos menores de edad?",
        type: "single_select",
        required: true,
        options: ["No", "Sí, viajarían conmigo", "Sí, se quedarían en mi país", "Sí, todavía no lo sé"],
      },
      {
        id: "family_in_spain_or_eu",
        label: "¿Tienes familiares en España o en la Unión Europea?",
        type: "single_select",
        required: true,
        options: ["No", "Sí, cónyuge o pareja", "Sí, padres", "Sí, hijos", "Sí, hermanos", "Sí, abuelos", "Sí, otros familiares"],
      },
      {
        id: "family_member_status",
        label: "¿Qué nacionalidad o situación legal tiene ese familiar?",
        type: "single_select",
        required: true,
        showIf: {
          mode: "all",
          conditions: [{ field: "family_in_spain_or_eu", operator: "not_equals", value: "No" }],
        },
        options: ["Español/a", "Ciudadano/a de la Unión Europea", "Residente legal en España", "Solicitante de asilo", "En situación irregular", "No lo sé"],
      },
      {
        id: "family_relationship_details",
        label: "¿Cuál es tu relación exacta con ese familiar y dónde vive?",
        type: "text",
        required: true,
        showIf: {
          mode: "all",
          conditions: [{ field: "family_in_spain_or_eu", operator: "not_equals", value: "No" }],
        },
      },
      {
        id: "spanish_ancestry",
        label: "¿Tienes padres, abuelos o bisabuelos españoles?",
        type: "single_select",
        required: true,
        options: ["No", "Sí, padre o madre español/a", "Sí, abuelo/a español/a", "Sí, bisabuelo/a español/a", "No lo sé"],
      },
      {
        id: "spanish_ancestry_documents",
        label: "¿Conservas documentos de nacimiento, matrimonio o nacionalidad de ese familiar español?",
        type: "single_select",
        required: true,
        showIf: {
          mode: "all",
          conditions: [{ field: "spanish_ancestry", operator: "not_equals", value: "No" }],
        },
        options: ["Sí, todos", "Tengo algunos", "No", "No lo sé"],
      },
    ],
  },
  {
    id: "education",
    title: "Formación académica",
    description: "Determina estudios, homologación, vía académica y empleabilidad.",
    questions: [
      {
        id: "education_level",
        label: "¿Cuál es tu nivel educativo máximo completado?",
        type: "single_select",
        required: true,
        options: ["Secundaria incompleta", "Secundaria completa", "Técnico / formación profesional", "Universitario incompleto", "Grado universitario", "Máster", "Doctorado", "Otro"],
      },
      {
        id: "study_area",
        label: "¿En qué área te formaste?",
        type: "single_select",
        required: true,
        options: ["Salud", "Ingeniería", "Informática / tecnología", "Administración / finanzas", "Derecho", "Educación", "Arquitectura", "Construcción", "Hostelería / turismo", "Comercio / ventas", "Arte / diseño", "Otro"],
      },
      { id: "degree_name", label: "¿Qué título concreto tienes o estás cursando?", type: "text", required: false },
      {
        id: "regulated_profession",
        label: "¿Tu profesión requiere homologación, colegiación o habilitación para ejercer en España?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "No lo sé"],
      },
      {
        id: "target_profession_spain",
        label: "¿Qué profesión quieres ejercer en España?",
        type: "text",
        required: true,
        showIf: {
          mode: "any",
          conditions: [
            { field: "regulated_profession", operator: "equals", value: "Sí" },
            { field: "regulated_profession", operator: "equals", value: "No lo sé" },
          ],
        },
      },
      {
        id: "willing_to_study_in_spain",
        label: "¿Estarías dispuesto/a a estudiar en España si fuese la vía más viable para ti?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Tal vez, si es la vía más segura", "Solo si puedo trabajar mientras estudio", "Solo si el coste es asumible"],
      },
      {
        id: "admission_letter",
        label: "¿Ya tienes carta de admisión o matrícula en algún centro de estudios en España?",
        type: "single_select",
        required: true,
        options: ["Sí, carta de admisión", "Sí, matrícula pagada", "No, pero estoy buscando centro", "No", "No aplica"],
      },
      {
        id: "study_program_type",
        label: "¿Qué tipo de estudios son o quieres realizar?",
        type: "single_select",
        required: true,
        showIf: {
          mode: "any",
          conditions: [
            { field: "admission_letter", operator: "equals", value: "Sí, carta de admisión" },
            { field: "admission_letter", operator: "equals", value: "Sí, matrícula pagada" },
            { field: "admission_letter", operator: "equals", value: "No, pero estoy buscando centro" },
          ],
        },
        options: ["Grado universitario", "Máster", "Doctorado", "FP Grado Medio", "FP Grado Superior", "Curso de idiomas", "Certificado profesional", "Curso privado", "Otro"],
      },
      {
        id: "study_duration_months",
        label: "¿Cuánto duraría el programa de estudios?",
        type: "number",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "study_program_type", operator: "exists" }] },
      },
      {
        id: "study_modality",
        label: "¿Cuál sería la modalidad de los estudios?",
        type: "single_select",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "study_program_type", operator: "exists" }] },
        options: ["Presencial", "Semipresencial", "Online", "No lo sé"],
      },
      {
        id: "study_center_accredited",
        label: "¿El centro está autorizado/acreditado oficialmente en España?",
        type: "single_select",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "study_program_type", operator: "exists" }] },
        options: ["Sí", "No", "No lo sé"],
      },
      {
        id: "study_hours_weekly",
        label: "¿El programa tiene al menos 20 horas semanales o una dedicación académica suficiente?",
        type: "single_select",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "study_program_type", operator: "exists" }] },
        options: ["Sí", "No", "No lo sé"],
      },
      {
        id: "study_to_work_transition_goal",
        label: "¿Tu intención después de estudiar es quedarte a trabajar en España?",
        type: "single_select",
        required: true,
        showIf: showIfStudy,
        options: ["Sí", "No", "Tal vez", "No lo sé"],
      },
    ],
  },
  {
    id: "work",
    title: "Situación laboral y profesional",
    description: "Detecta trabajo por cuenta ajena, nómada digital o emprendimiento.",
    questions: [
      {
        id: "employment_status",
        label: "¿Cuál es tu situación laboral actual?",
        type: "single_select",
        required: true,
        options: ["Empleado/a", "Autónomo/a", "Empresario/a", "Desempleado/a", "Estudiante", "Trabajo informal", "Jubilado/a", "Otro"],
      },
      { id: "current_profession", label: "¿Cuál es tu profesión u ocupación actual?", type: "text", required: true },
      {
        id: "years_experience",
        label: "¿Cuántos años de experiencia laboral tienes?",
        type: "single_select",
        required: true,
        options: ["Menos de 1 año", "1-2 años", "3-5 años", "6-10 años", "Más de 10 años"],
      },
      {
        id: "job_offer_spain",
        label: "¿Tienes una oferta de trabajo o contrato de una empresa española?",
        type: "single_select",
        required: true,
        options: ["No", "Sí, oferta informal", "Sí, oferta formal", "Sí, contrato firmado", "Estoy en entrevistas"],
      },
      {
        id: "employer_willing_to_sponsor",
        label: "¿La empresa está dispuesta a tramitar tu autorización de trabajo?",
        type: "single_select",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "job_offer_spain", operator: "not_equals", value: "No" }] },
        options: ["Sí", "No", "No lo sé"],
      },
      {
        id: "employer_solvency",
        label: "¿La empresa puede demostrar solvencia y estar al corriente con Hacienda y Seguridad Social?",
        type: "single_select",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "job_offer_spain", operator: "not_equals", value: "No" }] },
        options: ["Sí", "No", "No lo sé"],
      },
      {
        id: "sne_exception_possible",
        label: "¿La oferta está relacionada con una ocupación de difícil cobertura o tienes alguna exención de la Situación Nacional de Empleo?",
        type: "single_select",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "job_offer_spain", operator: "not_equals", value: "No" }] },
        options: ["Sí", "No", "No lo sé"],
      },
      {
        id: "remote_work",
        label: "¿Trabajas en remoto para una empresa extranjera o clientes fuera de España?",
        type: "single_select",
        required: true,
        options: ["No", "Sí, empleado/a para empresa extranjera", "Sí, freelance con clientes extranjeros", "Sí, tengo ambos", "No ahora, pero podría conseguirlo"],
      },
      {
        id: "remote_income_monthly_eur",
        label: "¿Cuánto ingresas al mes por trabajo remoto?",
        type: "number",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "remote_work", operator: "not_equals", value: "No" }] },
      },
      {
        id: "remote_work_proof",
        label: "¿Puedes acreditar contrato, facturas, clientes o relación profesional estable?",
        type: "single_select",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "remote_work", operator: "not_equals", value: "No" }] },
        options: ["Sí", "No", "Parcialmente", "No lo sé"],
      },
      {
        id: "spanish_income_percentage",
        label: "¿Qué porcentaje de tus ingresos vendría de clientes o empresas españolas?",
        type: "single_select",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "remote_work", operator: "not_equals", value: "No" }] },
        options: ["0%", "1-20%", "21-50%", "Más del 50%", "No lo sé"],
      },
      {
        id: "wants_self_employment",
        label: "¿Quieres montar un negocio o trabajar como autónomo en España?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Tal vez"],
      },
      {
        id: "business_plan_status",
        label: "¿Tienes plan de negocio, clientes, financiación o actividad previa demostrable?",
        type: "multi_select",
        required: true,
        showIf: { mode: "any", conditions: [{ field: "wants_self_employment", operator: "equals", value: "Sí" }, { field: "wants_self_employment", operator: "equals", value: "Tal vez" }] },
        options: ["Tengo plan de negocio", "Tengo clientes", "Tengo financiación", "Tengo actividad previa demostrable", "Tengo experiencia en el sector", "No tengo nada preparado todavía"],
      },
      {
        id: "business_capital_eur",
        label: "¿Cuánto capital podrías invertir inicialmente en el negocio?",
        type: "single_select",
        required: false,
        showIf: { mode: "any", conditions: [{ field: "wants_self_employment", operator: "equals", value: "Sí" }, { field: "wants_self_employment", operator: "equals", value: "Tal vez" }] },
        options: ["Menos de 2.000 €", "2.000 € - 5.000 €", "5.000 € - 10.000 €", "10.000 € - 25.000 €", "Más de 25.000 €"],
      },
    ],
  },
  {
    id: "economics",
    title: "Situación económica",
    description: "Calcula riesgo económico, coste estimado y viabilidad por ruta.",
    questions: [
      {
        id: "savings_eur_range",
        label: "¿Cuánto dinero tienes disponible actualmente para el proceso migratorio?",
        type: "single_select",
        required: true,
        options: ["Menos de 2.000 €", "2.000 € - 5.000 €", "5.000 € - 8.000 €", "8.000 € - 12.000 €", "12.000 € - 20.000 €", "20.000 € - 40.000 €", "Más de 40.000 €"],
      },
      { id: "savings_eur", label: "Indica una cifra aproximada de ahorros disponibles en euros.", type: "number", required: false, optionalButRecommended: true },
      {
        id: "monthly_income_eur_range",
        label: "¿Cuáles son tus ingresos mensuales aproximados?",
        type: "single_select",
        required: true,
        options: ["Sin ingresos", "Menos de 500 €", "500 € - 1.000 €", "1.000 € - 2.000 €", "2.000 € - 3.000 €", "3.000 € - 5.000 €", "Más de 5.000 €"],
      },
      { id: "monthly_income_eur", label: "Indica una cifra aproximada de ingresos mensuales en euros.", type: "number", required: false, optionalButRecommended: true },
      {
        id: "funds_origin",
        label: "¿De dónde provienen tus fondos?",
        type: "multi_select",
        required: true,
        options: ["Salario", "Ahorros personales", "Apoyo familiar", "Venta de bienes", "Rentas de alquiler", "Pensión", "Dividendos/inversiones", "Préstamo", "Trabajo informal", "No puedo justificarlo claramente"],
      },
      {
        id: "funds_in_own_bank_account",
        label: "¿Los fondos están en una cuenta bancaria a tu nombre?",
        type: "single_select",
        required: true,
        options: ["Sí", "No, están en cuenta de un familiar", "Parte sí y parte no", "No", "No lo sé"],
      },
      {
        id: "bank_history_3_6_months",
        label: "¿Puedes demostrar movimientos bancarios estables de los últimos 3 a 6 meses?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Parcialmente", "No lo sé"],
      },
      {
        id: "total_budget_eur_range",
        label: "¿Cuánto puedes invertir en total entre trámite, viaje, estudios, vivienda y manutención inicial?",
        type: "single_select",
        required: true,
        options: ["Menos de 3.000 €", "3.000 € - 6.000 €", "6.000 € - 10.000 €", "10.000 € - 15.000 €", "15.000 € - 25.000 €", "Más de 25.000 €"],
      },
      {
        id: "financial_buffer",
        label: "Si el proceso cuesta más de lo previsto, ¿tienes margen económico?",
        type: "single_select",
        required: true,
        options: ["Sí, tengo margen", "Algo de margen", "No, voy muy justo", "Dependo de ayuda familiar", "No lo sé"],
      },
      {
        id: "family_financial_sponsor",
        label: "¿Alguien de tu familia puede patrocinar económicamente tu proceso?",
        type: "single_select",
        required: false,
        options: ["Sí", "No", "Tal vez", "No lo sé"],
      },
      {
        id: "family_sponsor_proof",
        label: "¿Ese familiar puede demostrar ingresos, ahorros y relación familiar contigo?",
        type: "single_select",
        required: true,
        showIf: { mode: "any", conditions: [{ field: "family_financial_sponsor", operator: "equals", value: "Sí" }, { field: "family_financial_sponsor", operator: "equals", value: "Tal vez" }] },
        options: ["Sí", "No", "Parcialmente", "No lo sé"],
      },
    ],
  },
  {
    id: "documents",
    title: "Documentación disponible",
    description: "Detecta documentos faltantes, apostillas, traducciones y riesgos de expediente.",
    questions: [
      {
        id: "passport_valid",
        label: "¿Tienes pasaporte vigente?",
        type: "single_select",
        required: true,
        options: ["Sí, con más de 12 meses de vigencia", "Sí, pero vence en menos de 12 meses", "No", "Está en trámite"],
      },
      {
        id: "criminal_record_certificate_available",
        label: "¿Puedes obtener certificado de antecedentes penales apostillado o legalizado?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "No lo sé", "Ya lo tengo"],
      },
      {
        id: "medical_certificate_available",
        label: "¿Puedes obtener certificado médico válido para extranjería?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "No lo sé", "Ya lo tengo"],
      },
      {
        id: "apostille_status",
        label: "¿Sabes si tus documentos necesitan apostilla o legalización?",
        type: "single_select",
        required: true,
        options: ["Sí, y ya los tengo apostillados/legalizados", "Sí, pero todavía no los he apostillado/legalizado", "No lo sé", "Mi país no usa apostilla"],
      },
      {
        id: "translation_needed",
        label: "¿Tienes documentos que no estén en español?",
        type: "single_select",
        required: true,
        options: ["No", "Sí, y ya tengo traducción jurada", "Sí, pero todavía no los he traducido", "No lo sé"],
      },
      {
        id: "health_insurance",
        label: "¿Tienes seguro médico válido para España?",
        type: "single_select",
        required: true,
        options: ["Sí, seguro privado sin copagos", "Sí, pero no sé si sirve para extranjería", "No", "Estoy comparando opciones"],
      },
      {
        id: "civil_documents_available",
        label: "¿Tienes documentos civiles actualizados?",
        type: "multi_select",
        required: false,
        options: ["Certificado de nacimiento", "Certificado de matrimonio", "Certificados de nacimiento de hijos", "Documentos de divorcio/custodia", "Ninguno", "No lo sé"],
      },
      {
        id: "documents_ready",
        label: "¿Tienes ya algún documento preparado para el trámite?",
        type: "multi_select",
        required: false,
        options: ["Pasaporte", "Antecedentes penales", "Certificado médico", "Carta de admisión", "Contrato de trabajo", "Seguro médico", "Extractos bancarios", "Apostillas/legalizaciones", "Traducciones", "Empadronamiento", "Contrato de alquiler", "Ninguno todavía"],
      },
    ],
  },
  {
    id: "housing",
    title: "Vivienda y llegada a España",
    description: "Mide coste inicial, empadronamiento y red de apoyo.",
    questions: [
      {
        id: "housing_plan",
        label: "¿Tienes alojamiento previsto en España?",
        type: "single_select",
        required: true,
        options: ["Sí, contrato de alquiler", "Sí, me quedaría con familiares o amigos", "Sí, residencia de estudiantes", "No, todavía no", "No lo sé"],
      },
      {
        id: "can_register_address",
        label: "¿Podrías empadronarte en la vivienda donde vivirías?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "No lo sé"],
      },
      {
        id: "housing_timing",
        label: "¿Tienes previsto contratar vivienda antes de viajar o después de llegar?",
        type: "single_select",
        required: false,
        options: ["Antes de viajar", "Después de llegar", "Me alojaré temporalmente con alguien", "No lo sé"],
      },
      {
        id: "arrival_support_network",
        label: "¿Tienes familiares o amigos que puedan recibirte al llegar a España?",
        type: "single_select",
        required: false,
        options: ["Sí", "No", "Tal vez"],
      },
    ],
  },
  {
    id: "study_module",
    title: "Módulo específico: visado / estancia por estudios",
    description: "Solo aparece si la vía de estudios puede aplicar.",
    showIf: showIfStudy,
    questions: [
      {
        id: "study_main_reason",
        label: "¿Quieres estudiar principalmente para formarte o como vía para poder vivir y trabajar después en España?",
        type: "single_select",
        required: true,
        options: ["Principalmente formarme", "Formarme y después trabajar", "Principalmente entrar legalmente y trabajar después", "No lo tengo claro"],
      },
      {
        id: "study_center_selected",
        label: "¿Ya has elegido centro de estudios?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Estoy comparando opciones"],
      },
      {
        id: "study_center_name",
        label: "Nombre del centro de estudios.",
        type: "text",
        required: false,
        showIf: { mode: "all", conditions: [{ field: "study_center_selected", operator: "equals", value: "Sí" }] },
      },
      {
        id: "study_enrollment_paid",
        label: "¿Has pagado matrícula o reserva de plaza?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Solo preinscripción", "No lo sé"],
      },
      { id: "study_tuition_cost_eur", label: "¿Cuánto cuesta la matrícula o programa completo?", type: "number", required: false, optionalButRecommended: true },
      {
        id: "needs_work_while_studying",
        label: "¿Necesitas trabajar mientras estudias?",
        type: "single_select",
        required: true,
        options: ["Sí, necesito trabajar", "Me gustaría, pero no es imprescindible", "No"],
      },
      {
        id: "study_allows_work_30h",
        label: "¿Sabes si esos estudios permiten trabajar hasta 30 horas semanales?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "No lo sé"],
      },
    ],
  },
  {
    id: "non_lucrative_module",
    title: "Módulo específico: residencia no lucrativa",
    showIf: showIfNonLucrative,
    questions: [
      {
        id: "can_live_without_working_one_year",
        label: "¿Puedes mantenerte en España durante el primer año sin trabajar?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "No lo sé"],
      },
      {
        id: "passive_income_sources",
        label: "¿Cuál es la fuente principal de tus ingresos o patrimonio?",
        type: "multi_select",
        required: true,
        options: ["Pensión", "Rentas de alquiler", "Dividendos/inversiones", "Ahorros acumulados", "Venta de bienes", "Apoyo familiar", "Trabajo activo", "Teletrabajo", "Otro"],
      },
      {
        id: "public_work_activity_risk",
        label: "¿Tienes actividad profesional pública online, LinkedIn activo, empresa propia o clientes activos?",
        type: "single_select",
        required: true,
        options: ["No", "Sí", "No lo sé"],
      },
      {
        id: "intends_to_work_first_year",
        label: "¿Tu intención real es trabajar en España durante el primer año?",
        type: "single_select",
        required: true,
        options: ["No", "Sí", "Tal vez", "No lo sé"],
      },
    ],
  },
  {
    id: "digital_nomad_module",
    title: "Módulo específico: nómada digital",
    showIf: showIfDigitalNomad,
    questions: [
      {
        id: "remote_work_stability",
        label: "¿Trabajas para una empresa extranjera o tienes clientes fuera de España desde hace al menos 3 meses?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Parcialmente", "No lo sé"],
      },
      {
        id: "remote_income_proof",
        label: "¿Puedes demostrar tus ingresos mediante nóminas, facturas, contratos o extractos?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Parcialmente"],
      },
      {
        id: "remote_work_duration",
        label: "¿Cuánto tiempo llevas trabajando en remoto para esa empresa o clientes?",
        type: "single_select",
        required: true,
        options: ["Menos de 3 meses", "3-6 meses", "6-12 meses", "Más de 12 meses"],
      },
      {
        id: "remote_work_authorization_from_company",
        label: "¿Puedes trabajar desde España con autorización de tu empresa o clientes?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "No lo sé"],
      },
    ],
  },
  {
    id: "employee_work_module",
    title: "Módulo específico: trabajo por cuenta ajena",
    showIf: showIfEmployeeWork,
    questions: [
      {
        id: "employer_type",
        label: "¿Qué tipo de empresa te contrataría?",
        type: "single_select",
        required: true,
        options: ["Empresa grande", "Pyme", "Autónomo/persona física", "Familiar o conocido", "No lo sé"],
      },
      {
        id: "job_full_time",
        label: "¿El contrato sería a jornada completa?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "No lo sé"],
      },
      { id: "job_salary_gross_annual_eur", label: "¿Cuál sería el salario bruto anual aproximado?", type: "number", required: false, optionalButRecommended: true },
      {
        id: "employer_previous_foreign_hires",
        label: "¿La empresa ya ha contratado antes a extranjeros no comunitarios?",
        type: "single_select",
        required: false,
        options: ["Sí", "No", "No lo sé"],
      },
      {
        id: "known_sne_exemption",
        label: "¿Eres nacional de Perú, Chile o tienes alguna circunstancia que pueda eximir la Situación Nacional de Empleo?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "No lo sé"],
      },
    ],
  },
  {
    id: "self_employment_module",
    title: "Módulo específico: cuenta propia / emprendimiento",
    showIf: showIfSelfEmployment,
    questions: [
      { id: "self_employment_activity", label: "¿Qué actividad quieres realizar en España?", type: "textarea", required: true },
      {
        id: "clients_in_spain_expected",
        label: "¿Tienes clientes o contratos previstos en España?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Algunos", "No lo sé"],
      },
      {
        id: "business_requires_license",
        label: "¿Tu actividad requiere licencia, local, colegiación o autorización administrativa?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "No lo sé"],
      },
      {
        id: "business_financial_plan",
        label: "¿Tienes plan financiero de ingresos y gastos para los primeros 12 meses?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Parcialmente"],
      },
    ],
  },
  {
    id: "regularization_module",
    title: "Módulo específico: arraigo / regularización",
    description: "Se activa para usuarios que ya están en España y necesitan regularizar su situación.",
    showIf: showIfRegularization,
    questions: [
      {
        id: "continuous_stay_spain",
        label: "¿Cuánto tiempo llevas viviendo de forma continuada en España?",
        type: "single_select",
        required: true,
        options: ["Menos de 6 meses", "6-12 meses", "1-2 años", "2-3 años", "Más de 3 años"],
      },
      {
        id: "proof_of_continuous_stay",
        label: "¿Puedes demostrar tu permanencia en España con documentos?",
        type: "multi_select",
        required: true,
        options: ["Empadronamiento", "Facturas", "Contrato de alquiler", "Historial médico", "Movimientos bancarios", "Envíos de dinero", "Cursos o matrículas", "Pruebas laborales", "Tengo algunas pruebas", "No tengo pruebas"],
      },
      {
        id: "has_empadronamiento",
        label: "¿Tienes empadronamiento en España?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Lo tuve antes", "No lo sé"],
      },
      {
        id: "regularization_anchor",
        label: "¿Tienes o podrías conseguir una oferta de trabajo o matrícula en formación?",
        type: "single_select",
        required: true,
        options: ["Oferta de trabajo", "Matrícula en formación", "Ambas", "Ninguna", "No lo sé"],
      },
      {
        id: "worked_in_spain_without_contract",
        label: "¿Has trabajado en España, aunque haya sido sin contrato?",
        type: "single_select",
        required: false,
        sensitive: true,
        options: ["Sí", "No", "Prefiero no responder"],
      },
      {
        id: "integration_report_possible",
        label: "¿Tienes informe de integración social o podrías solicitarlo en tu ayuntamiento?",
        type: "single_select",
        required: false,
        options: ["Sí", "No", "No lo sé"],
      },
    ],
  },
  {
    id: "family_reunification_module",
    title: "Módulo específico: reagrupación familiar / familiar de español o UE",
    showIf: showIfFamily,
    questions: [
      {
        id: "family_reunification_member",
        label: "¿Qué familiar quieres traer o con qué familiar quieres reunirte?",
        type: "single_select",
        required: true,
        options: ["Cónyuge o pareja", "Hijo/a menor", "Hijo/a mayor dependiente", "Padre/madre", "Otro familiar"],
      },
      {
        id: "sponsor_legal_status_spain",
        label: "¿La persona que está en España tiene residencia legal o nacionalidad española/UE?",
        type: "single_select",
        required: true,
        options: ["Nacionalidad española", "Ciudadanía UE", "Residencia legal en España", "Estancia por estudios", "Situación irregular", "No lo sé"],
      },
      {
        id: "family_link_documents",
        label: "¿Puedes acreditar el vínculo familiar con documentos oficiales?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Parcialmente", "No lo sé"],
      },
      {
        id: "family_reunification_resources",
        label: "¿La persona en España puede acreditar vivienda adecuada y medios económicos?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Parcialmente", "No lo sé"],
      },
    ],
  },
  {
    id: "asylum_module",
    title: "Módulo específico: asilo / protección internacional",
    description: "Este módulo debe activar revisión humana. No debe prometer resultado.",
    showIf: showIfAsylum,
    questions: [
      {
        id: "protection_reason_exists",
        label: "¿Tu salida del país está relacionada con persecución, amenazas, violencia o riesgo grave?",
        type: "single_select",
        required: true,
        sensitive: true,
        options: ["Sí", "No", "Prefiero explicarlo", "No estoy seguro/a"],
      },
      {
        id: "protection_reason_details",
        label: "¿Quieres explicar brevemente tu situación?",
        type: "textarea",
        required: false,
        sensitive: true,
      },
      {
        id: "previous_asylum_application",
        label: "¿Ya has solicitado asilo o protección internacional en España u otro país?",
        type: "single_select",
        required: true,
        options: ["No", "Sí, en España", "Sí, en otro país de la UE", "Sí, en otro país", "No lo sé"],
      },
      {
        id: "asylum_document_status",
        label: "¿Tienes cita, resguardo blanco, tarjeta roja o algún documento de asilo?",
        type: "single_select",
        required: true,
        options: ["No", "Cita solicitada", "Resguardo blanco", "Tarjeta roja", "Resolución favorable", "Denegación", "No lo sé"],
      },
    ],
  },
  {
    id: "nationality_module",
    title: "Módulo específico: nacionalidad española",
    showIf: showIfNationality,
    questions: [
      {
        id: "has_legal_residence_spain",
        label: "¿Tienes residencia legal en España actualmente?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "No lo sé"],
      },
      {
        id: "legal_residence_duration_spain",
        label: "¿Cuánto tiempo llevas con residencia legal en España?",
        type: "single_select",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "has_legal_residence_spain", operator: "equals", value: "Sí" }] },
        options: ["Menos de 1 año", "1-2 años", "Más de 2 años", "Más de 5 años", "Más de 10 años"],
      },
      {
        id: "long_absences_from_spain",
        label: "¿Has estado fuera de España durante periodos largos desde que tienes residencia?",
        type: "single_select",
        required: true,
        showIf: { mode: "all", conditions: [{ field: "has_legal_residence_spain", operator: "equals", value: "Sí" }] },
        options: ["No", "Sí, más de 3 meses seguidos", "Sí, varias salidas largas", "No lo sé"],
      },
      {
        id: "nationality_exams_status",
        label: "¿Has aprobado o preparado los exámenes CCSE/DELE si te aplican?",
        type: "single_select",
        required: false,
        options: ["Sí", "No", "Estoy preparándolos", "No sé si me aplican"],
      },
    ],
  },
  {
    id: "risk_expectations",
    title: "Riesgo, preparación y expectativas",
    description: "Cierra el diagnóstico con preferencias, nivel de ayuda y conversión.",
    questions: [
      {
        id: "main_obstacle",
        label: "¿Cuál crees que es tu mayor obstáculo ahora mismo?",
        type: "single_select",
        required: true,
        options: ["No sé qué visado elegir", "No tengo suficiente dinero", "No tengo documentos preparados", "No tengo oferta de trabajo", "No tengo carta de admisión", "Estoy irregular en España", "Tengo miedo a que me rechacen", "No sé por dónde empezar", "Otro"],
      },
      {
        id: "preparation_stage",
        label: "¿En qué punto estás?",
        type: "single_select",
        required: true,
        options: ["Solo estoy investigando", "Ya sé que quiero emigrar, pero no sé la vía", "Estoy reuniendo documentos", "Ya tengo parte del expediente", "Estoy listo/a para presentar", "Me rechazaron y quiero corregirlo"],
      },
      {
        id: "risk_preference",
        label: "¿Qué prefieres?",
        type: "single_select",
        required: true,
        options: ["La vía más segura aunque tarde más", "La vía más rápida aunque tenga más riesgo", "La vía más barata", "La vía que permita trabajar cuanto antes", "La vía que permita traer familia", "La vía que permita residencia estable"],
      },
      {
        id: "help_needed_level",
        label: "¿Cuánta ayuda necesitas?",
        type: "single_select",
        required: false,
        options: ["Solo quiero saber qué vía me conviene", "Quiero checklist y pasos", "Quiero ayuda revisando documentos", "Quiero acompañamiento completo", "Necesito hablar con un experto/legal"],
      },
      {
        id: "wants_full_diagnostic",
        label: "¿Quieres recibir un diagnóstico completo con score, riesgos, costes, checklist y próximos pasos?",
        type: "single_select",
        required: true,
        options: ["Sí", "No", "Quiero primero un resumen gratuito"],
      },
      {
        id: "final_confirmation",
        label: "Confirmo que los datos facilitados son correctos según mi conocimiento.",
        type: "checkbox",
        required: true,
      },
    ],
  },
];

function evaluateCondition(condition: Condition, answers: WizardAnswers): boolean {
  const current = answers[condition.field];

  switch (condition.operator) {
    case "equals":
      return current === condition.value;
    case "not_equals":
      return current !== undefined && current !== null && current !== "" && current !== condition.value;
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(current);
    case "not_in":
      return Array.isArray(condition.value) && !condition.value.includes(current);
    case "contains":
      if (Array.isArray(current)) return current.includes(condition.value);
      return String(current || "").includes(String(condition.value));
    case "exists":
      return current !== undefined && current !== null && current !== "" && !(Array.isArray(current) && current.length === 0);
    case "not_exists":
      return current === undefined || current === null || current === "" || (Array.isArray(current) && current.length === 0);
    case "gte":
      return Number(current) >= Number(condition.value);
    case "lte":
      return Number(current) <= Number(condition.value);
    case "gt":
      return Number(current) > Number(condition.value);
    case "lt":
      return Number(current) < Number(condition.value);
    default:
      return false;
  }
}

function evaluateLogicGroup(group: LogicGroup | undefined, answers: WizardAnswers): boolean {
  if (!group) return true;
  const results = group.conditions.map((condition) => evaluateCondition(condition, answers));
  return group.mode === "all" ? results.every(Boolean) : results.some(Boolean);
}

function getVisibleQuestions(block: QuestionBlock, answers: WizardAnswers): Question[] {
  return block.questions.filter((question) => evaluateLogicGroup(question.showIf, answers));
}

function isEmptyValue(value: any): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0) || value === false;
}

function answerIncludes(answers: WizardAnswers, field: string, value: string): boolean {
  const current = answers[field];
  return Array.isArray(current) ? current.includes(value) : current === value;
}

function calculateInternalAssessment(answers: WizardAnswers): InternalAssessment {
  const humanReviewReasons: string[] = [];
  const candidateRoutes = new Set<string>();

  const addHumanReview = (condition: boolean, reason: string) => {
    if (condition) humanReviewReasons.push(reason);
  };

  addHumanReview(["Sí", "No lo sé", "Prefiero explicarlo"].includes(answers.criminal_record), "Antecedentes penales/policiales o duda sobre ellos.");
  addHumanReview(answers.previous_denials && answers.previous_denials !== "No", "Denegación migratoria previa.");
  addHumanReview(answers.expulsion_or_ban && answers.expulsion_or_ban !== "No", "Posible expulsión, prohibición de entrada o sanción.");
  addHumanReview(answers.overstay_history === "Sí", "Historial de exceso de estancia Schengen/España.");
  addHumanReview(answers.protection_reason_exists && answers.protection_reason_exists !== "No", "Caso vinculado a protección internacional/asilo.");
  addHumanReview(answers.current_location === "En España en situación irregular", "Usuario en situación irregular en España.");
  addHumanReview(["En situación irregular", "Estancia caducada", "Turista con los 90 días vencidos"].includes(answers.spain_legal_status), "Situación legal en España de riesgo.");
  addHumanReview(answerIncludes(answers, "funds_origin", "No puedo justificarlo claramente"), "Fondos no justificables claramente.");
  addHumanReview(answers.intends_to_work_first_year === "Sí", "Posible incompatibilidad con residencia no lucrativa.");
  addHumanReview(["21-50%", "Más del 50%"].includes(answers.spanish_income_percentage), "Ingresos españoles superiores al umbral prudente para nómada digital.");
  addHumanReview(answers.employer_willing_to_sponsor === "No", "Empleador no dispuesto a tramitar autorización.");

  if (answers.migration_goal === "Estudiar" || answers.willing_to_study_in_spain !== "No") candidateRoutes.add("study_visa");
  if (answers.migration_goal === "Vivir en España sin trabajar") candidateRoutes.add("non_lucrative_residence");
  if (answers.migration_goal === "Teletrabajar para una empresa o clientes extranjeros" || (answers.remote_work && answers.remote_work !== "No")) candidateRoutes.add("digital_nomad_visa");
  if (answers.migration_goal === "Trabajar por cuenta ajena" || (answers.job_offer_spain && answers.job_offer_spain !== "No")) candidateRoutes.add("work_employee_visa");
  if (answers.migration_goal === "Trabajar como autónomo o emprender" || ["Sí", "Tal vez"].includes(answers.wants_self_employment)) candidateRoutes.add("self_employed_work");
  if (answers.migration_goal === "Regularizar mi situación en España" || ["En situación irregular", "Estancia caducada", "Turista con los 90 días vencidos"].includes(answers.spain_legal_status)) candidateRoutes.add("arraigo_regularization");
  if (answers.migration_goal === "Reunirme con familiares" || (answers.family_in_spain_or_eu && answers.family_in_spain_or_eu !== "No")) candidateRoutes.add("family_reunification");
  if (answers.family_member_status === "Español/a" || answers.family_member_status === "Ciudadano/a de la Unión Europea") candidateRoutes.add("eu_spanish_family_member");
  if (answers.migration_goal === "Solicitar protección internacional/asilo") candidateRoutes.add("asylum_protection");
  if (answers.migration_goal === "Obtener nacionalidad española" || (answers.spanish_ancestry && answers.spanish_ancestry !== "No")) candidateRoutes.add("nationality");
  if (candidateRoutes.size === 0) candidateRoutes.add("manual_triage_required");

  let economicRisk: InternalAssessment["economic_risk_level"] = "low";
  if (["Menos de 2.000 €", "2.000 € - 5.000 €"].includes(answers.savings_eur_range)) economicRisk = "high";
  if (["Menos de 3.000 €", "3.000 € - 6.000 €"].includes(answers.total_budget_eur_range)) economicRisk = "high";
  if (answers.financial_buffer === "No, voy muy justo") economicRisk = "critical";
  if (answerIncludes(answers, "funds_origin", "No puedo justificarlo claramente")) economicRisk = "critical";
  if (["8.000 € - 12.000 €", "12.000 € - 20.000 €"].includes(answers.savings_eur_range)) economicRisk = economicRisk === "low" ? "medium" : economicRisk;

  let documentationRisk: InternalAssessment["documentation_risk_level"] = "low";
  if (answers.passport_valid && answers.passport_valid !== "Sí, con más de 12 meses de vigencia") documentationRisk = "high";
  if (["No", "No lo sé"].includes(answers.health_insurance)) documentationRisk = "high";
  if (["No lo sé", "Sí, pero todavía no los he apostillado/legalizado"].includes(answers.apostille_status)) documentationRisk = "medium";
  if (answers.criminal_record_certificate_available === "No") documentationRisk = "critical";
  if (answers.study_center_accredited === "No") documentationRisk = "critical";

  let legalRisk: InternalAssessment["legal_risk_level"] = "low";
  if (humanReviewReasons.length > 0) legalRisk = "high";
  if (answers.expulsion_or_ban === "Sí" || answers.criminal_record === "Sí") legalRisk = "critical";

  let urgencyRisk: InternalAssessment["urgency_risk_level"] = "low";
  if (["Inmediatamente", "En menos de 1 mes"].includes(answers.urgency)) urgencyRisk = "high";
  else if (["En 1 a 3 meses"].includes(answers.urgency)) urgencyRisk = "medium";

  return {
    requires_human_review: humanReviewReasons.length > 0,
    human_review_reasons: humanReviewReasons,
    main_candidate_routes: Array.from(candidateRoutes),
    economic_risk_level: economicRisk,
    documentation_risk_level: documentationRisk,
    legal_risk_level: legalRisk,
    urgency_risk_level: urgencyRisk,
  };
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function QuestionField({
  question,
  value,
  onChange,
  error,
}: {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}) {
  const baseInputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200";

  const label = (
    <label className="mb-2 block text-sm font-semibold text-slate-900">
      {question.label}
      {question.required && <span className="ml-1 text-red-600">*</span>}
      {!question.required && question.optionalButRecommended && <span className="ml-2 text-xs font-normal text-amber-700">recomendable</span>}
      {!question.required && !question.optionalButRecommended && <span className="ml-2 text-xs font-normal text-slate-400">opcional</span>}
    </label>
  );

  const help = question.helpText ? <p className="mt-2 text-xs text-slate-500">{question.helpText}</p> : null;
  const errorMessage = error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null;

  if (question.type === "checkbox") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <span className="text-sm font-medium leading-6 text-slate-900">
            {question.label}
            {question.required && <span className="ml-1 text-red-600">*</span>}
          </span>
        </label>
        {help}
        {errorMessage}
      </div>
    );
  }

  if (question.type === "textarea") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {label}
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          rows={4}
          className={baseInputClass}
        />
        {help}
        {errorMessage}
      </div>
    );
  }

  if (["text", "email", "tel", "number", "date"].includes(question.type)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {label}
        <input
          type={question.type === "single_select" || question.type === "multi_select" ? "text" : question.type}
          value={value || ""}
          onChange={(e) => onChange(question.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
          placeholder={question.placeholder}
          className={baseInputClass}
        />
        {help}
        {errorMessage}
      </div>
    );
  }

  if (question.type === "single_select") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {label}
        <div className="grid gap-2 sm:grid-cols-2">
          {(question.options || []).map((option) => {
            const selected = value === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onChange(option)}
                className={classNames(
                  "rounded-xl border px-4 py-3 text-left text-sm transition",
                  selected
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
        {help}
        {errorMessage}
      </div>
    );
  }

  if (question.type === "multi_select") {
    const currentValues = Array.isArray(value) ? value : [];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {label}
        <div className="grid gap-2 sm:grid-cols-2">
          {(question.options || []).map((option) => {
            const selected = currentValues.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  if (selected) onChange(currentValues.filter((item) => item !== option));
                  else onChange([...currentValues, option]);
                }}
                className={classNames(
                  "rounded-xl border px-4 py-3 text-left text-sm transition",
                  selected
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
        {help}
        {errorMessage}
      </div>
    );
  }

  return null;
}

export default function QuickEmigrateWizardForm({ initialAnswers = {}, onSubmit }: QuickEmigrateWizardFormProps) {
  const [answers, setAnswers] = useState<WizardAnswers>(initialAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const visibleBlocks = useMemo(
    () => QUESTION_BLOCKS.filter((block) => evaluateLogicGroup(block.showIf, answers) && getVisibleQuestions(block, answers).length > 0),
    [answers]
  );

  const currentStepIndex = Math.min(stepIndex, Math.max(visibleBlocks.length - 1, 0));
  const currentBlock = visibleBlocks[currentStepIndex];
  const currentQuestions = currentBlock ? getVisibleQuestions(currentBlock, answers) : [];
  const internalAssessment = useMemo(() => calculateInternalAssessment(answers), [answers]);

  const progress = visibleBlocks.length > 0 ? Math.round(((currentStepIndex + 1) / visibleBlocks.length) * 100) : 0;

  const updateAnswer = (field: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateCurrentStep = () => {
    const nextErrors: Record<string, string> = {};
    currentQuestions.forEach((question) => {
      if (question.required && isEmptyValue(answers[question.id])) {
        nextErrors[question.id] = "Esta pregunta es obligatoria.";
      }
      if (question.type === "email" && answers[question.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(answers[question.id]))) nextErrors[question.id] = "Introduce un email válido.";
      }
      if (question.type === "number" && answers[question.id] !== undefined && answers[question.id] !== "") {
        if (Number.isNaN(Number(answers[question.id]))) nextErrors[question.id] = "Introduce un número válido.";
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    setStepIndex((prev) => Math.min(prev + 1, visibleBlocks.length - 1));
    window?.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
    window?.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    const payload = {
      answers,
      internalAssessment,
      visibleBlocks: visibleBlocks.map((block) => block.id),
      submittedAt: new Date().toISOString(),
    };

    if (onSubmit) await onSubmit(payload);
    setSubmitted(true);
  };

  if (!currentBlock) {
    return <div className="rounded-2xl border border-slate-200 p-6 text-slate-700">No hay preguntas disponibles.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-slate-900">
      <div className="mb-8 rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
        <p className="text-sm font-medium text-slate-300">Quick Emigrate</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Diagnóstico migratorio personalizado</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Formulario adaptativo para detectar vía migratoria, riesgos, documentos faltantes y necesidad de revisión humana.
        </p>
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
            <span>
              Paso {currentStepIndex + 1} de {visibleBlocks.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Riesgo legal</p>
          <p className="mt-1 text-sm font-bold uppercase">{internalAssessment.legal_risk_level}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Riesgo económico</p>
          <p className="mt-1 text-sm font-bold uppercase">{internalAssessment.economic_risk_level}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Riesgo documental</p>
          <p className="mt-1 text-sm font-bold uppercase">{internalAssessment.documentation_risk_level}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Revisión humana</p>
          <p className="mt-1 text-sm font-bold uppercase">{internalAssessment.requires_human_review ? "Sí" : "No"}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{currentBlock.id}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{currentBlock.title}</h2>
          {currentBlock.description && <p className="mt-2 text-sm leading-6 text-slate-600">{currentBlock.description}</p>}
        </div>

        <div className="space-y-4">
          {currentQuestions.map((question) => (
            <QuestionField
              key={question.id}
              question={question}
              value={answers[question.id]}
              error={errors[question.id]}
              onChange={(value) => updateAnswer(question.id, value)}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Atrás
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => downloadJson("quick-emigrate-draft-answers.json", { answers, internalAssessment })}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              Exportar borrador JSON
            </button>

            {currentStepIndex < visibleBlocks.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Generar diagnóstico
              </button>
            )}
          </div>
        </div>
      </div>

      {submitted && (
        <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950 shadow-sm">
          <h3 className="text-lg font-bold">Formulario enviado correctamente</h3>
          <p className="mt-2 text-sm leading-6">
            Las respuestas están listas para enviarse a Firebase, una API o una Cloud Function de scoring.
          </p>
          <div className="mt-4 rounded-2xl bg-white p-4 text-sm">
            <p className="font-semibold">Rutas candidatas:</p>
            <p className="mt-1 text-slate-700">{internalAssessment.main_candidate_routes.join(", ")}</p>
            {internalAssessment.requires_human_review && (
              <>
                <p className="mt-4 font-semibold">Motivos de revisión humana:</p>
                <ul className="mt-2 list-disc pl-5 text-slate-700">
                  {internalAssessment.human_review_reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              downloadJson("quick-emigrate-final-diagnostic-input.json", {
                answers,
                internalAssessment,
                visibleBlocks: visibleBlocks.map((block) => block.id),
                submittedAt: new Date().toISOString(),
              })
            }
            className="mt-4 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            Descargar JSON final
          </button>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
        <strong>Importante:</strong> este formulario no debe prometer aprobación ni probabilidad legal exacta. El resultado debe mostrarse como diagnóstico orientativo, score de viabilidad y nivel de riesgo. Los casos sensibles deben pasar a revisión humana.
      </div>
    </div>
  );
}
