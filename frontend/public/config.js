// =====================================================================
//  CONFIGURACIÓN DE CONEXIONES - TERRA Autoservicio
//  Este archivo se carga en tiempo de ejecución (NO se compila).
//  Al desplegar, edita SOLO este archivo (queda en dist/config.js)
//  y recarga la página. No hace falta volver a ejecutar npm run build.
// =====================================================================
window.TERRA_CONFIG = {
  // URL pública del backend (API). La usan la app Y la ficha QR (detalle-qr.html).
  // Ejemplo: "https://tu-backend.onrender.com/api"
  // - Debe terminar en /api
  // - En tu PC (localhost) se usa el backend local en el puerto 3001.
  API_URL: /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
    ? "http://localhost:3001/api"
    : "https://terratabletv2-0.vercel.app/api",
  // Webhook del nodo "When chat message received" de n8n (workflow publicado/activo).
  // Ejemplo producción: "https://n8n.midominio.com/webhook/xxxx-xxxx/chat"
 N8N_CHAT_URL: "https://mart-grades-alive-reconstruction.trycloudflare.com/webhook/cf2f2ecb-49f1-4287-9704-7f2214849274/chat",
  // WhatsApp principal de TERRA para solicitudes de comprobante (incluye código de país).
  WHATSAPP_COMPROBANTES: "59175335697",
};
