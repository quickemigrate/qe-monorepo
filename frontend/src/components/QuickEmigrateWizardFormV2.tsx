import { useMemo, useState } from "react"

type Primitive = string | number | boolean | null | undefined
type AnswerValue = Primitive | string[]
type Answers = Record<string, AnswerValue>
type QuestionType = "text" | "email" | "tel" | "number" | "date" | "textarea" | "single" | "multi" | "checkbox"

type Option = { label: string; value: string }
type Condition =
  | { field: string; op: "eq" | "neq" | "in" | "notEmpty" | "isSpain" | "gte" | "lte"; value?: string | number | boolean | string[] }
  | { any: Condition[] }
  | { all: Condition[] }

type Question = {
  id: string
  label: string
  type: QuestionType
  required?: boolean
  optional?: boolean
  placeholder?: string
  helpText?: string
  options?: Option[]
  showIf?: Condition
}

type Step = { id: string; title: string; description?: string; questions: Question[] }

export type DiagnosticMeta = {
  requiresHumanReview: boolean
  humanReviewReasons: string[]
  candidateRoutes: string[]
  economicRiskLevel: "low" | "medium" | "high" | "critical"
  documentationRiskLevel: "low" | "medium" | "high" | "critical"
  legalRiskLevel: "low" | "medium" | "high" | "critical"
  urgencyRiskLevel: "low" | "medium" | "high"
  completionMode: "basic" | "enhanced"
}

export type SubmitPayload = { answers: Answers; meta: DiagnosticMeta; submittedAt: string }
type Props = { onSubmit?: (payload: SubmitPayload) => void | Promise<void> }

const latamCountries = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador", "El Salvador",
  "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú",
  "República Dominicana", "Uruguay", "Venezuela", "Otra",
].map((x) => ({ label: x, value: x }))

const yesNoUnknown: Option[] = [
  { label: "Sí", value: "yes" },
  { label: "No", value: "no" },
  { label: "No lo sé", value: "unknown" },
]

const spainCities = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga", "Alicante",
  "Zaragoza", "Bilbao", "Murcia", "Otra", "No lo sé todavía",
].map((x) => ({ label: x, value: x }))

