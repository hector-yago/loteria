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
  reparto: Reparto[];
  notas?: string;
}

export interface Persona {
  id: string;
  nombre: string;
  color: string;
  /** Esta persona soy yo (puede haber varias): el informe cuenta solo lo que juegan ellas. */
  soyYo?: boolean;
}

export interface Grupo {
  id: string;
  nombre: string;
  personaIds: string[];
}

export type Categoria = 'primero' | 'segundo' | 'tercero' | 'cuarto' | 'quinto';

/** Número agraciado con uno de los primeros premios (sin pedrea). */
export interface PremioSorteo {
  id: string;
  categoria: Categoria;
  numero: string; // 5 cifras
}

export interface Sorteo {
  year: number;
  fecha: string; // ISO yyyy-mm-dd
  premios?: PremioSorteo[];
}

export const PRECIO_DECIMO_CENT = 2000;
