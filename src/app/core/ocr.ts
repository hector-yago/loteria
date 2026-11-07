/**
 * Lee el número de 5 cifras de la foto de un décimo, en el propio móvil (Tesseract.js).
 * El motor y el idioma se sirven desde la app (/ocr), sin enviar la imagen a ningún servidor.
 */

export interface PalabraOcr { texto: string; alto: number }

/**
 * Elige el número del décimo entre las palabras leídas: 5 cifras (con o sin punto
 * de millar) y el texto más alto, porque el número va impreso en grande.
 */
export function elegirNumero(palabras: PalabraOcr[]): string | null {
  let mejor: { n: string; alto: number } | null = null;
  for (const p of palabras) {
    const m = p.texto.replace(/\s/g, '').match(/^(\d{2})[.,]?(\d{3})$/);
    if (!m) continue;
    if (!mejor || p.alto > mejor.alto) mejor = { n: m[1] + m[2], alto: p.alto };
  }
  return mejor?.n ?? null;
}

async function prepararImagen(f: Blob, anchoMax = 1800): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(f);
  const k = Math.min(1, anchoMax / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const g = c.getContext('2d')!;
  g.filter = 'grayscale(1) contrast(1.4)';
  g.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c;
}

/** Devuelve el número leído o null si no se ha podido leer con seguridad. */
export async function leerNumeroDecimo(foto: Blob): Promise<string | null> {
  const { createWorker } = await import('tesseract.js');
  const base = document.baseURI;
  const worker = await createWorker('eng', 1, {
    workerPath: new URL('ocr/worker.min.js', base).href,
    corePath: new URL('ocr/core', base).href,
    langPath: new URL('ocr/lang', base).href,
    gzip: true,
  });
  try {
    await worker.setParameters({ tessedit_char_whitelist: '0123456789.', tessedit_pageseg_mode: '11' as never });
    const { data } = await worker.recognize(await prepararImagen(foto), {}, { blocks: true });
    const palabras: PalabraOcr[] = [];
    for (const b of data.blocks ?? [])
      for (const p of b.paragraphs) for (const l of p.lines) for (const w of l.words)
        palabras.push({ texto: w.text, alto: w.bbox.y1 - w.bbox.y0 });
    return elegirNumero(palabras);
  } finally {
    await worker.terminate();
  }
}
