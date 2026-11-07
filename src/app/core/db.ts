import Dexie, { Table } from 'dexie';
import { Decimo, Grupo, Persona, Sorteo } from './models';

export class LoteriaDb extends Dexie {
  decimos!: Table<Decimo, string>;
  personas!: Table<Persona, string>;
  grupos!: Table<Grupo, string>;
  sorteos!: Table<Sorteo, number>;

  constructor() {
    super('loteria');
    this.version(1).stores({
      decimos: 'id, year, estado, favorito',
      personas: 'id',
      grupos: 'id',
      sorteos: 'year',
    });
  }
}

export const db = new LoteriaDb();
