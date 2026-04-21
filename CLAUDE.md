# CLAUDE.md — Quick Emigrate (Q_E)

## Qué es este proyecto

**Quick Emigrate** es una plataforma digital de asistencia migratoria para hispanoamericanos que quieren emigrar a España. Incluye una landing page pública para captación de leads, un panel de administración interno para Manu (CEO) y Pablo (CTO), y un backend con autenticación y base de datos.

El nombre comercial es **Quick Emigrate**. El identificador interno es **Q_E**. Nunca uses "Q_E" en textos visibles al usuario.

---

## Equipo

- **Manu** — CEO. Estrategia, negocio, clientes.
- **Pablo** — CTO. Tecnología, producto, infraestructura.

---

## Stack técnico completo

### Frontend
| Capa | Tecnología |
|---|---|
| Framework | React + TypeScript |
| Build tool | Vite |
| Routing | React Router v6 |
| Animaciones | motion/react (Framer Motion v11+) |
| Iconos | lucide-react |
| Estilos | Tailwind CSS con CSS custom properties |
| Auth | Firebase Auth (email/password + Google) |
| Despliegue | Vercel |

### Backend
| Capa | Tecnología |
|---|---|
| Runtime | Node.js + Express + TypeScript |
| Auth verificación | firebase-admin |
| Base de datos | Firestore (Firebase) |
| Email | Resend |
| Despliegue | Railway |

---

## Estructura de archivos

```
qe-monorepo/
├── README.md
├── CLAUDE.md
├── frontend/
│   ├── index.html
│   ├── vercel.json              # Rewrites para React Router SPA
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   ├── public/
│   │   └── logo.png
│   └── src/
│       ├── main.tsx             # Punto de entrada + BrowserRouter + AuthProvider
│       ├── App.tsx              # Rutas públicas y protegidas
│       ├── index.css            # Variables CSS, utilidades globales
│       ├── firebase.ts          # Inicialización Firebase SDK (auth)
│       ├── data.ts              # Arrays de datos (SERVICES, FAQS)
│       ├── types.ts             # Interfaces TypeScript
│       ├── context/
│       │   └── AuthContext.tsx  # useAuth hook + AuthProvider
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── HeroSection.tsx
│       │   ├── ProblemSection.tsx
│       │   ├── SolutionSection.tsx
│       │   ├── HowItWorksSection.tsx
│       │   ├── ServicesSection.tsx
│       │   ├── TrustSection.tsx
│       │   ├── FaqSection.tsx
│       │   ├── ContactSection.tsx
│       │   ├── Footer.tsx
│       │   ├── SectionHeader.tsx
│       │   ├── ProtectedRoute.tsx   # Redirige a /admin/login si no autenticado
│       │   └── admin/
│       │       └── AdminLayout.tsx  # Sidebar + layout compartido del panel
│       └── pages/
│           ├── AboutPage.tsx        # /sobre-nosotros
│           ├── BlogPage.tsx         # /blog
│           └── admin/
│               ├── AdminLogin.tsx       # /admin/login
│               ├── AdminDashboard.tsx   # /admin
│               ├── AdminLeads.tsx       # /admin/leads
│               └── AdminExpedientes.tsx # /admin/expedientes
└── backend/
    ├── nixpacks.toml            # Config despliegue Railway
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    └── src/
        ├── index.ts             # Servidor Express + rutas
        ├── firebase.ts          # firebase-admin init + db + auth
        ├── middleware/
        │   ├── cors.ts          # CORS con allowedOrigins
        │   └── auth.ts          # verifyToken middleware
        └── routes/
            ├── contact.ts       # POST /api/contact → Resend + Firestore
            ├── leads.ts         # GET /api/leads, PATCH /api/leads/:id
            └── expedientes.ts   # GET/POST /api/expedientes, PATCH /api/expedientes/:id
```

---

## Rutas de la aplicación

### Públicas
| Ruta | Componente | Descripción |
|---|---|---|
| `/` | LandingPage | Landing completa |
| `/sobre-nosotros` | AboutPage | Historia y equipo |
| `/blog` | BlogPage | Artículos SEO |

### Protegidas (requieren auth + email en ALLOWED_EMAILS)
| Ruta | Componente | Descripción |
|---|---|---|
| `/admin/login` | AdminLogin | Login email/password + Google |
| `/admin` | AdminDashboard | Métricas y últimos leads |
| `/admin/leads` | AdminLeads | Gestión de leads del formulario |
| `/admin/expedientes` | AdminExpedientes | Gestión de expedientes de clientes |

---

## Sistema de diseño y tokens

Variables CSS definidas en `frontend/src/index.css`. Úsalas siempre, nunca colores hardcoded.

| Token | Valor | Uso |
|---|---|---|
| `--color-primary-container` | `#25D366` | Acento principal / CTA |
| `--color-on-background` | `#1A1C1C` | Texto principal / fondos oscuros |
| `--color-surface-container-low` | `#F3F3F4` | Fondo secciones alternas |
| `--color-surface-container-lowest` | `#FFFFFF` | Fondo principal |
| `.glass` | — | Glassmorphism (rgba blanco + blur) |
| `.tonal-lift` | — | Sombra sutil con elevación tonal |

**Fuente:** Inter (Google Fonts). No cambies sin consenso.

---

## Convenciones de código

