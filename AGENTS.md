# AGENTS.md

## Layout
- No root `package.json`. Two separate packages: `frontend/` (React 19 + Vite + Tailwind v4) and `backend/` (Express 5 + PostgreSQL, ESM `"type": "module"`). Run all npm commands from inside each dir.
- Entrypoints: `frontend/src/main.jsx` → `App.jsx`; `backend/server.js` → `src/app.js` (mounts `/api/{productos,pedidos,clientes,admin}`, `/api/health`).

## Commands
- Frontend: `cd frontend && npm install`; `npm run dev` → `http://localhost:5173`; `npm run build`; `npm run preview`; `npm run lint` (`oxlint`, react+oxc per `.oxlintrc.json`).
- Backend: `cd backend && npm install`; `npm start` (or `npm run dev` = `node --watch server.js`) → `http://localhost:3001`. Exits(1) on startup if Postgres unreachable — check `backend/.env` first.
- DB setup: create DB `terra_autoservicio`, then `psql -U postgres -d terra_autoservicio -f frontend/database/schema.sql` (schema lives under `frontend/database/`, not repo root).
- DB reset/seed (destructive): `cd backend && node src/config/migrate_seed.js`. TRUNCATEs `pedidos`, `pedido_detalles`, `productos RESTART IDENTITY` + `ALTER TABLE productos ADD COLUMN IF NOT EXISTS ...`. Dev-only, never against real data.
- Health check: `GET http://localhost:3001/api/health`.

## Env (two files, not one)
- `frontend/.env` (copy from `frontend/.env.example`): `VITE_API_URL` (default `http://localhost:3001/api`; trailing slash stripped in `src/services/api.js`), `VITE_MODO_DEMO` enables demo/offline mode only when exactly `"true"` (strict `=== 'true'`; services throw `exigirConexionReal` when active).
- `backend/.env` (required keys: `DATABASE_URL`, `PORT`, `FRONTEND_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET`). Loaded via `dotenv/config`; `src/config/database.js` throws if `DATABASE_URL` missing. Run backend from `backend/` so `.env` resolves. CORS origin = `FRONTEND_URL` (default `http://localhost:5173`).

## Conventions & gotchas
- Orders (`backend/src/models/pedidoModel.js` `crearPedidoBD`): recompute price/total from DB inside a transaction with `SELECT ... FOR SHARE`, validate stock, never trust client totals. Does NOT decrement stock. Cart is memory-only.
- Admin auth (`backend/src/middlewares/authAdmin.js`, HMAC-SHA256, 8h expiry): login `POST /api/admin/auth/login`. Frontend stores token in `sessionStorage` as `terra_admin_token` (not `localStorage`); generic `apiRequest` does NOT attach it — callers add the `Authorization: Bearer` header manually.
- Privacy (shared tablet): personal data stays in React state only (`frontend/src/context/ClienteContext.jsx`) — never persist to `localStorage`.
- No test runner in either package (`backend` `npm test` intentionally exits 1). Verify with `npm run lint` + `npm run build` (frontend), backend startup, and `/api/health`.
- Tailwind v4 is configured only through `@tailwindcss/vite` in `frontend/vite.config.js`; there is no tailwind config file. `express.json` limit is `50kb`.
