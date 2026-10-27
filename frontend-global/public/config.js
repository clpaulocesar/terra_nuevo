// =====================================================================
//  CONFIGURACIÓN DE CONEXIONES - TERRA Autoservicio Global
// =====================================================================
window.TERRA_CONFIG = {
  API_URL: /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
    ? "http://localhost:3001/api"
    : "https://terratabletv2-0.vercel.app/api",
  N8N_CHAT_URL: "https://pen-oaks-pack-pgp.trycloudflare.com/webhook/cf2f2ecb-49f1-4287-9704-7f2214849274/chat",
  WHATSAPP_COMPROBANTES: "59175335697",
};
