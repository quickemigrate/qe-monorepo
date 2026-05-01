# CLAUDE.md — Quick Emigrate (QE)

## REGLAS PARA CLAUDE CODE

# 1. No programar sin contexto
- ANTES de escribir codigo: lee los archivos relevantes, revisa git log, entiende la arquitectura.
- Si no tienes contexto suficiente, pregunta. No asumas.

# 2. Respuestas cortas
- Responde en 1-3 oraciones. Sin preambulos, sin resumen final.
- No repitas lo que el usuario dijo. No expliques lo obvio.
- Codigo habla por si mismo: no narres cada linea que escribes.

# 3. No reescribir archivos completos
- Usa Edit (reemplazo parcial), NUNCA Write para archivos existentes salvo que el cambio sea >80% del archivo.
- Cambia solo lo necesario. No "limpies" codigo alrededor del cambio.

# 4. No releer archivos ya leidos
- Si ya leiste un archivo en esta conversacion, no lo vuelvas a leer salvo que haya cambiado.
- Toma notas mentales de lo importante en tu primera lectura.

# 5. Validar antes de declarar hecho
- Despues de un cambio: compila, corre tests, o verifica que funciona.
- Nunca digas "listo" sin evidencia de que funciona.

# 6. Cero charla aduladora
- No digas "Excelente pregunta", "Gran idea", "Perfecto", etc.
- No halagues al usuario. Ve directo al trabajo.

# 7. Soluciones simples
- Implementa lo minimo que resuelve el problema. Nada mas.
- No agregues abstracciones, helpers, tipos, validaciones, ni features que no se pidieron.
- 3 lineas repetidas > 1 abstraccion prematura.

# 8. No pelear con el usuario
- Si el usuario dice "hazlo asi", hazlo asi. No debatas salvo riesgo real de seguridad o perdida de datos.
- Si discrepas, menciona tu concern en 1 oracion y procede con lo que pidio.

# 9. Leer solo lo necesario
- No leas archivos completos si solo necesitas una seccion. Usa offset y limit.
- Si sabes la ruta exacta, usa Read directo. No hagas Glob + Grep + Read cuando Read basta.

# 10. No narrar el plan antes de ejecutar
- No digas "Voy a leer el archivo, luego modificar la funcion, luego compilar...". Solo hazlo.
- El usuario ve tus tool calls. No necesita un preview en texto.

# 11. Paralelizar tool calls
- Si necesitas leer 3 archivos independientes, lee los 3 en un solo mensaje, no uno por uno.
- Menos roundtrips = menos tokens de contexto acumulado.

# 12. No duplicar codigo en la respuesta
- Si ya editaste un archivo, no copies el resultado en tu respuesta. El usuario lo ve en el diff.
- Si creaste un archivo, no lo muestres entero en texto tambien.

# 13. No usar Agent cuando Grep/Read basta
- Agent duplica todo el contexto en un subproceso. Solo usalo para busquedas amplias o tareas complejas.
- Para buscar una funcion o archivo especifico, usa Grep o Glob directo

## CONTEXTO
LegalTech SaaS: latinoamericanos→España. Pablo=CTO · Manu=CEO

## STACK
FE: React+TS+Vite+Tailwind+motion/react+lucide+Firebase Auth
BE: Node+Express+TS+firebase-admin+Resend+PayPal+Anthropic+PDFKit+Pinecone+VoyageAI
DB: Firestore(quick-emigrate) + Pinecone(quickemigrate-legal)
Deploy: Vercel(FE)+Railway(BE) · dominio: quickemigrate.com · repo: github.com/quickemigrate/qe-monorepo

## URLS
FE: https://quickemigrate.com · BE: https://qe-production.up.railway.app
Paths: /admin/login · /cliente/login · /diagnostico · /admin/conocimiento

