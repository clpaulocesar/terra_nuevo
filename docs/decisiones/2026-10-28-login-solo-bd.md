---
fecha: 2026-10-28
estado: aceptada
tags: [decision, seguridad]
---

# Todo login se valida solo contra la base

**Fecha:** 2026-10-28

## Contexto
- El backend aceptaba un superadministrador definido por `ADMIN_EMAIL` / `ADMIN_PASSWORD` en el `.env`, con credenciales por defecto escritas en el código si faltaban.
- El secreto que firma los tokens también tenía un valor por defecto en el código: con él cualquiera podía forjar un token de administrador.
- Los tokens del personal no siempre llevaban el id de la cuenta y el rol se tomaba del token.
- Antes de aplicar el cambio se verificó que `staff_accounts` tenía 3 administradores activos con contraseña, para no perder el acceso.

## Decisión
- Personal (`admin`, `vendedor`, `despacho`): login solo contra `staff_accounts` por `lower(email)`, cuenta activa y rol válido, con `bcrypt.compare`.
- Mayoristas: login solo contra `users` (rol `mayorista`, activo, `password_hash`). La clave la asigna el administrador.
- La misma respuesta 401 "Credenciales inválidas" si el usuario no existe, la clave es incorrecta o la cuenta está inactiva. Con correo inexistente se compara igual contra un hash de relleno, para no delatar por tiempo qué correos existen.
- Límite de 5 intentos fallidos por correo + IP cada 15 minutos (429).
- Los tokens llevan el id de la cuenta. En cada petición `authAdmin` relee `staff_accounts` y `authMayorista` relee `users`: desactivar una cuenta o cambiarle el rol corta el acceso al instante. Los tokens sin id se rechazan.
- `ADMIN_TOKEN_SECRET` y `CLIENTE_TOKEN_SECRET` son obligatorios (32 caracteres o más) y no tienen valor por defecto: sin ellos el servidor no arranca.
- El primer administrador se crea con `backend/scripts/crear-admin.mjs`: pide los datos por consola, la contraseña oculta y con un mínimo de 12 caracteres, y nunca la acepta por argumento.

## Alternativas consideradas
- **Mantener el superadministrador del `.env` como acceso de emergencia**: descartada; es una credencial fuera de la base, difícil de rotar y presente en el historial.
- **Sesiones guardadas en la base o JWT con librería**: no hacía falta; el token HMAC propio ya existía y se reforzó.

## Consecuencias
- Los tokens emitidos antes del cambio dejaron de valer.
- Cada petición autenticada hace una consulta extra a la base.
- El límite de intentos vive en memoria: se reinicia con el proceso y no se comparte entre instancias.
- Rotar los secretos que estuvieron versionados en el historial sigue pendiente ([[00-roadmap]]).

Relacionado: [[2026-10-28-sin-supabase]] · [[01-arquitectura]]