const coreSteps: Step[] = [
  {
    id: "legal",
    title: "Aviso y consentimiento",
    description: "Antes de empezar, confirma que entiendes el alcance del diagnóstico.",
    questions: [
      { id: "diagnostic_disclaimer_accepted", label: "Acepto que este diagnóstico es orientativo y no constituye asesoramiento legal ni garantiza la aprobación de ningún visado o autorización.", type: "checkbox", required: true },
      { id: "diagnostic_data_consent", label: "Autorizo a Quick Emigrate a usar la información proporcionada para generar un diagnóstico migratorio personalizado.", type: "checkbox", required: true },
    ],
  },
  {
    id: "basic",
    title: "Datos básicos",
    description: "Preguntas imprescindibles para identificar tu caso.",
    questions: [
      { id: "name", label: "¿Cuál es tu nombre?", type: "text", required: true, placeholder: "Ej. Carlos" },
      { id: "email", label: "¿Cuál es tu correo electrónico?", type: "email", required: true, placeholder: "correo@ejemplo.com" },
      { id: "phone", label: "¿Cuál es tu número de WhatsApp o teléfono?", type: "tel", placeholder: "+57 300 000 0000", helpText: "Opcional. Sirve para seguimiento comercial." },
      { id: "age", label: "¿Cuántos años tienes?", type: "number", required: true },
      { id: "nationality", label: "¿Cuál es tu nacionalidad?", type: "single", required: true, options: latamCountries },
      { id: "second_nationality_exists", label: "¿Tienes otra nacionalidad además de la anterior?", type: "single", required: true, options: [{ label: "No", value: "no" }, { label: "Sí", value: "yes" }, { label: "No lo sé", value: "unknown" }] },
      { id: "second_nationality", label: "¿Cuál es tu segunda nacionalidad?", type: "text", required: true, showIf: { field: "second_nationality_exists", op: "eq", value: "yes" } },
    ],
  },
  {
    id: "location",
    title: "Situación actual",
    description: "Determina si se puede tramitar desde España, consulado o si hay riesgos de irregularidad.",
    questions: [
      { id: "country_of_residence", label: "¿En qué país resides actualmente?", type: "single", required: true, options: latamCountries },
      { id: "current_city", label: "¿En qué ciudad resides actualmente?", type: "text", required: true },
      { id: "current_location", label: "¿Dónde estás actualmente?", type: "single", required: true, options: [
        { label: "En mi país de origen", value: "origin_country" },
        { label: "En otro país fuera de España", value: "third_country" },
        { label: "En España como turista", value: "spain_tourist" },
        { label: "En España con visado de estudios", value: "spain_student" },
        { label: "En España con residencia legal", value: "spain_resident" },
        { label: "En España en situación irregular", value: "spain_irregular" },
        { label: "En España como solicitante de asilo/protección internacional", value: "spain_asylum_applicant" },
        { label: "En España con estancia caducada", value: "spain_expired_stay" },
        { label: "No lo sé exactamente", value: "unknown" },
      ]},
      { id: "spain_entry_date", label: "Si estás actualmente en España, ¿en qué fecha entraste?", type: "date", required: true, showIf: { field: "current_location", op: "isSpain" } },
      { id: "spain_legal_status", label: "Si estás en España, ¿cuál es tu situación actual?", type: "single", required: true, showIf: { field: "current_location", op: "isSpain" }, options: [
        { label: "Turista dentro de los 90 días", value: "tourist_within_90" },
        { label: "Turista con los 90 días vencidos", value: "tourist_over_90" },
        { label: "Estudiante", value: "student" },
        { label: "Residente legal", value: "resident" },
        { label: "Solicitante de asilo", value: "asylum_applicant" },
        { label: "En situación irregular", value: "irregular" },
        { label: "Estancia caducada", value: "expired_stay" },
        { label: "No lo sé", value: "unknown" },
      ]},
      { id: "target_city_spain", label: "¿En qué ciudad o provincia de España estás o quieres vivir?", type: "single", required: true, options: spainCities },
    ],
  },
  {
    id: "goal",
    title: "Objetivo migratorio",
    description: "Elegimos la ruta según tu objetivo real.",
    questions: [
      { id: "migration_goal", label: "¿Cuál es tu objetivo principal en España?", type: "single", required: true, options: [
        { label: "Estudiar", value: "study" },
        { label: "Trabajar por cuenta ajena", value: "work_employee" },
        { label: "Trabajar como autónomo o emprender", value: "self_employed" },
        { label: "Teletrabajar para empresa o clientes extranjeros", value: "remote_work" },
        { label: "Vivir en España sin trabajar", value: "non_lucrative" },
        { label: "Reunirme con familiares", value: "family" },
        { label: "Regularizar mi situación en España", value: "regularize" },
        { label: "Solicitar protección internacional/asilo", value: "asylum" },
        { label: "Obtener nacionalidad española", value: "nationality" },
        { label: "No lo tengo claro, quiero saber qué opción me conviene", value: "not_sure" },
      ]},
      { id: "main_priority", label: "¿Qué es más importante para ti ahora mismo?", type: "single", required: true, options: [
        { label: "Entrar legalmente en España", value: "enter_legally" },
        { label: "Conseguir permiso para trabajar", value: "work_permit" },
        { label: "Regularizarme lo antes posible", value: "regularize_fast" },
        { label: "Estudiar y luego trabajar", value: "study_then_work" },
        { label: "Traer a mi familia", value: "bring_family" },
        { label: "Vivir en España sin trabajar", value: "live_without_working" },
        { label: "Ahorrar costes", value: "reduce_cost" },
        { label: "Reducir el riesgo de rechazo", value: "reduce_rejection_risk" },
        { label: "Llegar lo antes posible", value: "fast_arrival" },
        { label: "Conseguir residencia estable a largo plazo", value: "stable_residence" },
      ]},
      { id: "urgency", label: "¿Cuándo quieres iniciar el proceso o viajar a España?", type: "single", required: true, options: [
        { label: "Inmediatamente", value: "immediate" },
        { label: "En menos de 1 mes", value: "less_1_month" },
        { label: "En 1 a 3 meses", value: "1_3_months" },
        { label: "En 3 a 6 meses", value: "3_6_months" },
        { label: "En 6 a 12 meses", value: "6_12_months" },
        { label: "En más de 12 meses", value: "more_12_months" },
        { label: "Ya estoy en España", value: "already_in_spain" },
      ]},
      { id: "risk_preference", label: "¿Qué prefieres?", type: "single", required: true, options: [
        { label: "La vía más segura aunque tarde más", value: "safe" },
        { label: "La vía más rápida aunque tenga más riesgo", value: "fast" },
        { label: "La vía más barata", value: "cheap" },
        { label: "La vía que permita trabajar cuanto antes", value: "work_soon" },
        { label: "La vía que permita traer familia", value: "family" },
        { label: "La vía que permita residencia estable", value: "stable" },
      ]},
    ],
  },
  {
    id: "money_family",
    title: "Familia y economía",
    description: "Calculamos riesgo económico y requisitos de fondos.",
    questions: [
      { id: "marital_status", label: "¿Cuál es tu estado civil?", type: "single", required: true, options: [
        { label: "Soltero/a", value: "single" }, { label: "Casado/a", value: "married" },
        { label: "Pareja de hecho registrada", value: "registered_partner" },
        { label: "Pareja no registrada", value: "unregistered_partner" },
        { label: "Divorciado/a", value: "divorced" }, { label: "Viudo/a", value: "widowed" },
      ]},
      { id: "family_accompanying", label: "¿Viajarías solo/a o con familiares?", type: "single", required: true, options: [
        { label: "Viajaría solo/a", value: "alone" }, { label: "Con pareja", value: "partner" },
        { label: "Con hijos", value: "children" }, { label: "Con pareja e hijos", value: "partner_children" },
        { label: "Con padres u otros familiares", value: "parents_or_others" }, { label: "No lo sé todavía", value: "unknown" },
      ]},
      { id: "dependents_count", label: "¿Cuántas personas dependerían económicamente de ti en España?", type: "number", required: true, placeholder: "0" },
      { id: "savings_eur_range", label: "¿Cuánto dinero tienes disponible actualmente para el proceso migratorio?", type: "single", required: true, options: [
        { label: "Menos de 2.000 €", value: "lt_2000" }, { label: "2.000 € - 5.000 €", value: "2000_5000" },
        { label: "5.000 € - 8.000 €", value: "5000_8000" }, { label: "8.000 € - 12.000 €", value: "8000_12000" },
        { label: "12.000 € - 20.000 €", value: "12000_20000" }, { label: "20.000 € - 40.000 €", value: "20000_40000" },
        { label: "Más de 40.000 €", value: "gt_40000" },
      ]},
      { id: "monthly_income_eur_range", label: "¿Cuáles son tus ingresos mensuales aproximados?", type: "single", required: true, options: [
        { label: "Sin ingresos", value: "0" }, { label: "Menos de 500 €", value: "lt_500" },
        { label: "500 € - 1.000 €", value: "500_1000" }, { label: "1.000 € - 2.000 €", value: "1000_2000" },
        { label: "2.000 € - 3.000 €", value: "2000_3000" }, { label: "3.000 € - 5.000 €", value: "3000_5000" },
        { label: "Más de 5.000 €", value: "gt_5000" },
      ]},
      { id: "funds_origin", label: "¿De dónde provienen tus fondos?", type: "multi", required: true, options: [
        { label: "Salario", value: "salary" }, { label: "Ahorros personales", value: "personal_savings" },
        { label: "Apoyo familiar", value: "family_support" }, { label: "Venta de bienes", value: "asset_sale" },
        { label: "Rentas de alquiler", value: "rental_income" }, { label: "Pensión", value: "pension" },
        { label: "Dividendos/inversiones", value: "investments" }, { label: "Préstamo", value: "loan" },
        { label: "Trabajo informal", value: "informal_work" }, { label: "No puedo justificarlo claramente", value: "unclear" },
      ]},
      { id: "bank_history_3_6_months", label: "¿Puedes demostrar movimientos bancarios estables de los últimos 3 a 6 meses?", type: "single", required: true, options: [
        { label: "Sí", value: "yes" }, { label: "No", value: "no" },
        { label: "Parcialmente", value: "partial" }, { label: "No lo sé", value: "unknown" },
      ]},
    ],
  },
  {
    id: "education_work",
    title: "Formación y trabajo",
    description: "Preguntas mínimas para abrir o cerrar rutas de estudios, trabajo y nómada digital.",
    questions: [
      { id: "education_level", label: "¿Cuál es tu nivel educativo máximo completado?", type: "single", required: true, options: [
        { label: "Secundaria incompleta", value: "secondary_incomplete" }, { label: "Secundaria completa", value: "secondary" },
        { label: "Técnico / formación profesional", value: "vocational" }, { label: "Universitario incompleto", value: "university_incomplete" },
        { label: "Grado universitario", value: "university_degree" }, { label: "Máster", value: "master" },
        { label: "Doctorado", value: "phd" }, { label: "Otro", value: "other" },
      ]},
      { id: "study_area", label: "¿En qué área te formaste?", type: "single", required: true, options: [
        { label: "Salud", value: "health" }, { label: "Ingeniería", value: "engineering" },
        { label: "Informática / tecnología", value: "tech" }, { label: "Administración / finanzas", value: "business_finance" },
        { label: "Derecho", value: "law" }, { label: "Educación", value: "education" },
        { label: "Arquitectura", value: "architecture" }, { label: "Construcción", value: "construction" },
        { label: "Hostelería / turismo", value: "hospitality" }, { label: "Comercio / ventas", value: "sales" },
        { label: "Arte / diseño", value: "art_design" }, { label: "Otro", value: "other" },
      ]},
      { id: "employment_status", label: "¿Cuál es tu situación laboral actual?", type: "single", required: true, options: [
        { label: "Empleado/a", value: "employed" }, { label: "Autónomo/a", value: "self_employed" },
        { label: "Empresario/a", value: "business_owner" }, { label: "Desempleado/a", value: "unemployed" },
        { label: "Estudiante", value: "student" }, { label: "Trabajo informal", value: "informal_work" },
        { label: "Jubilado/a", value: "retired" }, { label: "Otro", value: "other" },
      ]},
      { id: "current_profession", label: "¿Cuál es tu profesión u ocupación actual?", type: "text", required: true, placeholder: "Ej. enfermera, programador, camarero..." },
      { id: "years_experience", label: "¿Cuántos años de experiencia laboral tienes?", type: "single", required: true, options: [
        { label: "Menos de 1 año", value: "lt_1" }, { label: "1-2 años", value: "1_2" },
        { label: "3-5 años", value: "3_5" }, { label: "6-10 años", value: "6_10" },
        { label: "Más de 10 años", value: "gt_10" },
      ]},
      { id: "willing_to_study_in_spain", label: "¿Estarías dispuesto/a a estudiar en España si fuese la vía más viable?", type: "single", required: true, options: [
        { label: "Sí", value: "yes" }, { label: "No", value: "no" },
        { label: "Tal vez, si es la vía más segura", value: "maybe_safe" },
        { label: "Solo si puedo trabajar mientras estudio", value: "only_if_can_work" },
        { label: "Solo si el coste es asumible", value: "only_if_affordable" },
      ]},
      { id: "admission_letter", label: "¿Ya tienes carta de admisión o matrícula en algún centro de estudios en España?", type: "single", required: true, options: [
        { label: "Sí, carta de admisión", value: "admission_letter" }, { label: "Sí, matrícula pagada", value: "enrollment_paid" },
        { label: "No, pero estoy buscando centro", value: "searching" }, { label: "No", value: "no" },
        { label: "No aplica", value: "not_applicable" },
      ]},
      { id: "job_offer_spain", label: "¿Tienes una oferta de trabajo o contrato de una empresa española?", type: "single", required: true, options: [
        { label: "No", value: "no" }, { label: "Sí, oferta informal", value: "informal_offer" },
        { label: "Sí, oferta formal", value: "formal_offer" }, { label: "Sí, contrato firmado", value: "signed_contract" },
        { label: "Estoy en entrevistas", value: "interviews" },
      ]},
      { id: "remote_work", label: "¿Trabajas en remoto para una empresa extranjera o clientes fuera de España?", type: "single", required: true, options: [
        { label: "No", value: "no" }, { label: "Sí, empleado/a para empresa extranjera", value: "foreign_employee" },
        { label: "Sí, freelance con clientes extranjeros", value: "foreign_freelance" },
        { label: "Sí, tengo ambos", value: "both" }, { label: "No ahora, pero podría conseguirlo", value: "could_get_it" },
      ]},
      { id: "wants_self_employment", label: "¿Quieres montar un negocio o trabajar como autónomo en España?", type: "single", required: true, options: [
        { label: "Sí", value: "yes" }, { label: "No", value: "no" }, { label: "Tal vez", value: "maybe" },
      ]},
    ],
  },
  {
    id: "documents_risks",
    title: "Documentación y riesgos críticos",
    description: "Evita recomendar una vía inviable o demasiado arriesgada.",
    questions: [
      { id: "passport_valid", label: "¿Tienes pasaporte vigente?", type: "single", required: true, options: [
        { label: "Sí, con más de 12 meses de vigencia", value: "valid_12_plus" },
        { label: "Sí, pero vence en menos de 12 meses", value: "valid_under_12" },
        { label: "No", value: "no" }, { label: "Está en trámite", value: "in_process" },
      ]},
      { id: "health_insurance", label: "¿Tienes seguro médico válido para España?", type: "single", required: true, options: [
        { label: "Sí, seguro privado sin copagos", value: "valid_no_copay" },
        { label: "Sí, pero no sé si sirve para extranjería", value: "unknown_if_valid" },
        { label: "No", value: "no" }, { label: "Estoy comparando opciones", value: "comparing" },
      ]},
      { id: "previous_denials", label: "¿Te han denegado antes un visado, residencia, asilo o trámite migratorio?", type: "single", required: true, options: [
        { label: "No", value: "no" }, { label: "Sí, en España", value: "spain" },
        { label: "Sí, en otro país Schengen", value: "schengen" },
        { label: "Sí, en otro país no Schengen", value: "other_country" }, { label: "No lo sé", value: "unknown" },
      ]},
      { id: "previous_denial_reason", label: "¿Qué trámite te denegaron, cuándo y cuál fue el motivo?", type: "textarea", required: true, showIf: { field: "previous_denials", op: "neq", value: "no" } },
      { id: "criminal_record", label: "¿Tienes antecedentes penales o policiales en algún país?", type: "single", required: true, options: [
        { label: "No", value: "no" }, { label: "Sí", value: "yes" },
        { label: "No lo sé", value: "unknown" }, { label: "Prefiero explicarlo", value: "explain" },
      ]},
      { id: "criminal_record_details", label: "¿En qué país, por qué motivo y en qué año?", type: "textarea", required: true, showIf: { field: "criminal_record", op: "in", value: ["yes", "unknown", "explain"] } },
      { id: "expulsion_or_ban", label: "¿Tienes alguna orden de expulsión, prohibición de entrada o procedimiento sancionador abierto?", type: "single", required: true, options: yesNoUnknown },
      { id: "main_obstacle", label: "¿Cuál crees que es tu mayor obstáculo ahora mismo?", type: "single", required: true, options: [
        { label: "No sé qué visado elegir", value: "unknown_route" }, { label: "No tengo suficiente dinero", value: "money" },
        { label: "No tengo documentos preparados", value: "documents" }, { label: "No tengo oferta de trabajo", value: "no_job_offer" },
        { label: "No tengo carta de admisión", value: "no_admission" }, { label: "Estoy irregular en España", value: "irregular" },
        { label: "Tengo miedo a que me rechacen", value: "rejection_fear" }, { label: "No sé por dónde empezar", value: "no_start" },
        { label: "Otro", value: "other" },
      ]},
    ],
  },
]

