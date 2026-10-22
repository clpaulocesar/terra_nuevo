# AGENTS.md

## Layout
- No root `package.json`. Two separate packages: `frontend/` (React 19 + Vite + Tailwind v4) and `backend/` (Express 5 + PostgreSQL, ESM `"type": "module"`). Run all npm commands from inside each dir.
- Entrypoints: `frontend/src/main.jsx` → `App.jsx`; `backend/server.js` → `src/app.js` (mounts `/api/{productos,pedidos,clientes,admin}`, `/api/health`).

## Commands
- Frontend: `cd frontend && npm install`; `npm run dev` → `http://localhost:5173`; `npm run build`; `npm run preview`; `npm run lint` (`oxlint`, react+oxc per `.oxlintrc.json`); `npm test` (vitest: navigation + accessibility tests).
- Backend: `cd backend && npm install`; `npm start` (or `npm run dev` = `node --watch server.js`) → `http://localhost:3001`. Exits(1) on startup if Postgres unreachable — check `backend/.env` first.
- DB setup: create DB `terra_autoservicio`, then `psql -U postgres -d terra_autoservicio -f frontend/database/schema.sql` (schema lives under `frontend/database/`, not repo root).
- DB reset/seed (destructive): `cd backend && node src/config/migrate_seed.js`. TRUNCATEs `pedidos`, `pedido_detalles`, `productos RESTART IDENTITY` + `ALTER TABLE productos ADD COLUMN IF NOT EXISTS ...`. Dev-only, never against real data.
- Health check: `GET http://localhost:3001/api/health`.

## Env (two files, not one)
- `frontend/.env` (copy from `frontend/.env.example`): `VITE_API_URL` (default `http://localhost:3001/api`; trailing slash stripped in `src/services/api.js`), `VITE_MODO_DEMO` enables demo/offline mode only when exactly `"true"` (strict `=== 'true'`; services throw `exigirConexionReal` when active).
- `backend/.env` (required keys: `DATABASE_URL`, `PORT`, `FRONTEND_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET`). Loaded via `dotenv/config`; `src/config/database.js` throws if `DATABASE_URL` missing. Run backend from `backend/` so `.env` resolves. CORS origin = `FRONTEND_URL` (default `http://localhost:5173`).
- Never edit or commit any `.env`.

## Conventions & gotchas
- Orders (`backend/src/models/pedidoModel.js` `crearPedidoBD`): recompute price/total from DB inside a transaction with `SELECT ... FOR SHARE`, validate stock, never trust client totals. Does NOT decrement stock. Normal cart state is memory-only; the QR-only draft in `frontend/public/detalle-qr.html` uses `localStorage` for cross-scan continuity and expires after 2 hours before being imported into the React cart.
- The QR detail page shows the current product beside the accumulated QR draft; “Volver a comprar con cámara” returns to `/catalogo?abrirQr=1` and preserves that draft.
- Catalog paging: `GET /api/productos` paginates server-side (`pagina`, `limite` ≤ 200, `orden` ∈ recomendados|precio-asc|precio-desc|nombre, `buscar`, `categoria`) and returns `paginacion: { total, totalPaginas, ... }`. `frontend/src/context/CatalogoContext.jsx` is a redux-style store (useReducer) that caches each page per filter key so revisiting a page or returning from a product detail does not refetch; `listarProductos` still returns a plain array for admin callers, `listarProductosPaginado` keeps the metadata.
- Admin auth (`backend/src/middlewares/authAdmin.js`, HMAC-SHA256, 8h expiry): login `POST /api/admin/auth/login`. Frontend stores token in `sessionStorage` as `terra_admin_token` (not `localStorage`); generic `apiRequest` does NOT attach it — callers add the `Authorization: Bearer` header manually.
- Privacy (shared tablet): personal data stays in React state only (`frontend/src/context/ClienteContext.jsx`) — never persist to `localStorage`. The temporary QR draft contains product lines only, no customer data.
- Backend has no test runner (`npm test` intentionally exits 1). Verify with backend startup and `/api/health`. Frontend: `npm run lint` + `npm run build` + `npm test`.
- Tailwind v4 is configured only through `@tailwindcss/vite` in `frontend/vite.config.js`; there is no tailwind config file. `express.json` limit is `50kb`.
- Code splitting: admin, vendedor and mayorista screens are loaded with `React.lazy` in `src/routes/AppRoutes.jsx`. New backoffice screens MUST be lazy too, so the kiosk (`/catalogo`) never downloads them. `theme-dark-admin.css` is imported by `AdminLayout`, `VendedorLayout`, `LoginAdmin` and `LoginVendedor`, not globally.
- Voice navigation (`src/navegacion/`) and accessibility mode (`src/accesibilidad/`): any new route/screen must be added to `registroNavegacion.js`; any new icon-only button needs an `aria-label`.

