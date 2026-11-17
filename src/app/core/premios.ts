import { Categoria, PremioSorteo } from './models';

/** Importes por décimo de 20 € (en céntimos), tabla oficial vigente de la Lotería de Navidad. */
export const IMPORTE_DECIMO_CENT: Record<Categoria, number> = {
  primero: 40_000_000, segundo: 12_500_000, tercero: 5_000_000, cuarto: 2_000_000, quinto: 600_000,
};
export const APROXIMACION_CENT: Partial<Record<Categoria, number>> = { primero: 200_000, segundo: 125_000, tercero: 96_000 };
export const CENTENA_CENT = 10_000;
export const TERMINACION_CENT = 10_000;
export const REINTEGRO_CENT = 2_000;

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  primero: '1.er premio', segundo: '2.º premio', tercero: '3.er premio', cuarto: '4.º premio', quinto: '5.º premio',
};
export const MAX_POR_CATEGORIA: Record<Categoria, number> = { primero: 1, segundo: 1, tercero: 1, cuarto: 2, quinto: 8 };
export const CATEGORIAS: Categoria[] = ['primero', 'segundo', 'tercero', 'cuarto', 'quinto'];

export interface Motivo { texto: string; cent: number }
export interface Comprobacion { cent: number; motivos: Motivo[] }

/**
 * Premios (sin pedrea) de un décimo de 20 € para los números del sorteo.
 * Por cada premio: directo; si no, aproximación (1.º–3.º, anterior/posterior) y centena (1.º–4.º);
 * terminación de 2 cifras (1.º–3.º) y reintegro (última cifra del 1.º). Se acumulan entre premios distintos.
 */
export function comprobarDecimo(numero: string, premios: PremioSorteo[]): Comprobacion {
  const motivos: Motivo[] = [];
  const n = Number(numero);
  for (const p of premios) {
    const nom = NOMBRE_CATEGORIA[p.categoria];
    if (p.numero === numero) { motivos.push({ texto: nom, cent: IMPORTE_DECIMO_CENT[p.categoria] }); continue; }
    const aprox = APROXIMACION_CENT[p.categoria];
    const m = Number(p.numero);
    if (aprox && (n === (m + 1) % 100000 || n === (m + 99999) % 100000)) {
      motivos.push({ texto: `Aproximación al ${nom}`, cent: aprox }); continue;
    }
    if (p.categoria !== 'quinto' && p.numero.slice(0, 3) === numero.slice(0, 3)) motivos.push({ texto: `Centena del ${nom}`, cent: CENTENA_CENT });
    if (p.categoria !== 'cuarto' && p.categoria !== 'quinto' && p.numero.slice(3) === numero.slice(3))
      motivos.push({ texto: `Terminación de 2 cifras del ${nom}`, cent: TERMINACION_CENT });
    if (p.categoria === 'primero' && p.numero[4] === numero[4]) motivos.push({ texto: 'Reintegro', cent: REINTEGRO_CENT });
  }
  return { cent: motivos.reduce((a, x) => a + x.cent, 0), motivos };
}

/** Escala el premio de un décimo de 20 € al importe jugado. */
export const escalarPremio = (centPorDecimo: number, importeCent: number) => Math.round((centPorDecimo * importeCent) / 2000);
