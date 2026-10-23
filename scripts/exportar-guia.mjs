// Exporta docs/GUIA_USUARIO_TERRA_AUTOSERVICIO.md a PDF y Word con las capturas de docs/img.
//
//   node scripts/exportar-guia.mjs            → PDF y DOCX en docs/dist/
//   node scripts/exportar-guia.mjs --solo pdf  (o --solo docx)
//
// PDF: Markdown → HTML (marked) + scripts/exportar-guia.css → Playwright (Chromium).
//      Se imprime dos veces: la primera para saber en qué página cae cada sección
//      (marcas de texto invisibles leídas con pdfjs) y la segunda con el índice numerado.
//      La portada se imprime aparte (sin encabezado ni pie) y se antepone con pdf-lib.
// DOCX: Markdown → tokens (marked) → documento con la librería `docx` (índice como campo
//      de Word, que se actualiza al abrir el archivo).
// La guía no se modifica: cualquier transformación ocurre en memoria.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { marked } from 'marked';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as D from 'docx';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MD = path.join(RAIZ, 'docs', 'GUIA_USUARIO_TERRA_AUTOSERVICIO.md');
const IMG = path.join(RAIZ, 'docs', 'img');
const DIST = path.join(RAIZ, 'docs', 'dist');
const CSS = path.join(RAIZ, 'scripts', 'exportar-guia.css');
const LOGO = path.join(RAIZ, 'frontend', 'public', 'logo-terra.png');
const VINO = 'a6192e';
const FUENTE_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';

const SOLO = (process.argv.indexOf('--solo') >= 0) ? process.argv[process.argv.indexOf('--solo') + 1] : 'todo';

// ---------------------------------------------------------------- Lectura del Markdown
const md = fs.readFileSync(MD, 'utf8').replace(/\r\n/g, '\n');
const posIndice = md.indexOf('\n## Índice');
if (posIndice < 0) throw new Error('No se encontró la sección "## Índice" en la guía.');
const mdPortada = md.slice(0, posIndice);
const mdCuerpo = md.slice(posIndice + 1);