## CSS rules — REVIEW ON EVERY CHANGE
Any change that touches JSX markup, classes or styles (even a small fix) must pass the CSS checklist at the end of this section. Current baseline: main CSS ≈ 212 KB (≈ 37 KB gzip), 0 `@import`. Don't make it grow without a reason.

### Where styles go
- Prefer Tailwind utility classes in JSX. Write CSS only for things Tailwind can't express cleanly (complex animations, third-party overrides like Leaflet).
- Before adding a rule, search for an existing class or variable that already does it (`grep -r "<property>: <value>" frontend/src`). Reuse, don't copy.
- One CSS file per component/page, imported by that component (not globally), scoped with one root class (`.orders-list`, `.orders-list__item`, `.orders-list--empty`).
- When redesigning something, DELETE the old rules. Never stack a new design on top of the old one (current debt: admin login, QR button, product modal, categories hero).
- Don't duplicate desktop rules inside media queries; only override what changes.

### Design tokens
- Colors, radii, shadows and font sizes come from CSS variables defined once in `:root` and overridden in `html[data-theme="dark"]` and `html.a11y-contraste`.
- No hardcoded hex colors in component CSS or JSX: use `var(--...)`.
- New code uses `--terra-*` variables. Don't migrate the legacy prefixes (`--vino/--crema`, `--td-*`) inside an unrelated task.

### Dark mode / high contrast
- Dark mode and high contrast work by redefining variables. New components must not need `html[data-theme="dark"] .my-component {...}`.
- Do not add selectors to the long dark-mode lists in `theme-dark.css` / `theme-dark-admin.css`; use variables instead.
- No new giant `:is(...)` selectors over all tags.

### Selectors
- Max: one class + one pseudo-class (`.card:hover`), max 3 compound parts. No IDs in CSS (new code must not use `#terra-menu-movil`).
- No `!important`, except in `accesibilidad.css` for user-forced a11y overrides.
- Don't style by tag deep inside components (`.admin-content table td span`).

### Performance
- No `@import` in CSS. Fonts go as `<link>` in `index.html` with `display=swap` (preconnect already exists). Atkinson Hyperlegible is injected by `ModoAccesibleContext.jsx` only when `a11y-fuente` is on — keep it that way.
- Load only the font weights in use. No new font families without asking.
- No base64 images (`url(data:...)`) over 1 kB; put them in `public/` or `src/assets/`. (Leaflet's built-in ones are OK.)
- Every animation/transition needs a `@media (prefers-reduced-motion: reduce)` fallback.

### Units & layout
- Font sizes in `rem` (accessibility mode scales `html` font-size to 125/150%). Never `px` for text.
- Mobile-first, Tailwind breakpoints. Must work on the 768 px store tablet with text at 150%: no clipped text, no horizontal scroll.
- Touch targets ≥ 44 px (48 px in accessibility mode).

### CSS checklist (before finishing ANY task)
1. No new `@import`, IDs, hardcoded colors, `!important` or `px` font sizes.
2. Old rules replaced by the change were deleted.
3. `npm run lint`, `npm run build` and `npm test` pass.
4. Report main CSS and JS size (`dist/assets`, raw + gzip) before/after; explain any growth.
5. Visually check light, dark and accessibility mode (`a11y-contraste`) on the affected screens. Always at least: Catálogo, DetalleProducto, Carrito; plus Admin/Vendedor if touched.
6. Don't commit or push; the user tests on the tablet and commits.