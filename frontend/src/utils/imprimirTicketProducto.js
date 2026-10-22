import { formatoMoneda } from './formatoMoneda.js';

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>'"]/g, (caracter) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#039;',
    '"': '&quot;',
  })[caracter]);
}

// Patrones Code 128 (B) para generar código de barras vectorial nítido en impresoras térmicas
const CODE128_PATRONES = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

function generarSvgBarcode128(texto, altura = 48) {
  const chars = String(texto || 'TERRA').trim().slice(0, 30);
  const START_B = 104;
  const STOP = 106;
  const codigos = [START_B];
  for (let i = 0; i < chars.length; i++) {
    const code = chars.charCodeAt(i) - 32;
    codigos.push(Math.max(0, Math.min(code, 95)));
  }
  let checksum = codigos[0];
  for (let i = 1; i < codigos.length; i++) {
    checksum += codigos[i] * i;
  }
  codigos.push(checksum % 103);
  codigos.push(STOP);

  let patternTotal = '';
  for (const c of codigos) {
    patternTotal += CODE128_PATRONES[c] || '212222';
  }

  let rects = '';
  let x = 8;
  let isBar = true;
  for (let i = 0; i < patternTotal.length; i++) {
    const w = parseInt(patternTotal[i], 10) * 2;
    if (isBar) {
      rects += `<rect x="${x}" y="0" width="${w}" height="${altura}" fill="#000"/>`;
    }
    x += w;
    isBar = !isBar;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 8} ${altura}" preserveAspectRatio="none" style="width:100%;height:${altura}px;display:block;">${rects}</svg>`;
}

/**
 * Imprime una etiqueta / ticket térmico de góndola o producto individual
 * con nombre, precio minorista/mayorista, SKU, código de barras y QR.
 */
export function imprimirTicketProducto(producto, { copias = 1 } = {}) {
  if (typeof window === 'undefined' || !producto) return;

  const destino = window.open('', '_blank', 'width=420,height=680');
  if (!destino) {
    throw new Error('El navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes.');
  }

  const nombre = escapar(producto.nombre || 'Producto sin nombre');
  const sku = escapar(producto.sku || producto.codigo_terra || `ID-${producto.id}`);
  const precioMinorista = Number(producto.precio || producto.public_price || 0);
  const precioMayorista = Number(producto.precioMayorista || producto.precio_mayorista || 0);
  const categoria = escapar(producto.categoria || 'Autoservicio');
  const detalle = escapar(producto.detalle || producto.medida || '');
  const stock = Number(producto.stock ?? producto.showroom ?? 0);
  const fecha = new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(new Date());

  const svgBarcode = generarSvgBarcode128(sku, 48);

  const etiquetaHtml = `
    <article class="ticket-etiqueta">
      <header class="ticket-head">
        <span class="ticket-logo">TERRA AUTOSERVICIO</span>
        <span class="ticket-branch">Equipetrol · Santa Cruz</span>
      </header>

      <div class="ticket-categoria">${categoria}</div>

      <h1 class="ticket-nombre">${nombre}</h1>
      ${detalle ? `<div class="ticket-detalle">${detalle}</div>` : ''}

      <div class="ticket-precio-box">
        <span class="ticket-precio-label">PRECIO VENTA</span>
        <div class="ticket-precio-val">${formatoMoneda(precioMinorista)}</div>
        ${precioMayorista > 0 ? `<div class="ticket-precio-may">Mayorista: <b>${formatoMoneda(precioMayorista)}</b></div>` : ''}
      </div>

      <div class="ticket-barcode-wrap">
        ${svgBarcode}
        <div class="ticket-sku">${sku}</div>
      </div>

      <footer class="ticket-foot">
        <span>Stock: ${stock} un.</span>
        <span>${fecha}</span>
      </footer>
    </article>
  `;

  // Multiplicar según número de copias solicitadas
  const etiquetas = Array.from({ length: Math.max(1, Math.min(copias, 20)) }, () => etiquetaHtml).join('<div class="page-break"></div>');

  destino.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Ticket Producto - ${nombre}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 3mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, -apple-system, sans-serif;
      color: #111;
      background: #fff;
      padding: 6px;
      margin: 0 auto;
      max-width: 320px;
    }
    .ticket-etiqueta {
      border: 1.5px dashed #a6192e;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 12px;
      text-align: center;
      background: #fff;
      page-break-inside: avoid;
    }
    .ticket-head {
      border-bottom: 1px solid #111;
      padding-bottom: 5px;
      margin-bottom: 6px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .ticket-logo {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #a6192e;
    }
    .ticket-branch {
      font-size: 9px;
      color: #555;
      text-transform: uppercase;
    }
    .ticket-categoria {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      background: #f4ecec;
      color: #6d1b28;
      padding: 2px 8px;
      border-radius: 999px;
      margin-bottom: 5px;
    }
    .ticket-nombre {
      font-size: 14px;
      font-weight: 800;
      line-height: 1.25;
      color: #000;
      margin: 4px 0;
      word-break: break-word;
    }
    .ticket-detalle {
      font-size: 10px;
      color: #555;
      margin-bottom: 6px;
    }
    .ticket-precio-box {
      background: #fff5f6;
      border: 1.5px solid #a6192e;
      border-radius: 6px;
      padding: 6px 4px;
      margin: 6px 0;
    }
    .ticket-precio-label {
      display: block;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #8c1626;
      text-transform: uppercase;
    }
    .ticket-precio-val {
      font-size: 22px;
      font-weight: 900;
      color: #a6192e;
      line-height: 1.1;
      margin: 2px 0;
    }
    .ticket-precio-may {
      font-size: 10px;
      color: #333;
      border-top: 1px dashed #f2b4bd;
      padding-top: 3px;
      margin-top: 3px;
    }
    .ticket-barcode-wrap {
      margin: 8px 0 6px;
      padding: 4px 0;
    }
    .ticket-sku {
      font-family: monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #000;
      margin-top: 3px;
    }
    .ticket-foot {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #ddd;
      padding-top: 4px;
      font-size: 9px;
      color: #666;
    }
    .page-break {
      page-break-after: always;
      height: 0;
    }
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      .ticket-etiqueta {
        border-color: #000;
      }
    }
  </style>
</head>
<body>
  ${etiquetas}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  <\/script>
</body>
</html>`);
  destino.document.close();
}