const adaptiveSteps: Step[] = [
  { id: "study", title: "Módulo de estudios", description: "Solo aparece si estudiar es objetivo o alternativa razonable.", questions: [
    { id: "study_program_type", label: "¿Qué tipo de estudios son o quieres realizar?", type: "single", required: true, options: [
      { label: "Grado universitario", value: "university_degree" }, { label: "Máster", value: "master" },
      { label: "Doctorado", value: "phd" }, { label: "FP Grado Medio", value: "fp_medium" },
      { label: "FP Grado Superior", value: "fp_high" }, { label: "Curso de idiomas", value: "language_course" },
      { label: "Certificado profesional", value: "professional_certificate" }, { label: "Curso privado", value: "private_course" },
      { label: "Otro", value: "other" },
    ]},
    { id: "study_duration_months", label: "¿Cuánto duraría el programa de estudios?", type: "number", required: true },
    { id: "study_modality", label: "¿Cuál sería la modalidad de los estudios?", type: "single", required: true, options: [
      { label: "Presencial", value: "presential" }, { label: "Semipresencial", value: "hybrid" },
      { label: "Online", value: "online" }, { label: "No lo sé", value: "unknown" },
    ]},
    { id: "study_center_accredited", label: "¿El centro está autorizado/acreditado oficialmente en España?", type: "single", required: true, options: yesNoUnknown },
    { id: "study_to_work_transition_goal", label: "¿Tu intención después de estudiar es quedarte a trabajar en España?", type: "single", required: true, options: [
      { label: "Sí", value: "yes" }, { label: "No", value: "no" }, { label: "Tal vez", value: "maybe" }, { label: "No lo sé", value: "unknown" },
    ]},
  ]},
  { id: "non_lucrative", title: "Módulo de residencia no lucrativa", description: "Solo aparece si quieres vivir sin trabajar o encajas por patrimonio/ingresos.", questions: [
    { id: "can_live_without_working_one_year", label: "¿Puedes mantenerte en España durante el primer año sin trabajar?", type: "single", required: true, options: yesNoUnknown },
    { id: "passive_income_sources", label: "¿Cuál es la fuente principal de tus ingresos o patrimonio?", type: "multi", required: true, options: [
      { label: "Pensión", value: "pension" }, { label: "Rentas de alquiler", value: "rent" },
      { label: "Dividendos/inversiones", value: "investments" }, { label: "Ahorros acumulados", value: "savings" },
      { label: "Venta de bienes", value: "asset_sale" }, { label: "Apoyo familiar", value: "family_support" },
      { label: "Trabajo activo", value: "active_work" }, { label: "Teletrabajo", value: "remote_work" },
      { label: "Otro", value: "other" },
    ]},
    { id: "intends_to_work_first_year", label: "¿Tu intención real es trabajar en España durante el primer año?", type: "single", required: true, options: [
      { label: "No", value: "no" }, { label: "Sí", value: "yes" }, { label: "Tal vez", value: "maybe" }, { label: "No lo sé", value: "unknown" },
    ]},
  ]},
  { id: "remote", title: "Módulo de nómada digital", description: "Solo aparece si trabajas o puedes trabajar en remoto para empresa/clientes extranjeros.", questions: [
    { id: "remote_income_monthly_eur", label: "¿Cuánto ingresas al mes por trabajo remoto?", type: "number", required: true },
    { id: "remote_work_proof", label: "¿Puedes acreditar contrato, facturas, clientes o relación profesional estable?", type: "single", required: true, options: [
      { label: "Sí", value: "yes" }, { label: "No", value: "no" }, { label: "Parcialmente", value: "partial" }, { label: "No lo sé", value: "unknown" },
    ]},
    { id: "spanish_income_percentage", label: "¿Qué porcentaje de tus ingresos vendría de clientes o empresas españolas?", type: "single", required: true, options: [
      { label: "0%", value: "0" }, { label: "1-20%", value: "1_20" }, { label: "21-50%", value: "21_50" },
      { label: "Más del 50%", value: "gt_50" }, { label: "No lo sé", value: "unknown" },
    ]},
  ]},
  { id: "work_employee", title: "Módulo de trabajo por cuenta ajena", description: "Solo aparece si tienes oferta o quieres empleo en empresa española.", questions: [
    { id: "employer_willing_to_sponsor", label: "¿La empresa está dispuesta a tramitar tu autorización de trabajo?", type: "single", required: true, options: yesNoUnknown },
    { id: "employer_solvency", label: "¿La empresa puede demostrar solvencia y estar al corriente con Hacienda y Seguridad Social?", type: "single", required: true, options: yesNoUnknown },
    { id: "sne_exception_possible", label: "¿La oferta tiene exención de la Situación Nacional de Empleo o es de difícil cobertura?", type: "single", required: true, options: yesNoUnknown },
    { id: "job_salary_gross_annual_eur", label: "¿Cuál sería el salario bruto anual aproximado?", type: "number", placeholder: "Opcional" },
  ]},
  { id: "self_employed", title: "Módulo de cuenta propia / emprendimiento", description: "Solo aparece si quieres autónomo o negocio.", questions: [
    { id: "business_plan_status", label: "¿Tienes plan de negocio, clientes, financiación o actividad previa demostrable?", type: "multi", required: true, options: [
      { label: "Tengo plan de negocio", value: "business_plan" }, { label: "Tengo clientes", value: "clients" },
      { label: "Tengo financiación", value: "funding" }, { label: "Tengo actividad previa demostrable", value: "previous_activity" },
      { label: "Tengo experiencia en el sector", value: "experience" }, { label: "No tengo nada preparado todavía", value: "nothing_ready" },
    ]},
    { id: "self_employment_activity", label: "¿Qué actividad quieres realizar en España?", type: "textarea", required: true },
    { id: "business_requires_license", label: "¿Tu actividad requiere licencia, local, colegiación o autorización administrativa?", type: "single", required: true, options: yesNoUnknown },
  ]},
  { id: "regularization", title: "Módulo de arraigo / regularización", description: "Solo aparece si estás irregular, con estancia vencida o quieres regularizarte.", questions: [
    { id: "continuous_stay_spain", label: "¿Cuánto tiempo llevas viviendo de forma continuada en España?", type: "single", required: true, options: [
      { label: "Menos de 6 meses", value: "lt_6_months" }, { label: "6-12 meses", value: "6_12_months" },
      { label: "1-2 años", value: "1_2_years" }, { label: "2-3 años", value: "2_3_years" },
      { label: "Más de 3 años", value: "gt_3_years" },
    ]},
    { id: "proof_of_continuous_stay", label: "¿Puedes demostrar tu permanencia en España con documentos?", type: "multi", required: true, options: [
      { label: "Empadronamiento", value: "empadronamiento" }, { label: "Facturas", value: "bills" },
      { label: "Contrato de alquiler", value: "rental_contract" }, { label: "Historial médico", value: "medical_history" },
      { label: "Movimientos bancarios", value: "bank_movements" }, { label: "Cursos o matrículas", value: "courses" },
      { label: "Tengo algunas pruebas", value: "some_proof" }, { label: "No tengo pruebas", value: "no_proof" },
    ]},
    { id: "has_empadronamiento", label: "¿Tienes empadronamiento en España?", type: "single", required: true, options: [
      { label: "Sí", value: "yes" }, { label: "No", value: "no" },
      { label: "Lo tuve antes", value: "had_before" }, { label: "No lo sé", value: "unknown" },
    ]},
    { id: "regularization_anchor", label: "¿Tienes o podrías conseguir una oferta de trabajo o matrícula en formación?", type: "single", required: true, options: [
      { label: "Oferta de trabajo", value: "job_offer" }, { label: "Matrícula en formación", value: "training_enrollment" },
      { label: "Ambas", value: "both" }, { label: "Ninguna", value: "none" }, { label: "No lo sé", value: "unknown" },
    ]},
  ]},
  { id: "family", title: "Módulo familiar", description: "Solo aparece si hay familia en España/UE, reagrupación o ascendencia española.", questions: [
    { id: "family_in_spain_or_eu", label: "¿Tienes familiares en España o en la Unión Europea?", type: "single", required: true, options: [
      { label: "No", value: "no" }, { label: "Sí, cónyuge o pareja", value: "spouse_partner" },
      { label: "Sí, padres", value: "parents" }, { label: "Sí, hijos", value: "children" },
      { label: "Sí, hermanos", value: "siblings" }, { label: "Sí, abuelos", value: "grandparents" },
      { label: "Sí, otros familiares", value: "others" },
    ]},
    { id: "family_member_status", label: "¿Qué nacionalidad o situación legal tiene ese familiar?", type: "single", required: true, showIf: { field: "family_in_spain_or_eu", op: "neq", value: "no" }, options: [
      { label: "Español/a", value: "spanish" }, { label: "Ciudadano/a UE", value: "eu_citizen" },
      { label: "Residente legal", value: "legal_resident" }, { label: "Solicitante de asilo", value: "asylum_applicant" },
      { label: "En situación irregular", value: "irregular" }, { label: "No lo sé", value: "unknown" },
    ]},
    { id: "spanish_ancestry", label: "¿Tienes padres, abuelos o bisabuelos españoles?", type: "single", required: true, options: [
      { label: "No", value: "no" }, { label: "Sí, padre o madre español/a", value: "parent" },
      { label: "Sí, abuelo/a español/a", value: "grandparent" }, { label: "Sí, bisabuelo/a español/a", value: "great_grandparent" },
      { label: "No lo sé", value: "unknown" },
    ]},
    { id: "spanish_ancestry_documents", label: "¿Conservas documentos de nacimiento, matrimonio o nacionalidad de ese familiar español?", type: "single", required: true, showIf: { field: "spanish_ancestry", op: "neq", value: "no" }, options: [
      { label: "Sí, todos", value: "all" }, { label: "Tengo algunos", value: "some" },
      { label: "No", value: "no" }, { label: "No lo sé", value: "unknown" },
    ]},
  ]},
  { id: "asylum", title: "Módulo de protección internacional", description: "Siempre activa revisión humana.", questions: [
    { id: "protection_reason_exists", label: "¿Tu salida del país está relacionada con persecución, amenazas, violencia o riesgo grave?", type: "single", required: true, options: [
      { label: "Sí", value: "yes" }, { label: "No", value: "no" },
      { label: "Prefiero explicarlo", value: "explain" }, { label: "No estoy seguro/a", value: "unknown" },
    ]},
    { id: "previous_asylum_application", label: "¿Ya has solicitado asilo o protección internacional en España u otro país?", type: "single", required: true, options: [
      { label: "No", value: "no" }, { label: "Sí, en España", value: "spain" },
      { label: "Sí, en otro país UE", value: "eu" }, { label: "Sí, en otro país", value: "other" },
      { label: "No lo sé", value: "unknown" },
    ]},
    { id: "asylum_document_status", label: "¿Tienes cita, resguardo blanco, tarjeta roja o algún documento de asilo?", type: "single", required: true, options: [
      { label: "No", value: "no" }, { label: "Cita solicitada", value: "appointment" },
      { label: "Resguardo blanco", value: "white_receipt" }, { label: "Tarjeta roja", value: "red_card" },
      { label: "Resolución favorable", value: "approved" }, { label: "Denegación", value: "denied" },
      { label: "No lo sé", value: "unknown" },
    ]},
  ]},
]

