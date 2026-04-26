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
