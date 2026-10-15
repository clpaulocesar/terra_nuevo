// =====================================================================
//  CONFIGURACIÓN DE CONEXIONES - TERRA Autoservicio
//  Este archivo se carga en tiempo de ejecución (NO se compila).
//  Al desplegar, edita SOLO este archivo (queda en dist/config.js)
//  y recarga la página. No hace falta volver a ejecutar npm run build.
// =====================================================================
window.TERRA_CONFIG = {
  // Webhook del nodo "When chat message received" de n8n (workflow publicado/activo).
  // Ejemplo producción: "https://n8n.midominio.com/webhook/xxxx-xxxx/chat"
  N8N_CHAT_URL: "https://volvo-nicole-sampling-positive.trycloudflare.com/webhook/cf2f2ecb-49f1-4287-9704-7f2214849274/chat",
};