const optionalStep: Step = {
  id: "optional_precision",
  title: "Opcional: mejorar precisión del diagnóstico",
  description: "No bloquea el envío. Afina costes, tiempos, checklist y próximos pasos.",
  questions: [
    { id: "savings_eur", label: "Indica una cifra aproximada de ahorros disponibles en euros.", type: "number", optional: true },
    { id: "monthly_income_eur", label: "Indica una cifra aproximada de ingresos mensuales en euros.", type: "number", optional: true },
    { id: "six_month_plan", label: "¿Cuál es tu plan ideal para los primeros 6 meses en España?", type: "textarea", optional: true },
    { id: "degree_name", label: "¿Qué título concreto tienes o estás cursando?", type: "text", optional: true },
    { id: "regulated_profession", label: "¿Tu profesión requiere homologación, colegiación o habilitación en España?", type: "single", options: yesNoUnknown, optional: true },
    { id: "study_center_name", label: "Nombre del centro de estudios, si ya lo tienes.", type: "text", optional: true },
    { id: "study_tuition_cost_eur", label: "¿Cuánto cuesta la matrícula o programa completo?", type: "number", optional: true },
    { id: "funds_in_own_bank_account", label: "¿Los fondos están en una cuenta bancaria a tu nombre?", type: "single", optional: true, options: [
      { label: "Sí", value: "yes" }, { label: "No, están en cuenta de un familiar", value: "family_account" },
      { label: "Parte sí y parte no", value: "partial" }, { label: "No", value: "no" }, { label: "No lo sé", value: "unknown" },
    ]},
    { id: "housing_plan", label: "¿Tienes alojamiento previsto en España?", type: "single", optional: true, options: [
      { label: "Sí, contrato de alquiler", value: "rental_contract" }, { label: "Sí, familiares/amigos", value: "family_friends" },
      { label: "Sí, residencia de estudiantes", value: "student_residence" }, { label: "No", value: "no" },
      { label: "No lo sé", value: "unknown" },
    ]},
    { id: "can_register_address", label: "¿Podrías empadronarte en la vivienda donde vivirías?", type: "single", optional: true, options: yesNoUnknown },
    { id: "documents_ready", label: "¿Tienes ya algún documento preparado para el trámite?", type: "multi", optional: true, options: [
      { label: "Pasaporte", value: "passport" }, { label: "Antecedentes penales", value: "criminal_record_certificate" },
      { label: "Certificado médico", value: "medical_certificate" }, { label: "Carta de admisión", value: "admission_letter" },
      { label: "Contrato de trabajo", value: "job_contract" }, { label: "Seguro médico", value: "health_insurance" },
      { label: "Extractos bancarios", value: "bank_statements" }, { label: "Apostillas/legalizaciones", value: "apostilles" },
      { label: "Traducciones", value: "translations" }, { label: "Empadronamiento", value: "empadronamiento" },
      { label: "Ninguno todavía", value: "none" },
    ]},
    { id: "help_needed_level", label: "¿Cuánta ayuda necesitas?", type: "single", optional: true, options: [
      { label: "Solo quiero saber qué vía me conviene", value: "route_only" },
      { label: "Quiero checklist y pasos", value: "checklist" },
      { label: "Quiero ayuda revisando documentos", value: "document_review" },
      { label: "Quiero acompañamiento completo", value: "full_support" },
      { label: "Necesito hablar con un experto/legal", value: "expert" },
    ]},
  ],
}

