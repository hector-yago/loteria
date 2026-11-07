/** Genera imágenes con canvas y las comparte (Web Share) o las descarga si no hay soporte. */

const FUENTE = "'DM Sans', system-ui, sans-serif";
const DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";

/**
 * Plantilla del décimo real: `public/plantilla-decimo.png` (593 × 344 px de referencia).
 * Coordenadas en píxeles de esa referencia; se escalan si la imagen tiene otro tamaño.
 * - numero: hueco blanco bajo «S.E. Loterías y Apuestas del Estado»; texto negro que ocupa todo su alto.
 * - fecha: se tapa la fecha impresa con un degradado muestreado en los bordes y se escribe la del año.
 * Si cambias de plantilla, ajusta estos valores. Sin imagen se dibuja una tarjeta genérica.
 */
export const PLANTILLA = {
  src: 'plantilla-decimo.png',
  ref: { w: 593 },
  numero: { x: 205, y: 42, w: 265, h: 66 },
  fecha: { px: 214, py: 166, pw: 246, ph: 26, cx: 337, cy: 179, tam: 21, muestraIzq: 208, muestraDer: 464 },
};

export const fechaSorteo = (year: number) => `22 de diciembre de ${year}`;

function lienzo(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, g: c.getContext('2d', { willReadFrequently: true })! };
}

function aBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo crear la imagen'))), 'image/png'));
}

function cargarImagen(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = new URL(src, document.baseURI).href;
  });
}

/** Devuelve true si se abrió el menú de compartir; false si se descargó. */
export async function compartirBlob(blob: Blob, nombre: string, texto: string): Promise<boolean> {
  const file = new File([blob], nombre, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text: texto }); return true; }
    catch (e) { if ((e as DOMException).name === 'AbortError') return true; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return false;
}

export interface TarjetaDecimo { year: number; numero: string; reparto: { nombre: string; importe: string }[] }

export const textoDecimo = (t: TarjetaDecimo) =>
  [`Lotería de Navidad ${t.numero}`, ...t.reparto.map((r) => `${r.nombre}: ${r.importe}`)].join('\n');

