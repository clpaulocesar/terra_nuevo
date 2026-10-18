# AGENTS.md

TERRA Autoservicio: self-service kiosk e-commerce on a shared tablet. React 19 + Vite frontend (`frontend/`, deployed on Vercel) talking to an Express 5 + PostgreSQL/Supabase backend (`backend/`). Personal data is never persisted — cart and admin token live in `sessionStorage` only.

See `frontend/AGENTS.md` for frontend-specific conventions.

## Layout
- Two independent npm packages; no workspace/monorepo tooling — install and run each separately.
- `frontend/` — SPA in `src/`, plus `detalle-qr.html` (QR product sheet) and `public/config.js` (runtime config).
- `backend/` — ESM (`"type": "module"`); entry `server.js` -> `src/app.js`; `src/{routes,controllers,models,middlewares,config}`.
- `frontend/database/schema.sql` — legacy Spanish-table schema (see Database note).

## Commands
Frontend (`frontend/`):
- `npm install`, `npm run dev` (Vite on :5173), `npm run build`, `npm run preview`
- `npm run lint` -> oxlint (React hooks + Oxc rules)

Backend (`backend/`):
- `npm install`, `npm start` or `npm run dev` (`node --watch server.js`) on :3001 (`PORT` env)
- Exits on startup if Postgres is unavailable.

Database / run:
- Legacy schema: `psql -U postgres -d terra_autoservicio -f frontend/database/schema.sql` (from repo root)
- Reset/seed: `cd backend && node src/config/migrate_seed.js` — DESTRUCTIVE: TRUNCATEs `pedidos`, `pedido_detalles`, `productos` (RESTART IDENTITY), ALTERs `products`/`customers` columns, re-seeds catalog (incl. sync from Supabase `products`). Dev reset only, never a routine migration.
- Health check: `GET http://localhost:3001/api/health`

## Environment
- Frontend `.env` (copy `.env.example`): `VITE_API_URL`, `VITE_MODO_DEMO` (must be exactly `true`), `VITE_SUPABASE_STORAGE_BUCKET`.
- **Runtime override beats .env**: `public/config.js` (`window.TERRA_CONFIG`) is loaded at runtime and takes priority for `API_URL` and `N8N_CHAT_URL`. After deploying, edit only `public/config.js` (served as `dist/config.js`) and reload — changing `.env` needs a rebuild. The resolved URL has its trailing slash stripped (`src/services/api.js`).
- Backend `.env` (copy `.env.example`): `DATABASE_URL` (Supabase Transaction Pooler recommended), `PORT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET`. SSL is forced when the URL contains `supabase`/`pooler` or `DATABASE_SSL=true`. `FRONTEND_URL` is documented but unused by code (CORS is wide open).

## Backend notes
- Routes: `/api/{productos,categorias,pedidos,clientes,admin,asistente}` + `/api/productos/seed`, `/api/health`, `/docs` (Swagger UI), `/openapi`.
- `server.js` runs `migrarColumnas()` (idempotent ALTER TABLEs on `products`/`customers`/`categories`/`orders`) once at startup before `listen`; failures are logged, not fatal.
- Money is stored in minor units (integer cents), currency BOB.
- Order creation (`crearPedidoBD`) recomputes prices and checks stock inside a DB transaction, but does **not** decrement stock and uses no row locking. Stock only changes via `PATCH /api/productos/:id/stock` (admin).
- **Two DB schemas coexist**: runtime code uses the Supabase schema (`products`, `product_variants`, `categories`, `customers`, `orders`, `order_items`). The Spanish tables (`clientes`, `productos`, `pedidos`, `pedido_detalles`) from `frontend/database/schema.sql` are written only by `migrate_seed.js`. Build new features against the Supabase schema.
- Admin login token: unsigned base64url JSON, 8h expiry, stored in `sessionStorage` as `terra_admin_token`. `apiRequest` never attaches it — admin calls pass it explicitly (see `src/services/adminService.js`).

## Frontend notes
- Tailwind v4 is configured solely via `@tailwindcss/vite` in `vite.config.js` — no `tailwind.config`.
- Cart is per-tab `sessionStorage` (`terra_carrito`), not memory-only: survives full reloads during multi-QR flows (`detalle-qr.html` -> `/productos/:id?agregar=1`).
- Vite dev server `allowedHosts`: `*.trycloudflare.com`, `grupoterracenter.com` (Cloudflare tunnel + kiosk domain).
- Chat widget posts to an n8n webhook (`N8N_CHAT_URL` in `public/config.js`).

## Verification
No test scripts exist (backend `npm test` intentionally fails). Verify with: `npm run lint` + `npm run build` (frontend), backend startup + `GET /api/health`.
