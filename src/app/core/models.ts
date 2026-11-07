export type Estado = 'pendiente' | 'comprado' | 'premiado' | 'sin_premiar';

export const ESTADOS: Record<Estado, string> = {
  pendiente: 'Pendiente de compra',
  comprado: 'Comprado',
  premiado: 'Premiado',
  sin_premiar: 'Sin premiar',
};

/** Destino de un reparto: "p:<id>" para persona, "g:<id>" para grupo. */
export type Destino = string;

export interface Reparto {
  destino: Destino;
  importeCent: number;
}

export interface Decimo {
  id: string;
  year: number;
  numero: string; // 5 cifras
  serie?: string;
  fraccion?: string;
  lugar: string;
  importeCent: number; // lo que juego, en céntimos
  estado: Estado;
  favorito: boolean;
  premioCent: number;
  premioTexto?: string;
  foto?: Blob;
  reparto: Reparto[];
  notas?: string;
}

export interface Persona {
  id: string;
  nombre: string;
  color: string;
}

export interface Grupo {
  id: string;
  nombre: string;
  personaIds: string[];
}

export interface Sorteo {
  year: number;
  fecha: string; // ISO yyyy-mm-dd
}

export const PRECIO_DECIMO_CENT = 2000;
