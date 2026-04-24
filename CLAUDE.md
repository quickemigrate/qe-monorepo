# CLAUDE.md — Quick Emigrate (Q_E)

## CONTEXTO DEL PROYECTO
Quick Emigrate es una plataforma LegalTech SaaS para ayudar a latinoamericanos a emigrar legalmente a España. 
- **Pablo** = CTO (técnico)
- **Manu** = CEO (negocio/estrategia)

## STACK TÉCNICO
- **Frontend:** React + TypeScript + Vite + Tailwind + motion/react + lucide-react + Firebase Auth
- **Backend:** Node.js + Express + TypeScript + firebase-admin + Resend + Stripe + Anthropic Claude API + PDFKit + Pinecone + Voyage AI
- **DB:** Firestore (proyecto: `quick-emigrate`) + Pinecone (índice: `quickemigrate-legal`)
- **Deploy:** Vercel (frontend) + Railway (backend)
- **Dominio:** `quickemigrate.com`
- **Repo:** `github.com/quickemigrate/qe-monorepo` (monorepo)

## URLS
- Frontend: https://quickemigrate.com
- Backend: https://qe-production.up.railway.app
- Admin: `/admin/login`
- Cliente: `/cliente/login`
- Diagnóstico: `/diagnostico`
- Conocimiento: `/admin/conocimiento`

## ESTRUCTURA DEL MONOREPO
qe-monorepo/
├── frontend/src/
│   ├── components/
│   │   ├── admin/AdminLayout.tsx
│   │   └── client/ClientLayout.tsx
│   └── pages/
│       ├── admin/ (Dashboard, Leads, Expedientes, Blog, Conocimiento)
│       └── client/ (Login, Dashboard)
├── backend/src/
│   ├── config/
│   │   ├── firebase.ts
│   │   └── pinecone.ts
│   ├── services/
│   │   ├── embeddings.ts   ← Voyage AI
│   │   └── rag.ts          ← ingestar, buscar, obtenerContextoLegal
│   └── routes/
│       ├── contact.ts
│       ├── diagnostico.ts
│       ├── expedientes.ts
│       ├── leads.ts
│       ├── articles.ts
│       └── conocimiento.ts
└── assets/logos/
├── logo-dark-iso.png       ← PDF cabeceras (ruta: backend/src/assets/)
├── logo-light-iso.png
├── logo-dark-bg-iso.png
└── logo-light-bg-iso.png

## VARIABLES DE ENTORNO

### Backend (Railway)
PORT=3001
FRONTEND_URL=https://quickemigrate.com
RESEND_API_KEY=...
RESEND_FROM_EMAIL=Quick Emigrate hola@quickemigrate.com
CONTACT_EMAIL=quickemigrate@gmail.com
FIREBASE_SERVICE_ACCOUNT={...json compacto...}
ADMIN_EMAIL_1=...
ADMIN_EMAIL_2=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
ANTHROPIC_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=quickemigrate-legal
PINECONE_INDEX_HOST=quickemigrate-legal-crf2ocj.svc.aped-4627-b74a.pinecone.io
VOYAGE_API_KEY=...

### Frontend (Vercel)
VITE_BACKEND_URL=https://qe-production.up.railway.app
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=quick-emigrate.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=quick-emigrate
VITE_FIREBASE_STORAGE_BUCKET=quick-emigrate.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=463770642277
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_EMAIL_1=...
VITE_ADMIN_EMAIL_2=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

## LO QUE ESTÁ CONSTRUIDO ✅

### Frontend
- Landing completa: Navbar, Hero, Problem, Solution, HowItWorks, 
  ServicesSection (planes Free/Starter/Pro/Premium), Trust, FAQ, Contact, Footer
- Páginas: `/sobre-nosotros`, `/blog`, `/blog/:slug`, `/diagnostico`, `/diagnostico/exito`
- Admin panel: Dashboard, Leads, Expedientes, Blog CMS (TipTap), Conocimiento
- Área cliente: login + dashboard con timeline
- Firebase Auth con ProtectedRoute y ClientProtectedRoute
- Vercel Analytics + Speed Insights
- Logos integrados en: Navbar, Footer, AdminLayout, ClientLayout, LoginPages

### Backend
- `/api/contact` → Resend email + lead en Firestore
- `/api/leads` (GET/PATCH) — protegido verifyToken
- `/api/expedientes` (GET/POST/PATCH) — protegido
- `/api/client/expediente` (GET) — token Firebase cliente
- `/api/articles` — CMS público y admin
- `/api/diagnostico/checkout` → Firestore + Stripe checkout
- `/api/diagnostico/webhook` → verifica Stripe → RAG contexto → Claude API → PDFKit → Resend
- `/api/diagnostico/:id` → estado del diagnóstico
- `/api/conocimiento` (GET/POST/DELETE/search) — protegido