const isSpainVal = (v: AnswerValue) => typeof v === "string" && v.startsWith("spain_")
const arr = (v: AnswerValue): string[] => Array.isArray(v) ? v : typeof v === "string" ? [v] : []

function show(condition: Condition | undefined, answers: Answers): boolean {
  if (!condition) return true
  if ("any" in condition) return condition.any.some((c) => show(c, answers))
  if ("all" in condition) return condition.all.every((c) => show(c, answers))
  const v = answers[condition.field]
  if (condition.op === "eq") return v === condition.value
  if (condition.op === "neq") return v !== condition.value && v !== undefined
  if (condition.op === "in") return arr(v).some((x) => (Array.isArray(condition.value) ? condition.value : [String(condition.value)]).includes(x))
  if (condition.op === "notEmpty") return v !== undefined && v !== null && v !== ""
  if (condition.op === "isSpain") return isSpainVal(v)
  if (condition.op === "gte") return Number(v) >= Number(condition.value)
  if (condition.op === "lte") return Number(v) <= Number(condition.value)
  return true
}

function shouldStudy(a: Answers) { return a.migration_goal === "study" || a.main_priority === "study_then_work" || ["yes", "maybe_safe", "only_if_can_work", "only_if_affordable"].includes(String(a.willing_to_study_in_spain || "")) || ["admission_letter", "enrollment_paid", "searching"].includes(String(a.admission_letter || "")) }
function shouldNonLucrative(a: Answers) { return a.migration_goal === "non_lucrative" || a.main_priority === "live_without_working" || ["20000_40000", "gt_40000"].includes(String(a.savings_eur_range || "")) || ["3000_5000", "gt_5000"].includes(String(a.monthly_income_eur_range || "")) }
function shouldRemote(a: Answers) { return a.migration_goal === "remote_work" || String(a.remote_work || "") !== "no" }
function shouldWork(a: Answers) { return a.migration_goal === "work_employee" || ["informal_offer", "formal_offer", "signed_contract", "interviews"].includes(String(a.job_offer_spain || "")) }
function shouldSelf(a: Answers) { return a.migration_goal === "self_employed" || ["yes", "maybe"].includes(String(a.wants_self_employment)) }
function shouldRegularize(a: Answers) { return a.migration_goal === "regularize" || ["spain_irregular", "spain_expired_stay"].includes(String(a.current_location || "")) || ["tourist_over_90", "irregular", "expired_stay"].includes(String(a.spain_legal_status || "")) }
function shouldFamily(a: Answers) { return a.migration_goal === "family" || a.main_priority === "bring_family" || !["alone", "", "undefined"].includes(String(a.family_accompanying || "")) || a.migration_goal === "nationality" }
function shouldAsylum(a: Answers) { return a.migration_goal === "asylum" || a.current_location === "spain_asylum_applicant" || a.spain_legal_status === "asylum_applicant" }