## ESTRUCTURA
FE components: frontend/src/components/{admin/AdminLayout,client/ClientLayout}.tsx
FE landing: Navbar,Hero,Problem,Solution,HowItWorks,Services,Trust,FAQ,Contact,Footer
FE pages admin: frontend/src/pages/admin/{Dashboard,Leads,Expedientes,Blog,Conocimiento}
FE pages client: frontend/src/pages/client/{Login,Dashboard} · auth: ProtectedRoute+ClientProtectedRoute
FE pages extra: /sobre-nosotros · /blog/:slug · /diagnostico/exito · Vercel Analytics+SpeedInsights
BE config: backend/src/config/{firebase,paypal,pinecone}.ts
BE services: backend/src/services/{embeddings←VoyageAI, rag←ingestar/buscar/contexto}.ts
BE routes: backend/src/routes/{contact,diagnostico,expedientes,leads,articles,conocimiento}.ts

## ENV BACKEND (Railway)
PORT=3001 · FRONTEND_URL · RESEND_{API_KEY,FROM_EMAIL} · CONTACT_EMAIL
FIREBASE_SERVICE_ACCOUNT · ADMIN_EMAIL_{1,2}
PAYPAL_{CLIENT_ID,CLIENT_SECRET} · PAYPAL_MODE=sandbox→live cuando empresa
ANTHROPIC_API_KEY · PINECONE_{API_KEY,INDEX_NAME=quickemigrate-legal,INDEX_HOST=quickemigrate-legal-crf2ocj.svc.aped-4627-b74a.pinecone.io}
VOYAGE_API_KEY

## ENV FRONTEND (Vercel)
VITE_BACKEND_URL · VITE_FIREBASE_{API_KEY,AUTH_DOMAIN,PROJECT_ID,STORAGE_BUCKET,MESSAGING_SENDER_ID,APP_ID}
VITE_ADMIN_EMAIL_{1,2} · VITE_PAYPAL_CLIENT_ID

## RUTAS BACKEND
| Método | Ruta | Auth | Acción |
|--------|------|------|--------|
| POST | /api/contact | — | Resend+lead Firestore |
| GET/PATCH | /api/leads | admin | CRUD leads |
| GET/POST/PATCH | /api/expedientes | admin | CRUD expedientes |
| GET | /api/client/expediente | cliente | timeline cliente |
| GET/POST/PATCH | /api/articles | mixto | CMS blog |
| POST | /api/diagnostico/create-order | — | Firestore+PayPal orden |
| POST | /api/diagnostico/capture-order | — | PayPal→RAG→Claude→PDF→Resend |
| GET | /api/diagnostico/:id | — | estado |
| GET | /api/diagnostico/:id/pdf | cliente | descarga PDF (solo propietario) |
| GET/POST/DELETE | /api/conocimiento | admin | CRUD KB |
| GET | /api/conocimiento/search | admin | búsqueda semántica |
| POST | /api/conocimiento/sincronizar-pinecone | admin | sync Firestore→Pinecone |
| POST | /api/usuarios/registro | — | crea doc Firestore |
| GET/PUT | /api/usuarios/perfil | cliente | onboarding+perfil |

## FIRESTORE
- leads: nombre,email,pais,interes,mensaje,estado
- expedientes: nombre,email,pais,tipoVisado,estado,notas
- articles: title,slug,excerpt,content,country,status,metaDescription · índice: status ASC+publishedAt DESC
- diagnosticos: respuestas,estado,informe,pdfBase64,completadoEn
- conocimiento: titulo,contenido,fuente,categoria,pais,url,fechaPublicacion,fechaIngesta

## RAG
Pinecone(quickemigrate-legal, 1024d, cosine, us-east-1) + voyageai SDK voyage-3 + Firestore(conocimiento)
Ingest: texto→generateEmbedding→Pinecone+Firestore
Query: búsqueda semántica→contexto legal→Claude prompt

## MODELO DE NEGOCIO (en revisión)
Starter 59€: diagnóstico IA+PDF · Pro 39€/mes: área cliente+chat IA · Premium: Pro+asesor humano

