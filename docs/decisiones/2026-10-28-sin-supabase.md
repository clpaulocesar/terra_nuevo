---
fecha: 2026-10-28
estado: aceptada
tags: [decision, infraestructura]
---

# Eliminar toda dependencia de Supabase

**Fecha:** 2026-10-28

## Contexto
- La base ya estaba migrada a un PostgreSQL propio, pero el código seguía usando Supabase:
  - Supabase Auth para el login de mayoristas, llamado desde el navegador y validado en el backend;
  - Supabase Storage para imágenes de producto y comprobantes, escrito desde el navegador con la clave publicable;
  - un respaldo que escribía directo en `auth.users` y `auth.identities`;
  - la redefinición de `auth.uid()` en cada arranque del backend.
- La base nueva tiene el esquema `auth` sin tablas: no había contraseñas de mayoristas que migrar.

## Decisión
- El sistema no se conecta a Supabase en ningún punto: ni Auth, ni Storage, ni API, ni claves.
- Login de mayoristas propio contra `users` ([[2026-10-28-login-solo-bd]]).
- Imágenes de producto en copyparty, siempre a través del backend ([[2026-10-28-imagenes-en-copyparty]]); sin comprobantes ([[2026-10-28-pagos-sin-comprobantes]]).
- Se borraron `services/supabaseAuth.js` y `services/authUsuariosBD.js`, y las variables `SUPABASE_*` y `VITE_SUPABASE_*`.
- El código ya no crea el esquema `auth` ni redefine `auth.uid()`. La función **se conserva en la base** porque la usa el trigger `log_order_status_change`.
- `database.js` ya no deduce TLS por el nombre del host: solo con `DB_SSL=true` explícito.
- Las 52 imágenes que estaban en Supabase se migraron a copyparty con respaldo CSV.

## Alternativas consideradas
- **Mantener solo Supabase Auth para mayoristas**: descartada; seguía exponiendo claves en el frontend y dependía de un servicio externo para 4 cuentas.
- **Mantener Supabase Storage para imágenes**: descartada; ya existía copyparty con 9.856 imágenes del catálogo.

## Consecuencias
- Los 4 mayoristas existentes necesitan que el administrador les asigne clave nueva.
- `order_status_history.changed_by` sigue en NULL, porque `auth.uid()` devuelve NULL.
- Quedan menciones a Supabase en scripts de la raíz `scripts/` y en el script de migración, que es el único autorizado a leer URLs de Supabase ([[00-roadmap]]).

Relacionado: [[01-arquitectura]] · [[ANALISIS_PROYECTO]]
