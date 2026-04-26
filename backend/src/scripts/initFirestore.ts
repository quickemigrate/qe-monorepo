import { db } from '../firebase';
import { Timestamp } from 'firebase-admin/firestore';

const ahora = Timestamp.now();

async function init() {
  console.log('Inicializando colecciones Firestore...');

  // rutas_migratorias
  await db.collection('rutas_migratorias').add({
    titulo: 'Visado de Estudios — Ruta Completa',
    contenido: 'La ruta de estudios permite residir en España mientras cursas formación superior. Requiere matriculación en centro homologado, seguro médico y medios económicos suficientes (mínimo IPREM mensual). Autorización inicial de hasta 1 año renovable por curso académico.',
    categoria: 'visado',
    subcategoria: 'estudios',
    pais: 'España',
    fuente: 'manual',
    requisitos: ['Matrícula en centro homologado', 'Seguro médico', 'Medios económicos: 600,53€/mes mínimo'],
    ventajas: ['Permite trabajo a tiempo parcial (hasta 30h/semana)', 'Renovable anualmente', 'Acceso a TIE'],
    riesgos: ['No permite trabajo a tiempo completo', 'Dependiente de continuidad académica'],
    pasos_proceso: ['Solicitar en consulado español', 'Presentar matrícula y seguro', 'Obtener visado D', 'Solicitar TIE en España en 30 días'],
    tags: ['estudios', 'visado', 'formación'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('rutas_migratorias').add({
    titulo: 'Permiso de Trabajo por Cuenta Ajena',
    contenido: 'Requiere oferta de empleo de empresa española. El empleador inicia el trámite. Sujeto a situación nacional de empleo salvo excepciones (profesiones de difícil cobertura). Autorización inicial 1 año, renovable a 2 años y luego 4 años.',
    categoria: 'permiso',
    subcategoria: 'trabajo',
    pais: 'España',
    fuente: 'manual',
    requisitos: ['Oferta de empleo', 'Empresa inscrita en SS', 'Sin antecedentes penales', 'Pasaporte vigente'],
    ventajas: ['Permite residencia y trabajo', 'Renovable y progresivo', 'Acceso a prestaciones sociales'],
    riesgos: ['Depende del empleador', 'Contingente anual limitado', 'Situación nacional de empleo puede bloquear'],
    pasos_proceso: ['Empresa presenta oferta en SEPE', 'Trámite en consulado', 'Visado de trabajo', 'Alta en SS'],
    tags: ['trabajo', 'cuenta_ajena', 'empleo'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('rutas_migratorias').add({
    titulo: 'Residencia No Lucrativa',
    contenido: 'Para personas con recursos propios suficientes sin necesidad de trabajar. Requiere demostrar 400% del IPREM mensual (~2.400€/mes en 2024). No permite trabajar por cuenta ajena. Popular entre jubilados y rentistas latinoamericanos.',
    categoria: 'residencia',
    subcategoria: 'residencia_no_lucrativa',
    pais: 'España',
    fuente: 'manual',
    requisitos: ['400% IPREM mensual (~2.400€)', 'Seguro médico privado sin copago', 'Sin antecedentes penales', 'Alojamiento acreditado'],
    ventajas: ['No depende de empleador', 'Renovable cada año', 'Acceso a residencia legal'],
    riesgos: ['No permite trabajar', 'Alto requisito económico', 'Puede denegarse si no se acreditan medios'],
    pasos_proceso: ['Solicitud en consulado', 'Acreditar medios económicos', 'Seguro médico', 'Obtener TIE'],
    tags: ['residencia', 'no_lucrativa', 'rentista'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('rutas_migratorias').add({
    titulo: 'Arraigo Social',
    contenido: 'Regularización para personas con 3 años de permanencia continua en España y vínculos sociales (informe de arraigo del ayuntamiento). No requiere oferta de trabajo previa. Una de las vías más usadas para regularizar situación irregular.',
    categoria: 'regularizacion',
    subcategoria: 'arraigo',
    pais: 'España',
    fuente: 'manual',
    requisitos: ['3 años continuos en España', 'Informe de arraigo del ayuntamiento', 'Sin antecedentes penales', 'Medios económicos suficientes'],
    ventajas: ['No necesita empleador previo', 'Regulariza situación irregular', 'Autorización inicial de trabajo'],
    riesgos: ['Informe de arraigo puede denegarse', 'Difícil probar 3 años de permanencia', 'Proceso largo (6-12 meses)'],
    pasos_proceso: ['Solicitar informe arraigo en ayuntamiento', 'Presentar en Extranjería', 'Esperar resolución', 'Solicitar TIE'],
    tags: ['arraigo', 'regularización', 'irregular'],
    activo: true,
    fechaActualizacion: ahora,
  });

  console.log('✓ rutas_migratorias creada');

  // requisitos_legales
  await db.collection('requisitos_legales').add({
    titulo: 'Requisitos Visado de Estudios España 2024',
    contenido: 'Documentación obligatoria: carta de admisión o matrícula del centro, seguro médico con cobertura mínima de 30.000€, extracto bancario con mínimo 600,53€/mes (IPREM 2024), antecedentes penales apostillados, formulario VN (nacional) o VLS (Schengen).',
    categoria: 'estudios',
    subcategoria: 'visado_estudios',
    pais: 'España',
    fuente: 'BOE',
    documentos: ['Pasaporte vigente (+6 meses)', 'Matrícula/carta admisión', 'Seguro médico sin copago', 'Extracto bancario', 'Antecedentes penales apostillados', 'Foto reciente'],
    requisitos_economicos: { mensual_minimo: 600.53, anual_minimo: 7206.36, seguro_minimo: 30000 },
    tiempos_proceso: { consulado_dias: 30, tramite_TIE_dias: 30, total_estimado_dias: 60 },
    tasa_denegacion: 15,
    tags: ['estudios', 'documentación', 'requisitos'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('requisitos_legales').add({
    titulo: 'Requisitos Permiso de Trabajo Cuenta Ajena 2024',
    contenido: 'El empleador presenta la oferta en la oficina de Extranjería. Cotización SS obligatoria. Salario mínimo SMI 2024: 1.134€/mes. Verificación de situación nacional de empleo (listas del SEPE). Proceso inicia en España, el trabajador tramita visado en consulado.',
    categoria: 'trabajo',
    subcategoria: 'visado_trabajo',
    pais: 'España',
    fuente: 'BOE',
    documentos: ['Oferta de empleo (empresa)', 'Contrato firmado', 'Antecedentes penales apostillados', 'Títulos académicos apostillados', 'Pasaporte'],
    requisitos_economicos: { salario_minimo: 1134, cotizacion_ss: true },
    tiempos_proceso: { tramite_empresa_dias: 60, consulado_dias: 30, total_estimado_dias: 90 },
    tasa_denegacion: 20,
    tags: ['trabajo', 'cuenta_ajena', 'empleador'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('requisitos_legales').add({
    titulo: 'Requisitos Residencia No Lucrativa 2024',
    contenido: 'Acreditar 400% IPREM/mes = 2.402,12€/mes en 2024. Seguro médico privado completo sin copago. No se puede trabajar. Renovación anual acreditando mantenimiento de recursos. Muy solicitado por jubilados latinoamericanos con pensión extranjera.',
    categoria: 'residencia_no_lucrativa',
    subcategoria: 'otros',
    pais: 'España',
    fuente: 'BOE',
    documentos: ['Extracto bancario 6 meses', 'Seguro médico sin copago', 'Contrato alquiler/propiedad', 'Antecedentes penales apostillados'],
    requisitos_economicos: { mensual_minimo: 2402.12, anual_minimo: 28825.44 },
    tiempos_proceso: { consulado_dias: 45, TIE_dias: 30, total_estimado_dias: 75 },
    tasa_denegacion: 25,
    tags: ['no_lucrativa', 'recursos_propios', 'jubilados'],
    activo: true,
    fechaActualizacion: ahora,
  });

  console.log('✓ requisitos_legales creada');

  // base_conocimiento
  await db.collection('base_conocimiento').add({
    titulo: 'IPREM 2024 — Indicador Público de Renta de Efectos Múltiples',
    contenido: 'El IPREM para 2024 es de 600,53€/mes (7.200,60€/año en 12 pagas; 8.400,70€ en 14 pagas). Se usa como referencia para requisitos económicos en visados y permisos de residencia. El 100% IPREM mensual es el mínimo para visado de estudios; el 400% para residencia no lucrativa.',
    categoria: 'datos_economicos',
    subcategoria: 'indicadores',
    pais: 'España',
    fuente: 'BOE',
    valor: 600.53,
    unidad: '€/mes',
    año: 2024,
    fuente_oficial: 'Real Decreto 145/2024',
    tags: ['IPREM', 'económico', '2024'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('base_conocimiento').add({
    titulo: 'SMI 2024 — Salario Mínimo Interprofesional',
    contenido: 'El SMI 2024 es de 1.134€/mes en 14 pagas (15.876€/año). Referencia para contratos de trabajo en permisos por cuenta ajena. Los contratos deben igualar o superar este importe.',
    categoria: 'datos_economicos',
    subcategoria: 'indicadores',
    pais: 'España',
    fuente: 'BOE',
    valor: 1134,
    unidad: '€/mes',
    año: 2024,
    fuente_oficial: 'Real Decreto 1060/2023',
    tags: ['SMI', 'salario', '2024', 'trabajo'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('base_conocimiento').add({
    titulo: 'Ley Orgánica 4/2000 — Ley de Extranjería',
    contenido: 'Marco normativo principal que regula los derechos y libertades de los extranjeros en España y su integración social. Última modificación relevante por LO 2/2009. Regula permisos de residencia, trabajo, reagrupación familiar y procedimientos sancionadores.',
    categoria: 'normativa',
    subcategoria: 'extranjeria',
    pais: 'España',
    fuente: 'BOE',
    referencia_legal: 'LO 4/2000 + LO 2/2009',
    fecha_vigor: Timestamp.fromDate(new Date('2000-01-23')),
    resumen: 'Regula todos los aspectos de extranjería en España. Artículos 25-44 sobre permisos de residencia y trabajo.',
    tags: ['extranjería', 'ley', 'normativa'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('base_conocimiento').add({
    titulo: 'Reglamento de Extranjería — RD 557/2011',
    contenido: 'Desarrolla la Ley de Extranjería en aspectos procedimentales. Regula tipos de visados (A, B, C, D), procedimientos de autorización de residencia y trabajo, y causas de denegación. Última actualización relevante 2022.',
    categoria: 'normativa',
    subcategoria: 'reglamento',
    pais: 'España',
    fuente: 'BOE',
    referencia_legal: 'RD 557/2011',
    fecha_vigor: Timestamp.fromDate(new Date('2011-04-30')),
    resumen: 'Reglamento de desarrollo de la Ley de Extranjería. Detalla procedimientos y tipos de autorizaciones.',
    tags: ['reglamento', 'procedimiento', 'visados'],
    activo: true,
    fechaActualizacion: ahora,
  });

  console.log('✓ base_conocimiento creada');

  // simulaciones
  await db.collection('simulaciones').add({
    titulo: 'Coste de Emigrar a España — Estimación por Tipo de Visa',
    contenido: 'Estimación de costes iniciales para emigrar a España según ruta migratoria. Incluye tasas administrativas, traslado y establecimiento inicial.',
    categoria: 'simulacion',
    subcategoria: 'coste_emigrar',
    pais: 'España',
    fuente: 'manual',
    variables_entrada: ['tipo_visado', 'pais_origen', 'num_personas', 'alquiler_ciudad'],
    formula_logica: 'tasa_visado + apostillas + seguro_medico + traslado + deposito_alquiler + meses_reserva',
    rangos: {
      estudios: { minimo: 2000, maximo: 5000, unidad: '€' },
      trabajo: { minimo: 1500, maximo: 4000, unidad: '€' },
      residencia_no_lucrativa: { minimo: 3000, maximo: 7000, unidad: '€' },
      arraigo: { minimo: 500, maximo: 2000, unidad: '€' },
    },
    tags: ['coste', 'presupuesto', 'estimación'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('simulaciones').add({
    titulo: 'Probabilidad de Éxito por Ruta Migratoria',
    contenido: 'Estimación de probabilidad de éxito basada en tasas históricas de aprobación por tipo de visado y perfil del solicitante.',
    categoria: 'simulacion',
    subcategoria: 'probabilidad_exito',
    pais: 'España',
    fuente: 'manual',
    variables_entrada: ['tipo_visado', 'nivel_estudios', 'experiencia_laboral', 'medios_economicos', 'pais_origen'],
    formula_logica: 'tasa_base_visado * factor_perfil * factor_documentacion * factor_pais_origen',
    rangos: {
      estudios: { tasa_base: 0.85, tasa_denegacion_historica: 0.15 },
      trabajo: { tasa_base: 0.80, tasa_denegacion_historica: 0.20 },
      residencia_no_lucrativa: { tasa_base: 0.75, tasa_denegacion_historica: 0.25 },
      arraigo: { tasa_base: 0.65, tasa_denegacion_historica: 0.35 },
    },
    tags: ['probabilidad', 'éxito', 'estadísticas'],
    activo: true,
    fechaActualizacion: ahora,
  });

  console.log('✓ simulaciones creada');

  // casos_reales
  await db.collection('casos_reales').add({
    titulo: 'Venezolana, 28 años, Visado de Estudios — Máster en Madrid',
    contenido: 'Perfil universitaria con título en Comunicación. Obtuvo plaza en máster privado en Madrid. Proceso duró 45 días desde solicitud en consulado. Principal dificultad: apostillar documentos universitarios. Consiguió trabajo a tiempo parcial a los 3 meses.',
    categoria: 'caso_real',
    subcategoria: 'estudios',
    pais: 'España',
    fuente: 'manual',
    resultado: 'exitoso',
    motivo_resultado: 'Documentación completa y centro homologado. Medios económicos suficientes con ayuda familiar.',
    ruta_migratoria: 'estudios',
    pais_origen: 'Venezuela',
    tiempo_total_dias: 45,
    tags: ['estudios', 'Venezuela', 'máster', 'exitoso'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('casos_reales').add({
    titulo: 'Colombiano, 35 años, Arraigo Social — Barcelona',
    contenido: 'Llegó en 2019 sin documentos. Trabajó en hostelería. En 2022 solicitó informe de arraigo. El ayuntamiento tardó 6 meses en emitirlo. Extranjería tardó 8 meses más. Total: 14 meses hasta TIE. Proceso largo pero exitoso.',
    categoria: 'caso_real',
    subcategoria: 'arraigo',
    pais: 'España',
    fuente: 'manual',
    resultado: 'exitoso',
    motivo_resultado: 'Pudo acreditar 3+ años de permanencia con contrato de alquiler, empadronamiento histórico y testigos.',
    ruta_migratoria: 'arraigo',
    pais_origen: 'Colombia',
    tiempo_total_dias: 420,
    tags: ['arraigo', 'Colombia', 'Barcelona', 'exitoso'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('casos_reales').add({
    titulo: 'Argentino, 42 años, Residencia No Lucrativa — Valencia',
    contenido: 'Jubilado anticipado con pensión privada argentina. Acreditó 2.800€/mes. Proceso en consulado de Buenos Aires duró 60 días. Llegó a Valencia, tramitó TIE en 3 semanas. Vivía de inversiones sin necesitar trabajar.',
    categoria: 'caso_real',
    subcategoria: 'residencia_no_lucrativa',
    pais: 'España',
    fuente: 'manual',
    resultado: 'exitoso',
    motivo_resultado: 'Recursos económicos demostrados con holgura. Documentación en orden. Consulado Buenos Aires eficiente.',
    ruta_migratoria: 'residencia_no_lucrativa',
    pais_origen: 'Argentina',
    tiempo_total_dias: 90,
    tags: ['no_lucrativa', 'Argentina', 'Valencia', 'jubilado', 'exitoso'],
    activo: true,
    fechaActualizacion: ahora,
  });

  await db.collection('casos_reales').add({
    titulo: 'Mexicano, 30 años, Visado de Trabajo — Denegado',
    contenido: 'Ingeniero de software con oferta de empresa tecnológica en Madrid. Denegado porque la empresa no pudo demostrar que realizó búsqueda previa en el mercado español (situación nacional de empleo). La empresa re-intentó 6 meses después con documentación SEPE correcta.',
    categoria: 'caso_real',
    subcategoria: 'trabajo',
    pais: 'España',
    fuente: 'manual',
    resultado: 'fallido',
    motivo_resultado: 'Empresa no acreditó correctamente la situación nacional de empleo ante el SEPE. Error documental del empleador.',
    ruta_migratoria: 'trabajo',
    pais_origen: 'México',
    tiempo_total_dias: 180,
    tags: ['trabajo', 'México', 'denegado', 'tecnología'],
    activo: true,
    fechaActualizacion: ahora,
  });

  console.log('✓ casos_reales creada');
  console.log('\n✅ Firestore inicializado correctamente. Colecciones creadas:');
  console.log('   - rutas_migratorias (4 docs)');
  console.log('   - requisitos_legales (3 docs)');
  console.log('   - base_conocimiento (4 docs)');
  console.log('   - simulaciones (2 docs)');
  console.log('   - casos_reales (4 docs)');
  console.log('\nColección `usuarios` no tocada.');
}

init().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