function getAdaptiveSteps(a: Answers): Step[] {
  return adaptiveSteps.filter((s) =>
    (s.id === "study" && shouldStudy(a)) ||
    (s.id === "non_lucrative" && shouldNonLucrative(a)) ||
    (s.id === "remote" && shouldRemote(a)) ||
    (s.id === "work_employee" && shouldWork(a)) ||
    (s.id === "self_employed" && shouldSelf(a)) ||
    (s.id === "regularization" && shouldRegularize(a)) ||
    (s.id === "family" && shouldFamily(a)) ||
    (s.id === "asylum" && shouldAsylum(a))
  )
}

function calculateMeta(a: Answers, enhanced: boolean): DiagnosticMeta {
  const reasons: string[] = []
  const routes = new Set<string>()
  if (shouldStudy(a)) routes.add("study_visa")
  if (shouldNonLucrative(a)) routes.add("non_lucrative_residence")
  if (shouldRemote(a)) routes.add("digital_nomad_visa")
  if (shouldWork(a)) routes.add("work_employee_visa")
  if (shouldSelf(a)) routes.add("self_employed_work")
  if (shouldRegularize(a)) routes.add("arraigo_regularization")
  if (shouldFamily(a)) routes.add("family_or_eu_spanish_family_route")
  if (shouldAsylum(a)) routes.add("asylum_protection")
  if (routes.size === 0 || a.migration_goal === "not_sure") routes.add("needs_route_triage")
  if (["yes", "unknown", "explain"].includes(String(a.criminal_record))) reasons.push("Antecedentes penales/policiales o situación no clara.")
  if (String(a.previous_denials) !== "no" && a.previous_denials !== undefined) reasons.push("Denegación migratoria previa o no aclarada.")
  if (["yes", "unknown"].includes(String(a.expulsion_or_ban))) reasons.push("Posible expulsión, prohibición de entrada o sanción.")
  if (shouldAsylum(a)) reasons.push("Caso relacionado con asilo/protección internacional.")
  if (shouldRegularize(a)) reasons.push("Caso con posible irregularidad, estancia vencida o regularización.")
  if (arr(a.funds_origin).includes("unclear")) reasons.push("Fondos no claramente justificables.")
  if (a.intends_to_work_first_year === "yes" && shouldNonLucrative(a)) reasons.push("Posible contradicción: no lucrativa con intención de trabajar.")
  if (["21_50", "gt_50"].includes(String(a.spanish_income_percentage))) reasons.push("Nómada digital con posible exceso de ingresos de clientes españoles.")

  const lowMoney = ["lt_2000", "2000_5000"].includes(String(a.savings_eur_range))
  const mediumMoney = ["5000_8000", "8000_12000"].includes(String(a.savings_eur_range))
  const unclearFunds = arr(a.funds_origin).includes("unclear")
  const manyDependents = Number(a.dependents_count || 0) >= 2

  let economicRiskLevel: DiagnosticMeta["economicRiskLevel"] = "low"
  if (lowMoney && manyDependents) economicRiskLevel = "critical"
  else if (lowMoney || unclearFunds) economicRiskLevel = "high"
  else if (mediumMoney || manyDependents) economicRiskLevel = "medium"

  let documentationRiskLevel: DiagnosticMeta["documentationRiskLevel"] = "low"
  if (["no", "in_process"].includes(String(a.passport_valid))) documentationRiskLevel = "critical"
  else if (a.passport_valid === "valid_under_12") documentationRiskLevel = "high"
  else if (["no", "unknown_if_valid", "comparing"].includes(String(a.health_insurance))) documentationRiskLevel = "medium"

  let legalRiskLevel: DiagnosticMeta["legalRiskLevel"] = "low"
  if (reasons.length >= 3) legalRiskLevel = "critical"
  else if (reasons.length >= 1) legalRiskLevel = "high"
  else if (a.spain_legal_status === "unknown") legalRiskLevel = "medium"

  let urgencyRiskLevel: DiagnosticMeta["urgencyRiskLevel"] = "low"
  if (["immediate", "less_1_month"].includes(String(a.urgency))) urgencyRiskLevel = "high"
  else if (a.urgency === "1_3_months") urgencyRiskLevel = "medium"

  return { requiresHumanReview: reasons.length > 0, humanReviewReasons: reasons, candidateRoutes: Array.from(routes), economicRiskLevel, documentationRiskLevel, legalRiskLevel, urgencyRiskLevel, completionMode: enhanced ? "enhanced" : "basic" }
}

