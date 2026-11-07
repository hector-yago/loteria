import { Decimo, Destino, Grupo, Persona, Reparto } from './models';

/** Reparto equitativo en céntimos enteros; el último recibe el resto. */
export function repartoEquitativo(totalCent: number, destinos: Destino[]): Reparto[] {
  if (destinos.length === 0) return [];
  const base = Math.floor(totalCent / destinos.length);
  let acumulado = 0;
  return destinos.map((destino, i) => {
    const importeCent = i === destinos.length - 1 ? totalCent - acumulado : base;
    acumulado += importeCent;
    return { destino, importeCent };
  });
}

/** Céntimos pendientes de asignar (negativo si se excede). */
export function pendienteDeAsignar(d: Pick<Decimo, 'importeCent'>, reparto: Reparto[]): number {
  return d.importeCent - reparto.reduce((a, r) => a + r.importeCent, 0);
}

const esGrupo = (d: Destino) => d.startsWith('g:');
const idDe = (d: Destino) => d.slice(2);

/** Cuenta solo décimos ya comprados (no pendientes). */
function contables(decimos: Decimo[]): Decimo[] {
  return decimos.filter((d) => d.estado !== 'pendiente');
}

/** Importe por persona; lo asignado a un grupo se divide a partes iguales entre sus miembros. */
export function resumenPorPersona(decimos: Decimo[], personas: Persona[], grupos: Grupo[]): Map<string, number> {
  const totales = new Map<string, number>(personas.map((p) => [p.id, 0]));
  for (const d of contables(decimos)) {
    for (const r of d.reparto) {
      if (!esGrupo(r.destino)) {
        const id = idDe(r.destino);
        totales.set(id, (totales.get(id) ?? 0) + r.importeCent);
      } else {
        const g = grupos.find((x) => x.id === idDe(r.destino));
        if (!g) continue;
        for (const parte of repartoEquitativo(r.importeCent, g.personaIds.map((p) => 'p:' + p))) {
          const id = idDe(parte.destino);
          totales.set(id, (totales.get(id) ?? 0) + parte.importeCent);
        }
      }
    }
  }
  return totales;
}

export function resumenPorGrupo(decimos: Decimo[], grupos: Grupo[]): Map<string, number> {
  const totales = new Map<string, number>(grupos.map((g) => [g.id, 0]));
  for (const d of contables(decimos)) {
    for (const r of d.reparto) {
      if (esGrupo(r.destino)) {
        totales.set(idDe(r.destino), (totales.get(idDe(r.destino)) ?? 0) + r.importeCent);
      }
    }
  }
  return totales;
}

/** Premio proporcional: cada destino cobra según su parte del importe jugado. */
export function premioPorDestino(d: Decimo): Reparto[] {
  if (d.premioCent <= 0 || d.importeCent <= 0) return [];
  let acumulado = 0;
  return d.reparto.map((r, i) => {
    const importeCent =
      i === d.reparto.length - 1
        ? d.premioCent - acumulado
        : Math.round((d.premioCent * r.importeCent) / d.importeCent);
    acumulado += importeCent;
    return { destino: r.destino, importeCent };
  });
}

export function formatoEuros(cent: number): string {
  return (cent / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

export function formatoNumero(n: string): string {
  return n.length === 5 ? `${n.slice(0, 2)}.${n.slice(2)}` : n;
}

/** Favoritos de otros años, uno por número (el del año más reciente), para crear un sorteo nuevo. */
export function favoritosParaAnio(decimos: Decimo[], year: number): Decimo[] {
  const porNumero = new Map<string, Decimo>();
  for (const d of [...decimos].sort((a, b) => a.year - b.year)) {
    if (d.favorito && d.year !== year) porNumero.set(d.numero, d);
  }
  return [...porNumero.values()];
}

/** Lo que juega una persona en un décimo (directo + su parte de los grupos en que está). */
export function partePersona(d: Decimo, personaId: string, grupos: Grupo[]): number {
  let total = 0;
  for (const r of d.reparto) {
    if (r.destino === 'p:' + personaId) total += r.importeCent;
    else if (r.destino.startsWith('g:')) {
      const g = grupos.find((x) => 'g:' + x.id === r.destino);
      const parte = g && repartoEquitativo(r.importeCent, g.personaIds.map((p) => 'p:' + p)).find((x) => x.destino === 'p:' + personaId);
      if (parte) total += parte.importeCent;
    }
  }
  return total;
}

/** Lo que juega una persona de un grupo en un décimo, solo por ese grupo. */
export function partePersonaEnGrupo(d: Decimo, personaId: string, grupo: Grupo): number {
  const r = d.reparto.find((x) => x.destino === 'g:' + grupo.id);
  if (!r) return 0;
  return repartoEquitativo(r.importeCent, grupo.personaIds.map((p) => 'p:' + p)).find((x) => x.destino === 'p:' + personaId)?.importeCent ?? 0;
}

/**
 * Lo que juego yo en un décimo: mi parte directa y por grupos, más lo que aún no está
 * asignado a nadie. Sin ninguna persona marcada como «yo», cuenta el décimo entero.
 */
export function miParteCent(d: Decimo, yoIds: string[], grupos: Grupo[]): number {
  if (yoIds.length === 0) return d.importeCent;
  const sinAsignar = Math.max(0, d.importeCent - d.reparto.reduce((a, r) => a + r.importeCent, 0));
  return sinAsignar + yoIds.reduce((a, id) => a + partePersona(d, id, grupos), 0);
}

/** Premio que me corresponde: el premio total en proporción a mi parte del décimo. */
export function miPremioCent(d: Decimo, yoIds: string[], grupos: Grupo[]): number {
  if (d.premioCent <= 0 || d.importeCent <= 0) return 0;
  return Math.round((d.premioCent * miParteCent(d, yoIds, grupos)) / d.importeCent);
}