const tituloGuia = (mdPortada.match(/^# (.+)$/m) || [, 'Guía de Usuario'])[1].trim();
const filasPortada = [...mdPortada.matchAll(/^\| \*\*(.+?)\*\* \| (.+?) \|$/gm)].map((m) => [m[1].trim(), m[2].trim()]);
const version = (filasPortada.find(([k]) => /versión del documento/i.test(k)) || [, '1.0'])[1];
const nombreBase = `Guia_Usuario_TERRA_Autoservicio_v${version}`;

// Índice de la guía: "N. [Título](#ancla)".
const bloqueIndice = mdCuerpo.slice(0, mdCuerpo.indexOf('\n---'));
const entradasIndice = [...bloqueIndice.matchAll(/^(\d+)\. \[(.+?)\]\(#(.+?)\)$/gm)].map((m) => ({ numero: Number(m[1]), titulo: m[2], ancla: m[3] }));
// Cuerpo sin el índice en Markdown (se vuelve a generar con números de página).
const mdSinIndice = mdCuerpo.slice(mdCuerpo.indexOf('\n---') + 4);

const NOTAS = { '⚠️': ['advertencia', 'Atención'], '💡': ['consejo', 'Consejo'], '🔒': ['privacidad', 'Privacidad'] };
const RE_NOTA = /^(⚠️|💡|🔒)\s+(.*)$/;

// Ancla al estilo GitHub, igual que los enlaces del índice.
const ancla = (texto) => texto.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
const esCelular = (archivo) => /^despacho-/.test(path.basename(archivo));

// ---------------------------------------------------------------- HTML (PDF)
function htmlDeCuerpo(paginas = {}) {
  // Notas y marcas ✅/❌ se resuelven antes del parser para no depender de fuentes de emoji.
  const lineas = mdSinIndice.split('\n').map((linea) => {
    const nota = linea.match(RE_NOTA);
    if (nota) {
      const [clase, etiqueta] = NOTAS[nota[1]];
      return `<div class="nota nota-${clase}"><span class="nota-etiqueta">${etiqueta}</span><p>${marked.parseInline(nota[2])}</p></div>`;
    }
    return linea.replace(/✅/g, '<span class="si">✓</span>').replace(/❌/g, '<span class="no">✗</span>');
  });

  const renderer = {
    heading({ tokens, depth }) {
      const texto = this.parser.parseInline(tokens);
      const plano = tokens.map((t) => t.raw ?? t.text ?? '').join('');
      const id = ancla(plano);
      const seccion = depth === 2 && /^\d+\. /.test(plano) ? Number(plano.match(/^(\d+)\./)[1]) : null;
      const clase = seccion ? ' class="seccion"' : '';
      const marca = seccion ? `<span class="marca-pagina">SECMARK${seccion}END</span>` : '';
      return `<h${depth} id="${id}"${clase}>${texto}${marca}</h${depth}>\n`;
    },
    image({ href, text }) {
      const archivo = path.join(IMG, path.basename(href));
      const clase = esCelular(archivo) ? ' class="celular"' : '';
      return `<figure${clase}><img src="${pathToFileURL(archivo).href}" alt="${text}"><figcaption>${text}</figcaption></figure>`;
    },
    paragraph({ tokens }) {
      // Un párrafo que sólo contiene una imagen se vuelve <figure>, no <p><figure>.
      if (tokens.length === 1 && tokens[0].type === 'image') return this.parser.parseInline(tokens);
      return `<p>${this.parser.parseInline(tokens)}</p>\n`;
    },
  };
  marked.use({ gfm: true, renderer });

  const indice = `<h2 id="índice">Índice</h2>\n<nav class="indice"><ol>${entradasIndice.map((e) =>
    `<li><a href="#${e.ancla}"><span class="numero">${e.numero}.</span><span class="titulo">${e.titulo}</span><span class="pagina">${paginas[e.numero] ?? ''}</span></a></li>`).join('')}</ol></nav>\n`;

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${tituloGuia}</title>
<link rel="stylesheet" href="${FUENTE_URL}"><link rel="stylesheet" href="${pathToFileURL(CSS).href}"></head>
<body class="cuerpo">${indice}${marked.parse(lineas.join('\n'))}</body></html>`;
}

function htmlDePortada() {
  const filas = filasPortada.map(([k, v]) => `<tr><th>${k}</th><td>${marked.parseInline(v)}</td></tr>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${tituloGuia}</title>
<link rel="stylesheet" href="${FUENTE_URL}"><link rel="stylesheet" href="${pathToFileURL(CSS).href}"></head>
<body class="portada"><img class="logo" src="${pathToFileURL(LOGO).href}" alt="TERRA Autoservicio">
<p class="etiqueta">Manual para usuarios finales</p><h1>${tituloGuia.replace(' · ', '<br>')}</h1>
<p class="subtitulo">Kiosco digital, portal mayorista y backoffice · organizado por tipo de usuario</p>
<table>${filas}</table><p class="pie-portada">Documento de uso interno de TERRA Autoservicio. Las capturas contienen datos de ejemplo.</p></body></html>`;
}

async function imprimir(page, html, { conEncabezado }) {
  const temporal = path.join(DIST, `_tmp_${Date.now()}.html`);
  fs.writeFileSync(temporal, html, 'utf8');
  try {
    await page.goto(pathToFileURL(temporal).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete), null, { timeout: 60000 });
    const pie = `<div style="font-family:Inter,Arial,sans-serif;font-size:8.5pt;color:#707974;width:100%;padding:0 2cm;display:flex;justify-content:space-between;align-items:center">
      <span>Versión ${version}</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`;
    const cabecera = `<div style="font-family:Inter,Arial,sans-serif;font-size:8.5pt;color:#707974;width:100%;padding:0 2cm;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e4e2e1">
      <span>${tituloGuia}</span><span style="color:#${VINO};font-weight:700">TERRA</span></div>`;
    return await page.pdf({
      format: 'A4', printBackground: true, preferCSSPageSize: false,
      margin: conEncabezado ? { top: '2.4cm', bottom: '2.2cm', left: '2cm', right: '2cm' } : { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
      displayHeaderFooter: conEncabezado, headerTemplate: cabecera, footerTemplate: pie,
    });
  } finally {
    fs.rmSync(temporal, { force: true });
  }
}

// Página en la que cae cada sección, leyendo las marcas invisibles del PDF.
async function paginasDeSecciones(pdfBytes) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBytes), useSystemFonts: true, disableFontFace: true, verbosity: 0 }).promise;
  const paginas = {};
  for (let n = 1; n <= doc.numPages; n += 1) {
    const contenido = await (await doc.getPage(n)).getTextContent();
    const texto = contenido.items.map((i) => i.str || '').join('');
    for (const m of texto.matchAll(/SECMARK(\d+)END/g)) if (!paginas[m[1]]) paginas[m[1]] = n;
  }
  return { paginas, total: doc.numPages };
}

async function generarPdf() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    const primera = await imprimir(page, htmlDeCuerpo(), { conEncabezado: true });
    const { paginas } = await paginasDeSecciones(primera);
    const faltan = entradasIndice.filter((e) => !paginas[e.numero]).map((e) => e.numero);
    if (faltan.length) console.warn('Sin página detectada para las secciones:', faltan.join(', '));
    const cuerpo = await imprimir(page, htmlDeCuerpo(paginas), { conEncabezado: true });
    const portada = await imprimir(page, htmlDePortada(), { conEncabezado: false });

    const docCuerpo = await PDFDocument.load(cuerpo);
    const docPortada = await PDFDocument.load(portada);
    const [pagPortada] = await docCuerpo.copyPages(docPortada, [0]);
    docCuerpo.insertPage(0, pagPortada);
    docCuerpo.setTitle(`${tituloGuia} · v${version}`);
    docCuerpo.setLanguage('es');
    docCuerpo.setProducer('scripts/exportar-guia.mjs');
    const salida = path.join(DIST, `${nombreBase}.pdf`);
    fs.writeFileSync(salida, await docCuerpo.save());
    return { salida, paginas: docCuerpo.getPageCount(), secciones: paginas };
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------- DOCX
const CM = (cm) => Math.round(cm * 567); // twips
const ANCHO_CONTENIDO_PX = Math.round(((21 - 4) / 2.54) * 96); // 17 cm a 96 dpi

function tamanoPng(buffer) {
  return { ancho: buffer.readUInt32BE(16), alto: buffer.readUInt32BE(20) };
}

function imagenDocx(archivo, { celular }) {
  const buffer = fs.readFileSync(archivo);
  const { ancho, alto } = tamanoPng(buffer);
  const anchoFinal = Math.round(ANCHO_CONTENIDO_PX * (celular ? 0.4 : 1));
  return new D.ImageRun({ type: 'png', data: buffer, transformation: { width: anchoFinal, height: Math.round(alto * anchoFinal / ancho) }, altText: { title: path.basename(archivo), description: path.basename(archivo), name: path.basename(archivo) } });
}

// Tokens en línea de marked → TextRun[] (negrita, cursiva, código, enlaces, ✅/❌).
function runsDe(tokens, estilo = {}) {
  const runs = [];
  for (const t of tokens || []) {
    switch (t.type) {
      case 'strong': runs.push(...runsDe(t.tokens, { ...estilo, bold: true })); break;
      case 'em': runs.push(...runsDe(t.tokens, { ...estilo, italics: true })); break;
      case 'codespan': runs.push(new D.TextRun({ text: t.text, font: 'Consolas', size: 19, shading: { type: D.ShadingType.CLEAR, fill: 'F3F1F1' }, ...estilo })); break;
      case 'link': runs.push(...runsDe(t.tokens, { ...estilo, color: VINO })); break;
      case 'br': runs.push(new D.TextRun({ break: 1 })); break;
      case 'escape': runs.push(new D.TextRun({ text: t.text, ...estilo })); break;
      case 'text': {
        if (t.tokens) { runs.push(...runsDe(t.tokens, estilo)); break; }
        const partes = String(t.text).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").split(/(✅|❌)/);
        for (const parte of partes) {
          if (!parte) continue;
          if (parte === '✅') runs.push(new D.TextRun({ text: 'Sí', bold: true, color: '168147', ...estilo }));
          else if (parte === '❌') runs.push(new D.TextRun({ text: 'No', bold: true, color: 'BA1A1A', ...estilo }));
          else runs.push(new D.TextRun({ text: parte, ...estilo }));
        }
        break;
      }
      default: if (t.raw) runs.push(new D.TextRun({ text: t.raw, ...estilo }));
    }
  }
  return runs;
}

function parrafoNota(texto) {
  const nota = texto.match(RE_NOTA);
  if (!nota) return null;
  const [clase, etiqueta] = NOTAS[nota[1]];
  const colores = { advertencia: ['FFF4E0', 'D98C00', '9A5F00'], consejo: ['E9F1FB', '2A6FB8', '1F4F85'], privacidad: ['F0F0F0', '6B6B6B', '4A4A4A'] }[clase];
  return new D.Paragraph({
    shading: { type: D.ShadingType.CLEAR, fill: colores[0] },
    border: { left: { style: D.BorderStyle.SINGLE, size: 24, color: colores[1], space: 8 } },
    indent: { left: CM(0.3) },
    spacing: { before: 120, after: 160 },
    keepLines: true,
    children: [new D.TextRun({ text: `${etiqueta.toUpperCase()} · `, bold: true, color: colores[2], size: 18 }), ...runsDe(marked.lexer(nota[2])[0]?.tokens || [])],
  });
}

function tablaDocx(token) {
  const filaDe = (celdas, encabezado, alterna = false) => new D.TableRow({
    tableHeader: encabezado,
    cantSplit: true,
    children: celdas.map((celda) => new D.TableCell({
      shading: encabezado ? { type: D.ShadingType.CLEAR, fill: VINO } : (alterna ? { type: D.ShadingType.CLEAR, fill: 'FAF5F5' } : undefined),
      margins: { top: 60, bottom: 60, left: 90, right: 90 },
      children: [new D.Paragraph({ spacing: { before: 0, after: 0 }, children: runsDe(celda.tokens, encabezado ? { bold: true, color: 'FFFFFF', size: 19 } : { size: 19 }) })],
    })),
  });
  // Encabezado repetido en cada página y filas alternadas.
  const filas = [filaDe(token.header, true), ...token.rows.map((r, i) => filaDe(r, false, i % 2 === 1))];
  return new D.Table({
    width: { size: 100, type: D.WidthType.PERCENTAGE },
    borders: { top: borde(), bottom: borde(), left: borde(), right: borde(), insideHorizontal: borde(), insideVertical: borde() },
    rows: token.rows.length ? filas : [filas[0]],
  });
}
const borde = () => ({ style: D.BorderStyle.SINGLE, size: 4, color: 'DCD9D9' });

let instanciaLista = 0;
function listaDocx(token, nivel = 0) {
  const parrafos = [];
  const referencia = token.ordered ? 'lista-numerada' : 'lista-vinetas';
  const instancia = token.ordered ? ++instanciaLista : 0;
  for (const item of token.items) {
    const inline = []; const bloques = [];
    for (const t of item.tokens) {
      if (t.type === 'text' || t.type === 'paragraph') inline.push(...(t.tokens || []));
      else if (t.type === 'list') bloques.push(t);
    }
    parrafos.push(new D.Paragraph({ numbering: { reference: referencia, level: nivel, instance: instancia }, spacing: { after: 60 }, children: runsDe(inline) }));
    for (const sub of bloques) parrafos.push(...listaDocx(sub, nivel + 1));
  }
  return parrafos;
}

function cuerpoDocx() {
  const tokens = marked.lexer(mdSinIndice);
  const salida = [];
  for (const t of tokens) {
    switch (t.type) {
      case 'heading': {
        const plano = t.text;
        const esSeccion = t.depth === 2 && /^\d+\. /.test(plano);
        const nivel = { 1: D.HeadingLevel.HEADING_1, 2: D.HeadingLevel.HEADING_1, 3: D.HeadingLevel.HEADING_2, 4: D.HeadingLevel.HEADING_3 }[t.depth] || D.HeadingLevel.HEADING_3;
        salida.push(new D.Paragraph({ heading: nivel, pageBreakBefore: esSeccion, keepNext: true, children: runsDe(t.tokens) }));
        break;
      }
      case 'paragraph': {
        if (t.tokens.length === 1 && t.tokens[0].type === 'image') {
          const archivo = path.join(IMG, path.basename(t.tokens[0].href));
          salida.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, keepNext: true, spacing: { before: 160, after: 60 }, children: [imagenDocx(archivo, { celular: esCelular(archivo) })] }));
          salida.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 200 }, children: [new D.TextRun({ text: t.tokens[0].text, size: 18, color: '707974' })] }));
          break;
        }
        const nota = parrafoNota(t.text);
        if (nota) { salida.push(nota); break; }
        salida.push(new D.Paragraph({ spacing: { after: 140 }, children: runsDe(t.tokens) }));
        break;
      }
      case 'list': salida.push(...listaDocx(t)); break;
      case 'table': salida.push(tablaDocx(t), new D.Paragraph({ spacing: { after: 120 }, children: [] })); break;
      case 'hr': case 'space': break;
      case 'html': break;
      default: if (t.text) salida.push(new D.Paragraph({ children: [new D.TextRun(t.text)] }));
    }
  }
  return salida;
}

async function generarDocx() {
  const logo = fs.readFileSync(LOGO);
  const { ancho, alto } = tamanoPng(logo);
  const anchoLogo = 280;
  const portada = [
    new D.Paragraph({ spacing: { before: 2400, after: 600 }, children: [new D.ImageRun({ type: 'png', data: logo, transformation: { width: anchoLogo, height: Math.round(alto * anchoLogo / ancho) }, altText: { title: 'TERRA', description: 'Logo TERRA Autoservicio', name: 'logo' } })] }),
    new D.Paragraph({ spacing: { after: 120 }, children: [new D.TextRun({ text: 'MANUAL PARA USUARIOS FINALES', bold: true, color: VINO, size: 20, characterSpacing: 40 })] }),
    new D.Paragraph({ spacing: { after: 160 }, children: [new D.TextRun({ text: tituloGuia, bold: true, size: 56 })] }),
    new D.Paragraph({ spacing: { after: 600 }, children: [new D.TextRun({ text: 'Kiosco digital, portal mayorista y backoffice · organizado por tipo de usuario', size: 26, color: '707974' })] }),
    new D.Table({
      width: { size: 100, type: D.WidthType.PERCENTAGE },
      borders: { top: borde(), bottom: borde(), left: { style: D.BorderStyle.NONE }, right: { style: D.BorderStyle.NONE }, insideHorizontal: borde(), insideVertical: { style: D.BorderStyle.NONE } },
      rows: filasPortada.map(([k, v]) => new D.TableRow({ children: [
        new D.TableCell({ width: { size: 32, type: D.WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new D.Paragraph({ children: [new D.TextRun({ text: k, bold: true, color: VINO })] })] }),
        new D.TableCell({ width: { size: 68, type: D.WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new D.Paragraph({ children: runsDe(marked.lexer(v)[0]?.tokens || []) })] }),
      ] })),
    }),
    new D.Paragraph({ spacing: { before: 800 }, children: [new D.TextRun({ text: 'Documento de uso interno de TERRA Autoservicio. Las capturas contienen datos de ejemplo.', size: 18, color: '707974' })] }),
  ];

  const indice = [
    new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: [new D.TextRun('Índice')] }),
    new D.TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-2' }),
  ];

  const doc = new D.Document({
    creator: 'TERRA Autoservicio',
    title: `${tituloGuia} · v${version}`,
    description: 'Guía de usuario por rol',
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: 'Inter', size: 22, color: '1B1C1C' }, paragraph: { spacing: { line: 300 } } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 40, bold: true, color: VINO, font: 'Inter' }, paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0, keepNext: true, border: { bottom: { style: D.BorderStyle.SINGLE, size: 12, color: VINO, space: 4 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: VINO, font: 'Inter' }, paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1, keepNext: true } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, color: VINO, font: 'Inter' }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 2, keepNext: true } },
      ],
    },
    numbering: {
      config: [
        { reference: 'lista-numerada', levels: [0, 1, 2].map((n) => ({ level: n, format: D.LevelFormat.DECIMAL, text: `%${n + 1}.`, alignment: D.AlignmentType.START, style: { paragraph: { indent: { left: CM(0.75 + n * 0.75), hanging: CM(0.6) } } } })) },
        { reference: 'lista-vinetas', levels: [0, 1, 2].map((n) => ({ level: n, format: D.LevelFormat.BULLET, text: n === 0 ? '•' : '–', alignment: D.AlignmentType.START, style: { paragraph: { indent: { left: CM(0.75 + n * 0.75), hanging: CM(0.5) } } } })) },
      ],
    },
    sections: [
      { properties: { page: { size: { width: CM(21), height: CM(29.7) }, margin: { top: CM(2), bottom: CM(2), left: CM(2), right: CM(2) } } }, children: portada },
      {
        properties: { page: { size: { width: CM(21), height: CM(29.7) }, margin: { top: CM(2), bottom: CM(2), left: CM(2), right: CM(2), header: CM(1), footer: CM(1) }, pageNumbers: { start: 1 } } },
        headers: { default: new D.Header({ children: [new D.Paragraph({ border: { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: 'E4E2E1', space: 4 } }, children: [new D.TextRun({ text: `${tituloGuia}`, size: 17, color: '707974' }), new D.TextRun({ text: '\tTERRA', size: 17, bold: true, color: VINO })], tabStops: [{ type: D.TabStopType.RIGHT, position: CM(17) }] })] }) },
        footers: { default: new D.Footer({ children: [new D.Paragraph({ children: [new D.TextRun({ text: `Versión ${version}`, size: 17, color: '707974' }), new D.TextRun({ text: '\tPágina ', size: 17, color: '707974' }), new D.TextRun({ children: [D.PageNumber.CURRENT], size: 17, color: '707974' }), new D.TextRun({ text: ' de ', size: 17, color: '707974' }), new D.TextRun({ children: [D.PageNumber.TOTAL_PAGES_IN_SECTION], size: 17, color: '707974' })], tabStops: [{ type: D.TabStopType.RIGHT, position: CM(17) }] })] }) },
        children: [...indice, ...cuerpoDocx()],
      },
    ],
  });
  const salida = path.join(DIST, `${nombreBase}.docx`);
  fs.writeFileSync(salida, await D.Packer.toBuffer(doc));
  return { salida };
}

// ---------------------------------------------------------------- Ejecución
fs.mkdirSync(DIST, { recursive: true });
const resumen = [];
if (SOLO === 'todo' || SOLO === 'pdf') {
  const r = await generarPdf();
  resumen.push(`PDF  ${path.relative(RAIZ, r.salida)} · ${r.paginas} páginas · ${(fs.statSync(r.salida).size / 1048576).toFixed(2)} MB · secciones en páginas ${Object.entries(r.secciones).map(([s, p]) => `${s}:${p}`).join(' ')}`);
}
if (SOLO === 'todo' || SOLO === 'docx') {
  const r = await generarDocx();
  resumen.push(`DOCX ${path.relative(RAIZ, r.salida)} · ${(fs.statSync(r.salida).size / 1048576).toFixed(2)} MB`);
}
console.log(resumen.join('\n'));