export async function dibujarDecimo(t: TarjetaDecimo): Promise<HTMLCanvasElement> {
  const img = await cargarImagen(PLANTILLA.src);
  const fecha = fechaSorteo(t.year);
  await Promise.all([document.fonts.load(`800 80px ${DISPLAY}`), document.fonts.load(`600 20px ${FUENTE}`)]);

  if (img) {
    const k = img.naturalWidth / PLANTILLA.ref.w;
    const { c, g } = lienzo(img.naturalWidth, img.naturalHeight);
    g.drawImage(img, 0, 0);
    const F = PLANTILLA.fecha, N = PLANTILLA.numero;

    // Fecha: parche con degradado horizontal tomado de los bordes de cada fila.
    const px = (x: number, y: number) => g.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data;
    const bordes = Array.from({ length: F.ph }, (_, i) => [px(F.muestraIzq, F.py + i), px(F.muestraDer, F.py + i)]);
    bordes.forEach(([izq, der], i) => {
      const gr = g.createLinearGradient(F.px * k, 0, (F.px + F.pw) * k, 0);
      gr.addColorStop(0, `rgb(${izq[0]},${izq[1]},${izq[2]})`);
      gr.addColorStop(1, `rgb(${der[0]},${der[1]},${der[2]})`);
      g.fillStyle = gr;
      g.fillRect(F.px * k, (F.py + i) * k, F.pw * k, k + 1);
    });
    g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 ${F.tam * k}px ${FUENTE}`;
    g.fillText(fecha, F.cx * k, F.cy * k);

    // Número: negro, tan alto como el hueco (se reduce si no cabe a lo ancho).
    let tam = N.h * k * 1.05;
    g.font = `800 ${tam}px ${DISPLAY}`;
    const ancho = g.measureText(t.numero).width;
    if (ancho > N.w * k) { tam *= (N.w * k) / ancho; g.font = `800 ${tam}px ${DISPLAY}`; }
    g.fillText(t.numero, (N.x + N.w / 2) * k, (N.y + N.h / 2) * k + tam * 0.04);
    return c;
  }

  // Sin plantilla: tarjeta genérica con el mismo contenido.
  const W = 1000, H = 560;
  const { c, g } = lienzo(W, H);
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#F9EFD3'); grad.addColorStop(1, '#F2DFAE');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#D9BD7A'; g.lineWidth = 8; g.strokeRect(12, 12, W - 24, H - 24);
  g.fillStyle = '#7A5A12'; g.font = `700 40px ${FUENTE}`; g.textAlign = 'center';
  g.fillText('LOTERÍA DE NAVIDAD', W / 2, 100);
  g.fillStyle = '#000'; g.font = `800 190px ${DISPLAY}`; g.fillText(t.numero, W / 2, 320);
  g.fillStyle = '#3A2A08'; g.font = `500 40px ${FUENTE}`; g.fillText(fecha, W / 2, 440);
  return c;
}

export async function compartirDecimo(t: TarjetaDecimo): Promise<boolean> {
  return compartirBlob(await aBlob(await dibujarDecimo(t)), `decimo-${t.numero}.png`, textoDecimo(t));
}

export interface TablaMatriz {
  titulo: string;
  columnas: string[]; // números de décimo
  /** «Comprado en» de cada columna (mismo orden); si ninguno tiene valor, no se dibuja la fila. */
  lugares?: string[];
  filas: { nombre: string; celdas: string[]; total: string }[]; // total = lo que paga cada persona
}

/** Parte `texto` en hasta `max` líneas que caben en `ancho`; la última lleva «…» si no cabe todo. */
function envolver(g: CanvasRenderingContext2D, texto: string, ancho: number, max: number): string[] {
  const lineas: string[] = [];
  let actual = '';
  const palabras = texto.split(/\s+/).filter(Boolean);
  for (let i = 0; i < palabras.length; i++) {
    const prueba = actual ? `${actual} ${palabras[i]}` : palabras[i];
    if (g.measureText(prueba).width <= ancho || !actual) { actual = prueba; continue; }
    lineas.push(actual); actual = palabras[i];
    if (lineas.length === max - 1) { actual = palabras.slice(i).join(' '); break; }
  }
  if (actual) lineas.push(actual);
  const ultima = lineas.length - 1;
  while (ultima >= 0 && g.measureText(lineas[ultima]).width > ancho && lineas[ultima].length > 1)
    lineas[ultima] = lineas[ultima].slice(0, -2).trimEnd() + '…';
  return lineas;
}

/** Tabla: personas en filas, números de décimo en columnas, cantidad en cada celda. */
export async function compartirMatriz(m: TablaMatriz): Promise<boolean> {
  await document.fonts.load(`500 18px ${FUENTE}`);
  const colW = 150, nomW = 230, totW = 150, fh = 56, anchoLugar = colW - 16, altoLinea = 22;

  // «Comprado en»: fila extra bajo los números, solo si algún décimo tiene lugar.
  const lugares = m.lugares ?? [];
  const hayLugares = lugares.some((l) => l.trim() !== '');
  const medida = lienzo(1, 1).g;
  medida.font = `500 18px ${FUENTE}`;
  const lineasLugar = hayLugares ? m.columnas.map((_, i) => envolver(medida, (lugares[i] ?? '').trim(), anchoLugar, 2)) : [];
  const extra = hayLugares ? Math.max(1, ...lineasLugar.map((l) => l.length)) * altoLinea + 12 : 0;

  const W = nomW + m.columnas.length * colW + totW + 40, H = 150 + extra + m.filas.length * fh;
  const { c, g } = lienzo(Math.max(W, 560), H);
  g.fillStyle = '#1F5C45'; g.fillRect(0, 0, c.width, H);
  g.fillStyle = '#FFFFFF'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `700 38px ${FUENTE}`; g.fillText(m.titulo, 30, 62);
  const x = (i: number) => 20 + nomW + i * colW + colW; // borde derecho de la columna i
  const xTotal = 20 + nomW + m.columnas.length * colW + totW;
  g.font = `600 24px ${MONO}`; g.textAlign = 'right'; g.globalAlpha = 0.85;
  m.columnas.forEach((n, i) => g.fillText(`${n.slice(0, 2)}.${n.slice(2)}`, x(i) - 12, 124));
  g.fillText('TOTAL', xTotal - 12, 124);

  if (hayLugares) {
    g.font = `500 18px ${FUENTE}`; g.globalAlpha = 0.75;
    g.textAlign = 'left'; g.fillText('Comprado en', 20, 156);
    g.textAlign = 'right';
    lineasLugar.forEach((ls, i) => ls.forEach((l, j) => g.fillText(l, x(i) - 12, 156 + j * altoLinea)));
  }
  g.globalAlpha = 1;

  const linea = (y: number) => { g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(20, y, c.width - 40, 2); g.fillStyle = '#FFFFFF'; };
  linea(138 + extra);
  const fila = (y: number, nombre: string, celdas: string[], total: string) => {
    g.font = `500 28px ${FUENTE}`;
    g.textAlign = 'left'; g.fillText(nombre, 20, y);
    g.textAlign = 'right';
    celdas.forEach((v, i) => { g.globalAlpha = v === '' ? 0.3 : 1; g.fillText(v === '' ? '—' : v, x(i) - 12, y); });
    g.globalAlpha = 1; g.font = `700 28px ${FUENTE}`; g.fillText(total, xTotal - 12, y);
  };
  m.filas.forEach((f, i) => fila(182 + extra + i * fh, f.nombre, f.celdas, f.total));
  return compartirBlob(await aBlob(c), 'resumen-loteria.png', m.titulo);
}
