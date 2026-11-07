import { Decimo, Grupo, Persona, Sorteo } from './models';

export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: 'mis-decimos';
  version: number;
  exportadoEn: string;
  sorteos: Sorteo[];
  personas: Persona[];
  grupos: Grupo[];
  decimos: Decimo[];
}

export async function crearBackup(
  d: { sorteos: Sorteo[]; personas: Persona[]; grupos: Grupo[]; decimos: Decimo[] },
  ahora = new Date(),
): Promise<BackupFile> {
  return {
    app: 'mis-decimos', version: BACKUP_VERSION, exportadoEn: ahora.toISOString(),
    sorteos: d.sorteos, personas: d.personas, grupos: d.grupos, decimos: d.decimos,
  };
}

/** Valida estructura mínima; lanza Error con mensaje en castellano si el archivo no sirve. */
export function validarBackup(x: unknown): BackupFile {
  const b = x as Partial<BackupFile> | null;
  if (!b || b.app !== 'mis-decimos') throw new Error('El archivo no es una copia de Mis Décimos.');
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION)
    throw new Error('La copia es de una versión más nueva de la app. Actualiza la app e inténtalo de nuevo.');
  for (const k of ['sorteos', 'personas', 'grupos', 'decimos'] as const)
    if (!Array.isArray(b[k])) throw new Error(`La copia está dañada: falta «${k}».`);
  for (const d of b.decimos!) {
    if (typeof d.id !== 'string' || !/^\d{5}$/.test(d.numero) || !Number.isInteger(d.importeCent))
      throw new Error('La copia está dañada: hay un décimo con datos no válidos.');
  }
  return b as BackupFile;
}

export async function leerBackup(texto: string): Promise<{ sorteos: Sorteo[]; personas: Persona[]; grupos: Grupo[]; decimos: Decimo[] }> {
  let json: unknown;
  try { json = JSON.parse(texto); } catch { throw new Error('El archivo no es un JSON válido.'); }
  const b = validarBackup(json);
  // Las copias antiguas pueden traer el campo «foto» (función retirada): se descarta.
  const decimos = b.decimos.map(({ foto: _foto, ...resto }: Decimo & { foto?: unknown }) => resto as Decimo);
  return { sorteos: b.sorteos, personas: b.personas, grupos: b.grupos, decimos };
}
