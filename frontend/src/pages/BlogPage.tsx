import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Clock, ArrowLeft } from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────── */
interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  body: React.ReactNode;
}

const POSTS: Post[] = [
  {
    slug: 'guia-emigrar-espana-latinoamerica',
    title: 'Guía completa para emigrar a España desde Latinoamérica (2026)',
    excerpt:
      'Todo lo que necesitas saber antes de iniciar tu proceso migratorio: documentación, plazos, errores frecuentes y cómo prepararte.',
    category: 'Guías',
    readTime: '8 min',
    date: '15 abr 2026',
    body: (
      <>
        <p>
          Emigrar a España desde Latinoamérica implica navegar un sistema burocrático que puede parecer un
          laberinto. La buena noticia: con información clara y una ruta ordenada, el proceso es manejable.
        </p>
        <h2>1. Define tu vía migratoria</h2>
        <p>
          Antes de reunir un solo documento, tienes que saber por qué puerta entras. Las principales
          opciones son: visado de estudios, visado no lucrativo, reagrupación familiar y, si tienes
          empresa o emprendimiento, el visado de emprendedor (Ley de Startups).
        </p>
        <h2>2. Documentación base</h2>
        <p>
          Independientemente de la vía, necesitarás pasaporte vigente con al menos 6 meses de validez,
          certificado de antecedentes penales apostillado, seguro médico privado con cobertura en España
          y justificante de medios económicos suficientes.
        </p>
        <h2>3. Plazos reales</h2>
        <p>
          Los consulados en Latinoamérica pueden tardar entre 4 y 12 semanas en resolver una solicitud.
          Planificar con al menos 3 meses de antelación es imprescindible para evitar prisas de último
          momento.
        </p>
        <h2>4. Errores que cuestan caro</h2>
        <p>
          El error más común es presentar documentación sin apostillar o con traducciones no oficiales.
          Otro fallo frecuente es no verificar si tu título universitario requiere homologación antes de
          llegar, un trámite que puede tardar más de un año.
        </p>
        <h2>5. Qué hacer al llegar</h2>
        <p>
          En las primeras semanas deberás solicitar el NIE, empadronarte en el ayuntamiento y, si tienes
          residencia de larga duración, tramitar la TIE. Cada paso tiene su plazo y su dependencia con
          el siguiente.
        </p>
      </>
    ),
  },
  {
    slug: 'nie-tie-diferencias',
    title: 'NIE vs TIE: qué son, diferencias y cómo solicitarlos',
    excerpt:
      'Dos siglas que confunden a casi todos los recién llegados. Te explicamos para qué sirve cada uno, cuándo necesitas cada documento y cómo tramitarlos.',
    category: 'Trámites',
    readTime: '5 min',
    date: '10 abr 2026',
    body: (
      <>
        <p>
          Cuando llegas a España como extranjero, pronto escucharás hablar del NIE y la TIE. Son cosas
          distintas, aunque mucha gente los confunde.
        </p>
        <h2>¿Qué es el NIE?</h2>
        <p>
          El Número de Identificación de Extranjero (NIE) es simplemente eso: un número. Comienza por
          X, Y o Z, seguido de siete dígitos y una letra. Lo necesitarás para casi cualquier gestión
          legal o económica: abrir una cuenta bancaria, firmar un contrato de alquiler, comprar un
          coche o presentar impuestos.
        </p>
        <h2>¿Qué es la TIE?</h2>
        <p>
          La Tarjeta de Identidad de Extranjero (TIE) es el documento físico que acredita tu situación
          de residencia en España. Lleva incorporado tu NIE, pero es mucho más: es tu "DNI de
          residente". La necesitan quienes tienen autorización de residencia o estancia superior a 6
          meses.
        </p>
        <h2>¿Cuándo necesitas uno y cuándo el otro?</h2>
        <p>
          Si vas a estar menos de 3 meses (visado de turista), solo necesitas el NIE para gestiones
          económicas puntuales. Si vas a residir, necesitas la TIE obligatoriamente en el plazo de un
          mes desde tu llegada con visado de residencia.
        </p>
        <h2>Cómo solicitarlos</h2>
        <p>
          El NIE se solicita en la comisaría de policía con formulario EX-15, pasaporte original y
          copia, y justificante del motivo. La TIE se tramita en extranjería con la misma documentación
          más las fotos biométricas y la huella dactilar.
        </p>
      </>
    ),
  },
  {
    slug: 'visado-estudios-espana',
    title: 'Visado de estudios en España: requisitos y proceso paso a paso',
    excerpt:
      'Si vas a estudiar un máster, grado o curso de más de 90 días, necesitas este visado. Aquí tienes todo el proceso detallado.',
    category: 'Visados',
    readTime: '6 min',
    date: '3 abr 2026',
    body: (
      <>
        <p>
          El visado de estudios es una de las vías más accesibles para hispanohablantes que quieren
          llegar a España. No requiere demostrar solvencia económica extrema y abre la puerta a otras
          opciones de residencia posteriores.
        </p>
        <h2>Requisitos principales</h2>
        <p>
          Carta de admisión de la universidad o centro educativo, pasaporte vigente, seguro médico
          privado (sin copagos), justificante de medios económicos (normalmente entre 600 y 700 € al
          mes), y certificado de antecedentes penales apostillado de los últimos 5 años.
        </p>
        <h2>Medios económicos: ¿cuánto necesitas?</h2>
        <p>
          El criterio oficial es el 100% del IPREM mensual por cada mes de estancia más el importe de
          la matrícula. En 2026, el IPREM mensual está en torno a 600 €. Para un máster de un año,
          necesitarás acreditar aproximadamente 7.200 € más los costes del programa.
        </p>
        <h2>Proceso y plazos</h2>
        <p>
          Solicita con al menos 2 meses de antelación a tu fecha de entrada. El consulado tiene 1 mes
          para resolver, aunque en la práctica suele tardar entre 2 y 6 semanas. Una vez en España,
          tienes 30 días para solicitar la TIE de estudiante.
        </p>
        <h2>Trabajar con visado de estudios</h2>
        <p>
          Desde 2023, los estudiantes pueden trabajar hasta 30 horas semanales sin necesitar
          autorización adicional. Esto ha convertido el visado de estudios en una opción muy atractiva
          para quienes quieren combinar formación e ingresos.
        </p>
      </>
    ),
  },
  {
    slug: 'errores-comunes-visado',
    title: 'Los 5 errores más comunes al solicitar un visado español (y cómo evitarlos)',
    excerpt:
      'Años acompañando expedientes nos han enseñado dónde falla la gente. La mayoría de las denegaciones se pueden prevenir.',
    category: 'Consejos',
    readTime: '4 min',
    date: '28 mar 2026',
    body: (
      <>
        <p>
          La mayoría de las denegaciones de visado no se deben a que el perfil del solicitante sea
          inviable, sino a errores documentales o de procedimiento que se podían haber evitado.
        </p>
        <h2>Error 1: documentos sin apostillar o con fecha caducada</h2>
        <p>
          Los certificados de antecedentes penales y de estado civil tienen una validez de 3 meses.
          Presentarlos fuera de plazo es motivo de denegación directa. Apostillar en el país de origen
          puede tomar 2 a 4 semanas; planifícalo.
        </p>
        <h2>Error 2: traducciones no oficiales</h2>
        <p>
          Solo se aceptan traducciones juradas por traductores habilitados por el Ministerio de Asuntos
          Exteriores de España. Una traducción de Google Translate o de una agencia no certificada no
          vale.
        </p>
        <h2>Error 3: no verificar la homologación del título</h2>
        <p>
          Si quieres ejercer una profesión regulada (medicina, arquitectura, derecho, ingeniería), tu
          título debe estar homologado antes de poder trabajar. El trámite puede tardar entre 6 meses y
          2 años. Llegarlo a España sin iniciarlo es un error costoso.
        </p>
        <h2>Error 4: seguro médico con copagos o exclusiones</h2>
        <p>
          El seguro médico debe cubrir todo el territorio español, sin copagos y sin exclusiones por
          enfermedades preexistentes. Muchos seguros "baratos" no cumplen estos requisitos y el consulado
          los rechaza.
        </p>
        <h2>Error 5: no justificar el vínculo con el país de origen</h2>
        <p>
          Los consulados quieren ver que tienes razones para volver (propiedad, familia, trabajo) si el
          visado es temporal. Incluir esta documentación voluntariamente refuerza el expediente y reduce
          suspicacias.
        </p>
      </>
    ),
  },
];

