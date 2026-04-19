# CLAUDE.md — Quick Emigrate (Q_E)

## Qué es este proyecto

**Quick Emigrate** es una plataforma digital de asistencia migratoria para hispanoamericanos que quieren emigrar a España. La landing page es el primer artefacto público del proyecto: su objetivo es captar leads (emails/formulario), transmitir credibilidad y ser presentable ante profesores de la Universidad Loyola antes del 15 de mayo.

El nombre comercial es **Quick Emigrate**. El identificador interno es **Q_E**. Nunca uses "Q_E" en textos visibles al usuario.

Este es un **MVP en fase inicial**. No sobreingenieres. Prioriza claridad, velocidad de entrega y funcionalidad real sobre perfección técnica.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | React + TypeScript |
| Build tool | Vite |
| Animaciones | motion/react (Framer Motion v11+) |
| Iconos | lucide-react |
| Estilos | Tailwind CSS con design tokens propios (CSS vars) |
| Despliegue | Por definir (Vercel recomendado) |

---

## Estructura de archivos

```
/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.tsx          # Punto de entrada
│   ├── App.tsx           # Componente principal (toda la landing por ahora)
│   └── index.css         # Variables CSS, utilidades globales
```

Por ahora todo está en `App.tsx`. Cuando refactorices, extrae componentes a `src/components/` manteniendo esta nomenclatura:
- `Navbar.tsx`
- `HeroSection.tsx`
- `ProblemSection.tsx`
- `SolutionSection.tsx`
- `ServicesSection.tsx`
- `TrustSection.tsx`
- `FaqSection.tsx`
- `ContactSection.tsx`
- `Footer.tsx`

---

## Sistema de diseño y tokens

Los colores usan **CSS custom properties** definidas en `index.css`. Respétalas siempre. No uses colores hardcoded.

| Token | Uso |
|---|---|
| `bg-surface-container-lowest` | Fondo principal de página |
| `bg-surface-container-low` | Fondo de secciones alternas |
| `bg-primary-container` | Color de acento / CTA principal |
| `text-on-background` | Texto principal |
| `text-on-background/60` | Texto secundario |
| `text-surface-container-lowest` | Texto sobre fondos oscuros |
| `.glass` | Efecto glassmorphism (ya definido en CSS) |
| `.tonal-lift` | Sombra sutil con elevación tonal |

**Fuentes:** las que estén configuradas en `index.css`. No cambies la tipografía sin consenso.

---

## Convenciones de código

- Componentes en **PascalCase**
- Props e interfaces en **PascalCase** con prefijo `interface`
- Handlers con prefijo `handle` → `handleSubmit`, `handleScroll`
- Estado booleano con prefijo `is` / `has` → `isScrolled`, `isOpen`
- Arrays de datos constantes en **SCREAMING_SNAKE_CASE** → `SERVICES`, `FAQS`
- Usa `React.FC<Props>` para tipar componentes con props
- Usa `motion.div` de `motion/react`, no de `framer-motion`

---

## Animaciones

Patrón estándar para elementos que aparecen al hacer scroll:

```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
```

Patrón para entrada de página (hero):

```tsx
initial={{ opacity: 0, x: -30 }}
animate={{ opacity: 1, x: 0 }}
transition={{ duration: 0.8, ease: "easeOut" }}
```

Usa `AnimatePresence` para elementos que montan/desmontan (menú móvil, FAQ acordeón).

---

## Secciones actuales de la landing

1. **Navbar** — fija, glass al hacer scroll, menú móvil con AnimatePresence
2. **Hero** — H1 + CTA doble + imagen con floating card
3. **Problem** — "El laberinto burocrático" con lista de pain points
4. **Solution** — 3 cards: Diagnóstico / Pasos / Soporte
5. **Services** — grid de servicios con precios; fondo oscuro
6. **Trust** — galería de imágenes + 3 puntos de confianza
7. **FAQ** — acordeón con AnimatePresence
8. **Contact** — formulario con estados idle/sending/success
9. **Footer** — links, legal, redes sociales

---

## Funcionalidad del formulario de contacto

Actualmente simula el envío con `setTimeout`. **Próximo paso real:** conectar a Formspree, EmailJS o un webhook de Make/Zapier para que los leads lleguen a Airtable o email.

Estados del formulario:
- `idle` — estado por defecto
- `sending` — botón deshabilitado, texto "Enviando..."
- `success` — confirmación visual 3 segundos, luego vuelve a `idle`

---

## Qué NO tocar sin consenso

- Los precios de los servicios (`SERVICES` array) — decisión de negocio del CEO
- El copy del hero y la propuesta de valor — validado con criterio de posicionamiento
- La paleta de colores / tokens CSS — decisión de diseño ya tomada
- La estructura de secciones — el orden está pensado para conversión

---

## Próximas tareas priorizadas

### 🔴 Urgente (antes del 15 de mayo)
- [ ] Conectar formulario de contacto a un destino real (Formspree recomendado, gratis)
- [ ] Reemplazar imágenes de `picsum.photos` por imágenes reales o de Unsplash con licencia
- [ ] Desplegar en Vercel con dominio propio o subdominio
- [ ] Corregir año en footer (pone 2024, debería ser 2025)

### 🟡 Importante (siguiente sprint)
- [ ] Refactorizar `App.tsx` en componentes separados en `src/components/`
- [ ] Añadir sección de "Cómo funciona" (proceso paso a paso, tipo timeline)
- [ ] Añadir sección de social proof / testimonios (aunque sea con casos placeholder honestos)
- [ ] Meta tags SEO en `index.html` (título, descripción, og:image)
- [ ] Favicon con la "Q" del logo

### 🟢 Backlog
- [ ] Página de "Sobre nosotros" / historia del fundador (aumenta credibilidad)
- [ ] Integración con Calendly para reservar diagnóstico directamente
- [ ] Sistema de tracking de expediente (área privada — fase futura)
- [ ] Blog / contenido educativo para SEO orgánico desde LatAm
- [ ] Internacionalización o adaptación por país (Argentina, Perú, Nicaragua)

---

## Contexto de negocio relevante

- **Mercado objetivo:** hispanoamericanos en LatAm (Argentina, Perú, Nicaragua como foco inicial)
- **CTA principal:** "Reservar diagnóstico" — servicio de 59€, el más accesible y el punto de entrada
- **Tono:** serio, cercano, sin promesas falsas. Anticipa errores, no los magnifica
- **Fase actual:** MVP. La landing debe captar emails y generar los primeros 5-10 diagnósticos piloto
- **Objetivo institucional:** presentable a profesores de Universidad Loyola (Sevilla) antes del 15 de mayo

---

## Comandos útiles

```bash
npm run dev       # Servidor local en http://localhost:5173
npm run build     # Build de producción en /dist
npm run preview   # Preview del build de producción
```

---

*Última actualización: abril 2025 — Mantenido por Pablo (CEO/CTO, Q_E)*