- Componentes en **PascalCase**
- Interfaces con prefijo `interface` en **PascalCase**
- Handlers con prefijo `handle` → `handleSubmit`, `handleScroll`
- Estado booleano con prefijo `is` / `has` → `isScrolled`, `isOpen`
- Arrays de datos constantes en **SCREAMING_SNAKE_CASE** → `SERVICES`, `FAQS`
- Usa `React.FC<Props>` para tipar componentes con props
- Usa `motion.div` de `motion/react`, **nunca** de `framer-motion`

---

## Animaciones

Scroll reveal estándar:
```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
```

Entrada de página (hero):
```tsx
initial={{ opacity: 0, x: -30 }}
animate={{ opacity: 1, x: 0 }}
transition={{ duration: 0.8, ease: "easeOut" }}
```

Usa `AnimatePresence` para elementos que montan/desmontan (menú móvil, FAQ).

---

## Autenticación

- Firebase Auth gestiona sesiones en el frontend
- `AuthContext` expone `user`, `loading` y `getToken()`
- `ProtectedRoute` verifica que el email esté en `ALLOWED_EMAILS` (definidos en `.env`)
- El backend verifica el token Firebase en cada request protegida via `verifyToken` middleware
- Solo Manu y Pablo tienen acceso al panel — emails definidos en variables de entorno

**Flujo de auth:**
```
Login → Firebase Auth → token JWT → Header Authorization: Bearer <token> → backend verifica → acceso
```

---

## Firestore — Colecciones

### `leads`
Creado automáticamente cuando alguien envía el formulario de contacto.
```typescript
{
  nombre: string
  email: string
  pais: string
  interes: string
  mensaje: string
  estado: 'nuevo' | 'contactado' | 'convertido' | 'descartado'
  createdAt: string // ISO
  updatedAt: string // ISO
}
```

### `expedientes`
Creado manualmente desde el panel admin.
```typescript
{
  nombre: string
  email: string
  pais: string
  tipoVisado: string
  estado: 'nuevo' | 'en proceso' | 'documentación pendiente' | 'presentado' | 'aprobado' | 'denegado'
  notas: string
  createdAt: string // ISO
  updatedAt: string // ISO
}
```

---

## API del backend

Todas las rutas protegidas requieren header:
```
Authorization: Bearer <firebase-id-token>
```

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/contact` | No | Envía email + guarda lead en Firestore |
| GET | `/api/leads` | Sí | Lista todos los leads |
| PATCH | `/api/leads/:id` | Sí | Actualiza estado y notas de un lead |
| GET | `/api/expedientes` | Sí | Lista todos los expedientes |
| POST | `/api/expedientes` | Sí | Crea nuevo expediente |
| PATCH | `/api/expedientes/:id` | Sí | Actualiza expediente |
| GET | `/health` | No | Health check |

---

## Variables de entorno

### `frontend/.env`
```
VITE_BACKEND_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_EMAIL_1=
VITE_ADMIN_EMAIL_2=
```

### `backend/.env`
```
PORT=3001
RESEND_API_KEY=
CONTACT_EMAIL=
FRONTEND_URL=http://localhost:5173
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} # JSON en una sola línea
ADMIN_EMAIL_1=
ADMIN_EMAIL_2=
```

---

## Qué NO tocar sin consenso

- Precios de servicios (`SERVICES` en `data.ts`) — decisión de Manu (CEO)
- Copy del hero y propuesta de valor — validado con criterio de posicionamiento
- Paleta de colores / tokens CSS — decisión de diseño tomada
- Estructura de secciones de la landing — orden pensado para conversión
- Emails de admin en `.env` — solo Manu y Pablo

---

## Infraestructura de producción

| Servicio | URL | Plataforma |
|---|---|---|
| Frontend | qe-monorepo.vercel.app | Vercel |
| Backend | qe-production.up.railway.app | Railway |
| Base de datos | Firestore | Firebase (proyecto: quick-emigrate) |
| Email | — | Resend |
| Repo | github.com/quickemigrate/qe-monorepo | GitHub (org: quickemigrate) |

---

## Comandos útiles

```bash
# Frontend
cd frontend
npm run dev      # http://localhost:5173
npm run build
npm run preview

# Backend
cd backend
npm run dev      # http://localhost:3001
npm run build
npm run start

# Despliegue backend
cd backend
railway up

# Git
git add .
git commit -m "feat/fix/chore: descripción"
git push         # Vercel redespliega automáticamente
```

---

## Próximas tareas

### 🔴 Pendiente inmediato
- [ ] Dominio propio (`quickemigrate.com` o `.es`) conectado a Vercel
- [ ] Favicon con logo oficial
- [ ] Variables de Railway actualizadas con Firebase service account

### 🟡 Siguiente sprint (después de exámenes — junio)
- [ ] Área privada de cliente — login, tracking de expediente
- [ ] Firebase Storage — subida de documentos por parte del cliente
- [ ] Resend con dominio propio (`hola@quickemigrate.com`)
- [ ] Primeros 3 artículos de blog SEO por país

### 🟢 Backlog
- [ ] Integración con Calendly para reservar diagnóstico
- [ ] Chatbot básico de primer filtro
- [ ] Testimonios reales de primeros clientes
- [ ] Internacionalización por país (Argentina, Perú, Nicaragua)

---

*Última actualización: abril 2026 — Mantenido por Pablo (CTO, Q_E)* 