## LOGOS
PDF: `path.join(__dirname, '../assets/logo-dark-iso.png')` (cabeceras, portada, final)
Web: /public/logo-{light,dark}.png · Email: SVG placeholder (pendiente)

## FLUJO CLIENTE
1. /cliente/login — toggle login/registro
2. Registro: createUserWithEmailAndPassword → POST /api/usuarios/registro → /cliente/onboarding
3. Login: perfilCompleto? → /cliente/inicio : /cliente/onboarding
4. Onboarding: wizard 3 pasos → PUT /api/usuarios/perfil → perfilCompleto:true → /cliente/inicio
5. OnboardingGuard protege /cliente/* (excepto login+onboarding)

## DIAGNÓSTICO PDF
pdfBase64 en diagnosticos/{id}.pdfBase64 · límite 1MB Firestore (migrar a Storage) · campo completadoEn

## NOTAS TÉCNICAS
- CORS: localhost:3000,5173 · quickemigrate.com · www.quickemigrate.com · *.vercel.app
- Railway: port 3001
- PayPal: client-side (create-order→popup→capture-order, no webhook) · sandbox: developer.paypal.com
- Voyage AI: SDK `voyageai` (NO anthropic.embeddings — no disponible en v0.90.0)
- Logo PDFKit: backend/src/assets/ (no raíz monorepo)

## PENDIENTES
- [ ] SVG logo real en emails
- [ ] Bug PDF: "Semana 2-3:" se corta en próximos pasos
- [ ] Scraper BOE automático (cron Railway)
- [ ] PayPal live (PAYPAL_MODE=live)
- [ ] Google Search Console: verificar dominio
- [ ] BD scraping Manu → Pinecone
- [ ] Migrar PDFs a Firebase Storage

---

## ESTADO ACTUAL — 2026-05-01

### Stack confirmado en producción

**Backend**
| Paquete | Versión |
|---|---|
| express | ^4.18.2 |
| typescript | ^5.4.5 |
| firebase-admin | ^13.8.0 |
| @anthropic-ai/sdk | ^0.90.0 |
| voyageai | ^0.2.1 (PAUSADO) |
| pdfkit | ^0.18.0 |
| resend | ^3.2.0 |
| @paypal/checkout-server-sdk | ^1.0.3 |
| @pinecone-database/pinecone | ^7.2.0 (PAUSADO) |
| @google/generative-ai | ^0.24.1 (instalado, no usado) |
| openai | ^6.34.0 (instalado, no usado activamente) |
| node-cron | ^4.2.1 |
| multer | ^2.1.1 |
| cheerio | ^1.2.0 |
| nodemailer | ^8.0.5 (instalado, no usado — usar Resend) |
| axios | ^1.15.2 |

**Frontend**
| Paquete | Versión |
|---|---|
| react | ^19.0.0 |
| typescript | ~5.8.2 |
| vite | ^6.2.0 |
| tailwindcss | ^4.1.14 |
| firebase | ^12.12.1 |
| react-router-dom | ^7.14.1 |
| motion | ^12.23.24 |
| lucide-react | ^0.546.0 |
| @paypal/react-paypal-js | ^9.1.1 |
| @tiptap/react | ^3.22.4 |
| react-markdown | ^10.1.0 |
| react-pdf | ^10.4.1 |
| @stripe/stripe-js | ^9.2.0 (instalado, NO usado — eliminar) |
| @google/genai | ^1.29.0 (instalado, NO usado — eliminar) |
| animejs | instalado, NO usado — eliminar |

### Colecciones Firestore activas

**quick-emigrate (lógica de negocio):**
| Colección | Propósito |
|---|---|
| `leads` | Captación: formulario contacto, estado CRM |
| `expedientes` | Casos de inmigración, timeline |
| `articles` | CMS blog (title, slug, excerpt, content, status, publishedAt) |
| `diagnosticos` | Informes IA: respuestas, estado, informe, pdfBase64, completadoEn |
| `usuarios` | Perfiles clientes (email=docId), plan, perfilCompleto, onboarding |
| `usuarios/{email}/chat` | Subcolección: historial mensajes por usuario |
| `config` | Config runtime: planes (precios), chat (límites, sistema prompt) |

**quick-emigrate-conocimiento (RAG — proyecto Firebase separado via FIREBASE_SERVICE_ACCOUNT_CONOCIMIENTO):**
| Colección | Propósito |
|---|---|
| `migration_routes` | Rutas migratorias activas |
| `route_requirements` | Requisitos legales por ruta |
| `route_documents` | Documentos requeridos por ruta |
| `route_costs` | Costes estimados por ruta |
| `risk_catalog` | Catálogo de riesgos |
| `consulates` | Datos consulados por país |
| `training_cases` | Casos ejemplo para RAG |
| `documents` / `document_chunks` | Documentos ingestados (legacy) |

**ALERTA**: El admin UI de Conocimiento (`/admin/conocimiento`) escribe en colecciones del proyecto `quick-emigrate` principal (`rutas_migratorias`, `base_conocimiento`, `requisitos_legales`, `simulaciones`, `casos_reales`). El servicio RAG (`rag.ts`) lee del proyecto `quick-emigrate-conocimiento`. Estos dos sistemas NO están conectados — los datos del admin UI nunca llegan al RAG.

### Endpoints backend activos

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| GET | /health | — | Health check |
| POST | /api/contact | — | Formulario contacto → Resend + lead |
| GET | /api/leads | admin | Listar leads |
| PATCH | /api/leads/:id | admin | Actualizar estado/notas lead |
| GET | /api/expedientes | admin | Listar expedientes |
| POST | /api/expedientes | admin | Crear expediente |
| PATCH | /api/expedientes/:id | admin | Actualizar expediente (sin whitelist — ver problemas) |
| GET | /api/client/expediente | cliente | Timeline expediente propio |
| GET | /api/articles | — | Blog público (status=published) |
| GET | /api/articles/admin/all | admin | Todos los artículos |
| POST | /api/articles | admin | Crear artículo |
| PATCH | /api/articles/:id | admin | Actualizar artículo (sin whitelist) |
| DELETE | /api/articles/:id | admin | Eliminar artículo |
| GET | /api/articles/:slug | — | Artículo por slug |
| POST | /api/diagnostico/create-order | — (opcional Bearer) | Crear orden PayPal + Firestore |
| POST | /api/diagnostico/capture-order | — | Capturar pago → IA → PDF → Email |
| GET | /api/diagnostico/:id/pdf | cliente | Descargar PDF (solo propietario) |
| GET | /api/diagnostico/:id | cliente | Estado diagnóstico |
| GET | /api/conocimiento | admin | Listar KB por colección |
| GET | /api/conocimiento/search | admin | Búsqueda semántica (ROTA — ver problemas) |
| POST | /api/conocimiento | admin | Crear entrada KB |
| DELETE | /api/conocimiento/:coleccion/:id | admin | Eliminar entrada KB |
| PATCH | /api/conocimiento/:coleccion/:id | admin | Actualizar entrada KB |
| POST | /api/conocimiento/sincronizar-pinecone | admin | Sync → Pinecone (stub, pausado) |
| GET | /api/usuarios | admin | Listar usuarios |
| GET | /api/usuarios/perfil | cliente | Perfil propio |
| PUT | /api/usuarios/perfil | cliente | Actualizar perfil/onboarding |
| POST | /api/usuarios/registro | — | Crear doc Firestore tras registro Auth |
| POST | /api/usuarios/sincronizar | admin | Sync Firebase Auth → Firestore |
| POST | /api/usuarios | admin | Crear usuario manualmente |
| DELETE | /api/usuarios/:id | admin | Eliminar usuario |
| PATCH | /api/usuarios/:id | admin | Actualizar usuario |
| GET | /api/chat/historial | cliente | Historial mensajes |
| GET | /api/chat/estado | cliente | Estado plan (mensajes usados/límite) |
| POST | /api/chat/consentimiento | cliente | Aceptar términos chat |
| POST | /api/chat/mensaje | cliente | Enviar mensaje → Claude |
| GET | /api/config/planes | — | Planes y precios (público) |
| PUT | /api/config/planes | admin | Actualizar planes |
| GET | /api/config/chat | admin | Config chat (prompt, límites) |
| PATCH | /api/config/chat | admin | Actualizar config chat |
| GET | /api/metricas | admin | Dashboard métricas (full scans — ver problemas) |

### Variables de entorno requeridas

**Backend (Railway):**
```
PORT=3001
FIREBASE_SERVICE_ACCOUNT=<JSON completo>
FIREBASE_SERVICE_ACCOUNT_CONOCIMIENTO=<JSON completo — proyecto RAG>
ADMIN_EMAIL_1=<email admin 1>
ADMIN_EMAIL_2=<email admin 2>
RESEND_API_KEY=<key>
RESEND_FROM_EMAIL=hola@quickemigrate.com
CONTACT_EMAIL=<destinatario contacto>
PAYPAL_CLIENT_ID=<id>
PAYPAL_CLIENT_SECRET=<secret>
PAYPAL_MODE=sandbox|live
ANTHROPIC_API_KEY=<key>
PINECONE_API_KEY=<key — pausado>
PINECONE_INDEX_NAME=quickemigrate-legal
PINECONE_INDEX_HOST=quickemigrate-legal-crf2ocj.svc.aped-4627-b74a.pinecone.io
VOYAGE_API_KEY=<key — pausado>
```

**Frontend (Vercel):**
```
VITE_BACKEND_URL=https://qe-production.up.railway.app
VITE_FIREBASE_API_KEY=<key>
VITE_FIREBASE_AUTH_DOMAIN=<domain>
VITE_FIREBASE_PROJECT_ID=<id>
VITE_FIREBASE_STORAGE_BUCKET=<bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<id>
VITE_FIREBASE_APP_ID=<id>
VITE_ADMIN_EMAIL_1=<email admin 1>
VITE_ADMIN_EMAIL_2=<email admin 2>
VITE_PAYPAL_CLIENT_ID=<id>
```

### Problemas conocidos activos

**[CRÍTICO]** `backend/src/routes/conocimiento.ts:54` — Búsqueda KB rota: upper bound `q + ''` = `q`, query devuelve siempre 0 resultados. Fix: cambiar a `q + ''`.

**[CRÍTICO]** `backend/src/routes/metricas.ts:10` — Full collection scans sin límite en `diagnosticos`, `usuarios`, `leads` en cada carga del dashboard. Explotará Firestore quota al escalar.

**[CRÍTICO]** `backend/src/routes/diagnostico.ts:145` — `capture-order` sin auth: cualquiera con orderId+diagnosticoId puede disparar IA+email gratis.

**[CRÍTICO]** `backend/src/routes/usuarios.ts:76` — `POST /api/usuarios/registro` sin auth: escritura arbitraria en Firestore para cualquier email. Con `merge:true` puede sobrescribir docs existentes.

**[CRÍTICO]** `backend/src/routes/client.ts:6` — Auth inline duplicada en vez de usar `verifyClientToken` middleware. Deriva de seguridad en futuras modificaciones.

**[IMPORTANTE]** `backend/src/routes/diagnostico.ts:177` — `procesarConRetry()` fire-and-forget sin await. Si el proceso muere, el usuario paga y no recibe informe. Sin job queue persistente.

**[IMPORTANTE]** `backend/src/routes/diagnostico.ts:416` — PDF como base64 en Firestore: límite 1MB, PDFs complejos fallan silenciosamente.

**[IMPORTANTE]** `backend/src/routes/expedientes.ts:50` + `articles.ts:84` + `usuarios.ts:149` — Spread de `req.body` sin whitelist en updates: mass-assignment, riesgo de data corruption.

**[IMPORTANTE]** `backend/src/routes/chat.ts:138` — Query ordenada en subcolección `usuarios/{email}/chat` sin índice compuesto en Firestore. Fallará en producción.

**[IMPORTANTE]** `backend/src/routes/diagnostico.ts:359` — Modelo Anthropic hardcoded `claude-sonnet-4-6`. Requiere deploy para cambiar. Mover a env var o `config` Firestore.

**[IMPORTANTE]** `frontend/src/components/OnboardingGuard.tsx` — Re-fetch `/api/usuarios/perfil` en cada navegación cliente. 3-5 llamadas redundantes por minuto de uso normal.

**[MENOR]** `frontend/src/pages/client/ClientDashboard.tsx` — Componente importado en App.tsx pero sin ruta asignada. Código muerto.

**[MENOR]** `frontend/src/context/ClientAuthContext.tsx` — Archivo entero muerto: re-exports que nadie importa.

**[MENOR]** `backend/src/middleware/cors.ts` — Archivo muerto: `corsMiddleware` nunca importado en `index.ts`.

**[MENOR]** `backend/src/routes/leads.ts:27` — PATCH escribe `estado` y `notas` aunque solo llegue uno. Si `notas` es undefined, puede borrar el campo en Firestore.

**[MENOR]** `frontend/src/firebase.ts:15` — `googleProvider` exportado sin flujo Google Sign-In en la app.

**[MENOR]** `frontend/vite.config.ts:11` — `GEMINI_API_KEY` inyectado en bundle sin uso en código frontend.

**[MENOR]** `frontend/src/pages/client/Inicio.tsx:14` — Worker PDF apunta a CDN unpkg. Si cae unpkg, PDF preview falla.

**[MENOR]** `backend/src/routes/usuarios.ts:46` — `listUsers()` sin paginación: silently trunca en >1000 usuarios.

**[MEJORA]** `backend/src/routes/diagnostico.ts` — Función `generarPDF` (240 líneas) inline en ruta. Extraer a `backend/src/services/pdf.ts`.

**[MEJORA]** `backend/src/routes/chat.ts:10` + `diagnostico.ts:16` — `normalizarObjetivo` duplicado en ambos archivos. Extraer a utils.

**[MEJORA]** `firestore.indexes.json` — Índices definidos para colecciones del admin KB nunca usadas por queries activos. Faltan índices para `diagnosticos.completadoEn`, `usuarios.creadoEn`, `leads.createdAt`, `articles.status+publishedAt`.

**[MEJORA]** Deps frontend sin usar: `@stripe/stripe-js`, `@google/genai`, `animejs`. Eliminar para reducir bundle.

**[MEJORA]** Backend: `nodemailer`, `openai`, `@google/generative-ai` instalados pero sin uso activo. Eliminar.

### Decisiones de arquitectura tomadas

- **RAG sobre Firestore** — Pinecone/VoyageAI pausados hasta tener ingresos. `rag.ts` funciona con Firestore puro. Reconectar cuando haya volumen.
- **PDF como base64 en Firestore** — Firebase Storage requiere plan Blaze (pago). Migrar cuando se active la cuenta de facturación.
- **PayPal live sobre cuenta particular** — Empresa pendiente constitución. Cambiar `PAYPAL_MODE=live` cuando esté constituida.
- **Dos proyectos Firebase separados** — `quick-emigrate` (negocio) y `quick-emigrate-conocimiento` (RAG/KB). Separación por seguridad y facturación. El admin UI y el RAG deben unificarse o conectarse (problema activo).
- **Email como Firestore document ID en `usuarios`** — Simple y queryable. Migrar email = migrar documento.
- **Admin auth por whitelist de emails** — Env vars `ADMIN_EMAIL_{1,2}` en backend y frontend por separado. Sin Firebase Custom Claims. Añadir un 3er admin requiere deploy.
- **fire-and-forget en capture-order** — Intencional: evita timeout en respuesta PayPal. Trade-off: sin job queue persistente.
- **Plan-gating en backend** — Frontend oculta UI pero backend es la única enforcement real para `/api/chat/mensaje`. Correcto.
- **localStorage para estado sidebar y caché planes** — `qe_sidebar_collapsed`, `qe_planes_cache` (TTL 5min). Intencional para UX.
- **Resend como proveedor email** — `nodemailer` instalado pero no usar. Siempre usar Resend.

### Mejoras pendientes priorizadas

🔴 **Alta prioridad:**
- Reparar búsqueda KB (`q + ''`)
- Añadir auth a `capture-order` o validar PayPal order status antes de procesar
- Añadir whitelist a todos los PATCH/PUT endpoints (expedientes, articles, usuarios/perfil)
- Conectar admin KB UI con el sistema RAG (unificar proyectos Firebase o sincronizar colecciones)
- Añadir índice Firestore para `usuarios/{email}/chat` (timestamp ordering)
- Limitar queries en `/api/metricas` (usar `.count()` aggregation + limits)

🟡 **Media prioridad:**
- Extraer `generarPDF` a `backend/src/services/pdf.ts`
- Mover modelo Anthropic a env var (`ANTHROPIC_MODEL=claude-sonnet-4-6`)
- Añadir job queue persistente para diagnósticos (o al menos polling de estado con retry)
- Eliminar re-fetch de perfil en `OnboardingGuard` (usar contexto compartido)
- Unificar `normalizarObjetivo` en utils
- Migrar PDFs a Firebase Storage (activar plan Blaze)
- Añadir paginación a `listUsers()` en sincronizar endpoint

🟢 **Baja prioridad / backlog:**
- Eliminar deps sin uso: `@stripe/stripe-js`, `@google/genai`, `animejs` (frontend); `nodemailer`, `openai`, `@google/generative-ai` (backend)
- Eliminar archivos muertos: `ClientDashboard.tsx`, `ClientAuthContext.tsx`, `cors.ts` (backend middleware)
- Usar `verifyClientToken` middleware en `client.ts` (eliminar inline auth)
- Añadir `googleProvider` o eliminarlo de `firebase.ts`
- Mover CORS config a `cors.ts` y eliminar inline en `index.ts`
- Definir índices Firestore correctos para queries activos
- Reemplazar CDN unpkg worker con copia local para react-pdf

### Archivos críticos — mapa de dependencias

**Auth flow:**
```
frontend/src/context/AuthContext.tsx
  ← frontend/src/components/ProtectedRoute.tsx (admin)
  ← frontend/src/components/ClientProtectedRoute.tsx (cliente)
      ← frontend/src/components/OnboardingGuard.tsx
          ← frontend/src/App.tsx (wraps all /cliente/* routes)
backend/src/middleware/auth.ts (verifyToken — admin)
backend/src/middleware/clientAuth.ts (verifyClientToken — cliente)
  ← todas las rutas protegidas de cliente
```

**RAG / Diagnóstico:**
```
backend/src/config/firebase.ts (db — proyecto principal)
backend/src/config/firebaseKnowledge.ts (dbKnowledge — proyecto RAG)
backend/src/services/embeddings.ts (PAUSADO — VoyageAI)
backend/src/services/rag.ts
  ← backend/src/routes/diagnostico.ts (obtenerContextoLegal)
  ← backend/src/routes/chat.ts (obtenerContextoLegal)
backend/src/assets/logo-dark-iso.png
  ← backend/src/routes/diagnostico.ts (PDFKit)
```

**Pagos:**
```
backend/src/config/paypal.ts
  ← backend/src/routes/diagnostico.ts (create-order + capture-order)
frontend: @paypal/react-paypal-js
  ← frontend/src/pages/DiagnosticoPage.tsx (PayPal popup)
```

**Config runtime:**
```
Firestore collection 'config'
  ← backend/src/routes/config.ts (GET/PUT planes, GET/PATCH chat)
  ← backend/src/routes/chat.ts (límites, sistema prompt)
  ← backend/src/routes/diagnostico.ts (precio diagnóstico)
  ← frontend/src/hooks/usePlanes.ts (planes y precios — con caché localStorage)
```