function filled(v: AnswerValue): boolean { return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== "" && v !== false }
function visibleQuestions(step: Step, answers: Answers) { return step.questions.filter((q) => show(q.showIf, answers)) }
function validate(step: Step, answers: Answers) { return visibleQuestions(step, answers).filter((q) => q.required && !q.optional && !filled(answers[q.id])).map((q) => q.label) }

const riskColor: Record<string, string> = {
  low: "text-[#25D366]",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
}

export default function QuickEmigrateWizardFormV2({ onSubmit }: Props) {
  const [answers, setAnswers] = useState<Answers>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [includeOptional, setIncludeOptional] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const steps = useMemo(() => {
    const s = [...coreSteps, ...getAdaptiveSteps(answers)]
    if (includeOptional) s.push(optionalStep)
    s.push({ id: "review", title: "Resumen y envío", description: "Revisa el resumen antes de enviar.", questions: [] })
    return s
  }, [answers, includeOptional])

  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const meta = calculateMeta(answers, includeOptional)
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100)

  function update(q: Question, value: string | boolean) {
    setAnswers((prev) => ({ ...prev, [q.id]: q.type === "number" && value !== "" ? Number(value) : value }))
  }

  function toggleMulti(q: Question, value: string) {
    setAnswers((prev) => {
      const current = arr(prev[q.id])
      return { ...prev, [q.id]: current.includes(value) ? current.filter((x) => x !== value) : [...current, value] }
    })
  }

  function next() {
    const missing = validate(step, answers)
    if (missing.length) { setErrors(missing); return }
    setErrors([])
    setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  function back() { setErrors([]); setStepIndex((i) => Math.max(i - 1, 0)) }

  async function submit() {
    setSubmitting(true)
    try {
      const payload: SubmitPayload = { answers, meta, submittedAt: new Date().toISOString() }
      if (onSubmit) await onSubmit(payload)
    } finally {
      setSubmitting(false)
    }
  }

  function renderQuestion(q: Question) {
    const value = answers[q.id]
    const isSelected = (v: string) => value === v
    const isMultiSelected = (v: string) => arr(value).includes(v)

    return (
      <div key={q.id} className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-4">
        <label className="block text-sm font-semibold text-white">
          {q.label}
          {q.required && !q.optional
            ? <span className="ml-1 text-[#25D366]">*</span>
            : <span className="ml-2 text-xs font-normal text-white/40">Opcional</span>}
        </label>
        {q.helpText ? <p className="mt-1 text-xs text-white/50">{q.helpText}</p> : null}
        <div className="mt-3">
          {["text", "email", "tel", "number", "date"].includes(q.type) ? (
            <input
              type={q.type === "number" ? "number" : q.type}
              value={(value as string | number | undefined) ?? ""}
              placeholder={q.placeholder}
              onChange={(e) => update(q, e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#25D366]/50"
            />
          ) : null}
          {q.type === "textarea" ? (
            <textarea
              value={(value as string | undefined) ?? ""}
              placeholder={q.placeholder}
              onChange={(e) => update(q, e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#25D366]/50"
            />
          ) : null}
          {q.type === "single" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options?.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => update(q, o.value)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${isSelected(o.value)
                    ? "border-[#25D366] bg-[#25D366] text-[#062810] font-semibold"
                    : "border-white/10 bg-[#111111] text-white/80 hover:border-white/25 hover:text-white"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : null}
          {q.type === "multi" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options?.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleMulti(q, o.value)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${isMultiSelected(o.value)
                    ? "border-[#25D366] bg-[#25D366] text-[#062810] font-semibold"
                    : "border-white/10 bg-[#111111] text-white/80 hover:border-white/25 hover:text-white"}`}
                >
                  {isMultiSelected(o.value) ? "✓ " : ""}{o.label}
                </button>
              ))}
            </div>
          ) : null}
          {q.type === "checkbox" ? (
            <button
              type="button"
              onClick={() => update(q, !value)}
              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${value
                ? "border-[#25D366] bg-[#25D366]/10 text-white"
                : "border-white/10 bg-[#111111] text-white/80 hover:border-white/25"}`}
            >
              <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${value ? "border-[#25D366] bg-[#25D366] text-[#062810]" : "border-white/30"}`}>
                {value ? "✓" : ""}
              </span>
              <span>{q.label}</span>
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-3xl bg-[#111111] border border-white/10 p-5 mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#25D366] mb-1">Diagnóstico migratorio</p>
            <h1 className="text-2xl font-bold text-white">Tu perfil migratorio</h1>
            <p className="mt-1 text-sm text-white/50">Cuestionario adaptativo · núcleo + módulos condicionales</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/70">
            Paso <strong className="text-white">{stepIndex + 1}</strong> de <strong className="text-white">{steps.length}</strong>
          </div>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#25D366] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <main className="rounded-3xl bg-[#111111] border border-white/10 p-5">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">{step.title}</h2>
            {step.description ? <p className="mt-1 text-sm text-white/50">{step.description}</p> : null}
          </div>

          {step.id === "review" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-4">
                <h3 className="font-semibold text-white mb-3">Resumen del diagnóstico</h3>
                <dl className="grid gap-2 text-sm">
                  <div><dt className="text-white/50 text-xs uppercase tracking-wide mb-1">Rutas candidatas</dt><dd className="text-white">{meta.candidateRoutes.join(", ") || "—"}</dd></div>
                  <div><dt className="text-white/50 text-xs uppercase tracking-wide mb-1">Revisión humana</dt><dd className={meta.requiresHumanReview ? "text-yellow-400" : "text-[#25D366]"}>{meta.requiresHumanReview ? "Recomendada" : "No necesaria"}</dd></div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div><dt className="text-white/50 text-xs">Riesgo económico</dt><dd className={`font-medium ${riskColor[meta.economicRiskLevel]}`}>{meta.economicRiskLevel}</dd></div>
                    <div><dt className="text-white/50 text-xs">Riesgo documental</dt><dd className={`font-medium ${riskColor[meta.documentationRiskLevel]}`}>{meta.documentationRiskLevel}</dd></div>
                    <div><dt className="text-white/50 text-xs">Riesgo legal</dt><dd className={`font-medium ${riskColor[meta.legalRiskLevel]}`}>{meta.legalRiskLevel}</dd></div>
                    <div><dt className="text-white/50 text-xs">Urgencia</dt><dd className={`font-medium ${riskColor[meta.urgencyRiskLevel]}`}>{meta.urgencyRiskLevel}</dd></div>
                  </div>
                </dl>
              </div>
              {meta.humanReviewReasons.length ? (
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <h3 className="font-semibold text-yellow-400 mb-2">Motivos de revisión humana</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-yellow-300/80">
                    {meta.humanReviewReasons.map((r) => <li key={r}>{r}</li>)}
                  </ul>
                </div>
              ) : null}
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="w-full rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-bold text-[#062810] hover:bg-[#2adc6c] transition-colors disabled:opacity-50"
              >
                {submitting ? "Guardando..." : "Guardar y continuar"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleQuestions(step, answers).map(renderQuestion)}
              {step.id === "documents_risks" ? (
                <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-4">
                  <h3 className="text-sm font-semibold text-white">¿Quieres afinar más el diagnóstico?</h3>
                  <p className="mt-1 text-sm text-white/50">Las preguntas opcionales mejoran costes, checklist y próximos pasos, pero no bloquean el envío.</p>
                  <button
                    type="button"
                    onClick={() => setIncludeOptional((v) => !v)}
                    className={`mt-3 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${includeOptional
                      ? "bg-[#25D366] text-[#062810]"
                      : "border border-white/20 bg-transparent text-white hover:border-white/40"}`}
                  >
                    {includeOptional ? "Preguntas opcionales activadas" : "Activar preguntas opcionales"}
                  </button>
                </div>
              ) : null}
              {errors.length ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-sm font-semibold text-red-400 mb-2">Faltan preguntas obligatorias:</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-red-300/80">
                    {errors.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={back}
              disabled={stepIndex === 0}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/70 disabled:opacity-30 hover:border-white/40 hover:text-white transition-colors"
            >
              Atrás
            </button>
            {step.id !== "review" ? (
              <button
                type="button"
                onClick={next}
                className="rounded-xl bg-[#25D366] px-5 py-2 text-sm font-bold text-[#062810] hover:bg-[#2adc6c] transition-colors"
              >
                Continuar
              </button>
            ) : null}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="rounded-3xl bg-[#111111] border border-white/10 p-5 h-fit">
          <h3 className="text-sm font-bold text-white mb-4">Estado del diagnóstico</h3>
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl bg-[#0A0A0A] border border-white/5 p-3">
              <p className="font-medium text-white/50 text-xs uppercase tracking-wide mb-2">Rutas detectadas</p>
              <p className="text-white/80 text-xs leading-relaxed">{meta.candidateRoutes.join(", ") || "Aún no detectadas"}</p>
            </div>
            <div className="rounded-2xl bg-[#0A0A0A] border border-white/5 p-3">
              <p className="font-medium text-white/50 text-xs uppercase tracking-wide mb-2">Riesgos</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-white/50">Económico</span><span className={riskColor[meta.economicRiskLevel]}>{meta.economicRiskLevel}</span>
                <span className="text-white/50">Documental</span><span className={riskColor[meta.documentationRiskLevel]}>{meta.documentationRiskLevel}</span>
                <span className="text-white/50">Legal</span><span className={riskColor[meta.legalRiskLevel]}>{meta.legalRiskLevel}</span>
                <span className="text-white/50">Urgencia</span><span className={riskColor[meta.urgencyRiskLevel]}>{meta.urgencyRiskLevel}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-[#0A0A0A] border border-white/5 p-3">
              <p className="font-medium text-white/50 text-xs uppercase tracking-wide mb-1">Precisión</p>
              <p className="text-white/80 text-xs">{includeOptional ? "Diagnóstico ampliado" : "Diagnóstico básico"}</p>
            </div>
            {meta.requiresHumanReview ? (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                <p className="font-medium text-yellow-400 text-xs mb-1">Revisión humana recomendada</p>
                <p className="text-yellow-300/70 text-xs">Tu caso tiene señales que conviene revisar con un experto.</p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