### RAG (Retrieval Augmented Generation)
- **Pinecone** como vector DB (índice: `quickemigrate-legal`, 1024 dims, cosine, us-east-1)
- **Voyage AI** (`voyage-3`) para embeddings vía SDK `voyageai`
- **Firestore** colección `conocimiento` para texto completo
- Flujo: documento → embedding → Pinecone + Firestore
- En diagnóstico: búsqueda semántica → contexto legal → prompt de Claude
- Admin `/admin/conocimiento`: CRUD de documentos + buscador semántico
- 5 documentos base ingresados: visados, estudios, residencia, arraigo, nacionalidades

## FIRESTORE — COLECCIONES
- `leads`: nombre, email, pais, interes, mensaje, estado
- `expedientes`: nombre, email, pais, tipoVisado, estado, notas
- `articles`: title, slug, excerpt, content, country, status, metaDescription
- `diagnosticos`: respuestas formulario + estado + informe generado
- `conocimiento`: titulo, contenido, fuente, categoria, pais, url, fechaPublicacion, fechaIngesta
- Índice compuesto: `articles` → status ASC + publishedAt DESC

## MODELO DE NEGOCIO (en revisión)
- **Starter 59€** — Diagnóstico IA único + PDF + email
- **Pro 39€/mes** — Área cliente + seguimiento + chat IA (límite mensajes)
- **Premium** — Todo Pro + asesor humano

## LOGOS
- **PDF cabeceras:** `backend/src/assets/logo-dark-iso.png`
```typescript
  const logoPath = path.join(__dirname, '../assets/logo-dark-iso.png');
```
- **PDF portada y página final:** mismo path
- **Emails:** SVG placeholder con Q verde (pendiente SVG real)
- **Web:** `/public/logo-light.png` y `/public/logo-dark.png`

## FLUJO DE REGISTRO Y ONBOARDING
1. `/cliente/login` — toggle login/registro (mismo componente)
2. Registro: `createUserWithEmailAndPassword` → POST `/api/usuarios/registro` (público) → `/cliente/onboarding`
3. Login: verifica `perfilCompleto` en Firestore → si false → `/cliente/onboarding`, si true → `/cliente/inicio`
4. Onboarding: wizard 3 pasos → PUT `/api/usuarios/perfil` (verifyClientToken) → `perfilCompleto: true` → `/cliente/inicio`
5. `OnboardingGuard` envuelve todas las rutas `/cliente/*` excepto login y onboarding

## ENDPOINTS CLIENTE (verifyClientToken)
- `GET /api/usuarios/perfil` — devuelve doc completo del usuario en Firestore
- `PUT /api/usuarios/perfil` — guarda onboarding, setea perfilCompleto: true
- `POST /api/usuarios/registro` — público, crea doc Firestore tras Firebase Auth signup
- `GET /api/diagnostico/:id/pdf` — descarga PDF del diagnóstico (solo propietario)

## DIAGNÓSTICO PDF
- El PDF se guarda como base64 en `diagnosticos/{id}.pdfBase64` tras generarlo
- Limite: documentos Firestore 1MB — para PDFs grandes puede fallar (futuro: Firebase Storage)
- El campo `completadoEn` se guarda junto con `estado: 'completado'`

## PENDIENTES
- [ ] SVG real del logo en emails
- [ ] Bug PDF: "Semana 2-3:" se corta en próximos pasos
- [ ] Scraper BOE automático (cron job Railway)
- [ ] Stripe modo live (cuando haya clientes reales)
- [ ] Google Search Console — verificar dominio
- [ ] BD scraping de Manu → conector a Pinecone (futuro)
- [ ] Migrar PDFs a Firebase Storage (evitar límite 1MB de Firestore)

## NOTAS TÉCNICAS IMPORTANTES
- CORS configurado para: localhost:3000, localhost:5173, quickemigrate.com, www.quickemigrate.com, *.vercel.app
- Railway puerto: 3001 (configurado en Settings → Public Networking)
- Webhook Stripe producción: `https://qe-production.up.railway.app/api/diagnostico/webhook`
- Voyage AI SDK: `voyageai` (NO anthropic.embeddings — no disponible en v0.90.0)
- El logo para PDFKit está en `backend/src/assets/` (no en raíz del monorepo)
Cópialo y reemplaza el CLAUDE.md en la raíz del monorepo.