/* ─── Blog listing ──────────────────────────────────────── */
const BlogHero = () => (
  <section className="relative isolate overflow-hidden bg-[var(--ink)] text-white rounded-b-[28px]">
    <div
      className="absolute inset-0 opacity-[0.06] pointer-events-none"
      style={{
        backgroundImage:
          'linear-gradient(var(--brand) 1px, transparent 1px), linear-gradient(90deg, var(--brand) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }}
    />
    <div className="mx-auto max-w-[1000px] px-6 pt-24 pb-20 md:pt-32 md:pb-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium
                   bg-[var(--brand)]/12 text-[var(--brand)] border border-[var(--brand)]/25 mb-6"
      >
        Blog
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="font-semibold tracking-[-0.035em] leading-[1.0] text-[48px] md:text-[72px]"
      >
        Guías y recursos para{' '}
        <span className="italic font-normal text-white/80" style={{ fontFamily: "'Fraunces', serif" }}>
          emigrar con claridad
        </span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-6 text-[17px] leading-[1.55] text-white/60 max-w-[580px] mx-auto"
      >
        Información actualizada sobre visados, trámites y vida en España para la comunidad
        latinoamericana.
      </motion.p>
    </div>
  </section>
);

const PostCard = ({ post, index }: { post: Post; index: number }) => (
  <motion.article
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    className="group relative flex flex-col rounded-2xl bg-white border border-black/5 p-7 tonal-lift
               hover:border-black/12 hover:shadow-md transition-all duration-200"
  >
    <div className="flex items-center justify-between mb-5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)] bg-[var(--brand)]/10 px-2.5 py-1 rounded-full">
        {post.category}
      </span>
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink)]/40">
        <Clock size={12} />
        {post.readTime}
      </div>
    </div>
    <h2 className="text-[20px] font-semibold tracking-[-0.02em] leading-[1.25] text-[var(--ink)] mb-3
                   group-hover:text-[var(--brand-ink)] transition-colors">
      {post.title}
    </h2>
    <p className="text-[14.5px] leading-[1.6] text-[var(--ink)]/60 flex-1">{post.excerpt}</p>
    <div className="mt-6 pt-5 border-t border-dashed border-black/8 flex items-center justify-between">
      <span className="text-[12px] text-[var(--ink)]/35">{post.date}</span>
      <Link
        to={`/blog/${post.slug}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand-ink)]
                   hover:gap-2.5 transition-all"
      >
        Leer artículo
        <ArrowRight size={14} />
      </Link>
    </div>
  </motion.article>
);

const BlogList = () => (
  <div className="bg-surface-container-lowest min-h-screen font-sans pt-[72px]">
    <BlogHero />
    <section className="mx-auto max-w-[1200px] px-6 py-20">
      <div className="grid md:grid-cols-2 gap-5">
        {POSTS.map((post, i) => (
          <React.Fragment key={post.slug}>
            <PostCard post={post} index={i} />
          </React.Fragment>
        ))}
      </div>
    </section>
  </div>
);

/* ─── Post detail ───────────────────────────────────────── */
const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = POSTS.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="bg-surface-container-lowest min-h-screen font-sans pt-[72px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--ink)]/50 mb-4">Artículo no encontrado.</p>
          <Link to="/blog" className="text-[var(--brand-ink)] font-semibold underline">
            Volver al blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest min-h-screen font-sans pt-[72px]">
      {/* Post hero */}
      <section className="relative isolate overflow-hidden bg-[var(--ink)] text-white rounded-b-[28px]">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(var(--brand) 1px, transparent 1px), linear-gradient(90deg, var(--brand) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="mx-auto max-w-[800px] px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-[13px] text-white/50 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={14} />
              Volver al blog
            </Link>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)] bg-[var(--brand)]/12 border border-[var(--brand)]/20 px-2.5 py-1 rounded-full">
                {post.category}
              </span>
              <div className="flex items-center gap-1.5 text-[12px] text-white/40">
                <Clock size={12} />
                {post.readTime}
              </div>
              <span className="text-[12px] text-white/30">{post.date}</span>
            </div>
            <h1 className="text-[36px] md:text-[56px] font-semibold tracking-[-0.03em] leading-[1.08] mb-5">
              {post.title}
            </h1>
            <p className="text-[17px] leading-[1.6] text-white/60 max-w-[640px]">{post.excerpt}</p>
          </motion.div>
        </div>
      </section>

      {/* Post body */}
      <article className="mx-auto max-w-[720px] px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="prose-qe"
        >
          {post.body}
        </motion.div>

        {/* CTA al final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-[24px] bg-[var(--ink)] text-white p-8 md:p-10"
        >
          <p className="text-[20px] font-semibold tracking-[-0.02em] leading-[1.3] mb-4">
            ¿Necesitas ayuda con tu caso específico?
          </p>
          <p className="text-[14.5px] text-white/60 leading-[1.6] mb-6">
            Cada expediente es distinto. Cuéntanos el tuyo y te damos un diagnóstico honesto.
          </p>
          <Link
            to="/#contacto"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] text-[var(--brand-ink)]
                       font-semibold px-5 py-3 text-[14.5px] hover:opacity-90 transition-opacity"
          >
            Reservar diagnóstico
            <ArrowRight size={15} />
          </Link>
        </motion.div>

        <div className="mt-12 flex items-center justify-between">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--ink)]/50 hover:text-[var(--ink)] transition-colors"
          >
            <ArrowLeft size={14} />
            Todos los artículos
          </Link>
        </div>
      </article>
    </div>
  );
};

/* ─── Styles for prose ──────────────────────────────────── */
const ProseStyles = () => (
  <style>{`
    .prose-qe p { margin-bottom: 1.25rem; font-size: 16.5px; line-height: 1.75; color: rgba(26,28,28,0.75); }
    .prose-qe h2 { margin-top: 2.5rem; margin-bottom: 0.75rem; font-size: 22px; font-weight: 600;
                   letter-spacing: -0.02em; color: #1A1C1C; }
    .prose-qe h2:first-child { margin-top: 0; }
  `}</style>
);

/* ─── Exports ───────────────────────────────────────────── */
export const BlogListPage = () => (
  <>
    <ProseStyles />
    <BlogList />
  </>
);

export const BlogPostPage = () => (
  <>
    <ProseStyles />
    <BlogPost />
  </>
);
