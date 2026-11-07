import { Decimo, Grupo, Persona } from './models';
import { premioPorDestino, repartoEquitativo, resumenPorGrupo, resumenPorPersona } from './reparto';

const dec = (p: Partial<Decimo>): Decimo => ({
  id: 'x', year: 2026, numero: '12345', lugar: 'Bar', importeCent: 2000, estado: 'comprado',
  favorito: false, premioCent: 0, reparto: [], ...p,
});
const personas: Persona[] = ['a', 'b', 'c'].map((id) => ({ id, nombre: id.toUpperCase(), color: '#000' }));
const grupos: Grupo[] = [
  { id: 'g1', nombre: 'AC', personaIds: ['a', 'c'] },
  { id: 'g2', nombre: 'BC', personaIds: ['b', 'c'] },
];

describe('repartoEquitativo', () => {
  it('reparte 20 € entre 3 sin perder céntimos', () => {
    const r = repartoEquitativo(2000, ['p:a', 'p:b', 'p:c']);
    expect(r.map((x) => x.importeCent)).toEqual([666, 666, 668]);
    expect(r.reduce((a, x) => a + x.importeCent, 0)).toBe(2000);
  });
  it('sin destinos devuelve vacío', () => expect(repartoEquitativo(2000, [])).toEqual([]));
});

describe('resúmenes', () => {
  const ds = [
    dec({ reparto: [{ destino: 'g:g1', importeCent: 1000 }, { destino: 'p:b', importeCent: 1000 }] }),
    dec({ estado: 'pendiente', reparto: [{ destino: 'p:a', importeCent: 2000 }] }),
  ];
  it('divide el grupo entre sus miembros y ignora pendientes', () => {
    const t = resumenPorPersona(ds, personas, grupos);
    expect(t.get('a')).toBe(500);
    expect(t.get('c')).toBe(500);
    expect(t.get('b')).toBe(1000);
  });
  it('suma por grupo', () => {
    const t = resumenPorGrupo(ds, grupos);
    expect(t.get('g1')).toBe(1000);
    expect(t.get('g2')).toBe(0);
  });
});

describe('premioPorDestino', () => {
  it('es proporcional y suma el premio', () => {
    const d = dec({ premioCent: 2000, reparto: [{ destino: 'p:a', importeCent: 500 }, { destino: 'p:b', importeCent: 1500 }] });
    expect(premioPorDestino(d).map((x) => x.importeCent)).toEqual([500, 1500]);
  });
});

import { favoritosParaAnio, partePersona, partePersonaEnGrupo } from './reparto';

describe('favoritos y partes', () => {
  it('copia un favorito por número desde otros años', () => {
    const ds = [dec({ id: '1', year: 2024, numero: '11111', favorito: true }), dec({ id: '2', year: 2025, numero: '11111', favorito: true, lugar: 'Nuevo' }),
      dec({ id: '3', year: 2025, numero: '22222', favorito: false }), dec({ id: '4', year: 2026, numero: '33333', favorito: true })];
    const f = favoritosParaAnio(ds, 2026);
    expect(f.length).toBe(1);
    expect(f[0].lugar).toBe('Nuevo');
  });
  it('parte de persona suma directo y grupo', () => {
    const d = dec({ reparto: [{ destino: 'g:g1', importeCent: 1000 }, { destino: 'p:a', importeCent: 500 }] });
    expect(partePersona(d, 'a', grupos)).toBe(1000);
    expect(partePersona(d, 'b', grupos)).toBe(0);
    expect(partePersonaEnGrupo(d, 'c', grupos[0])).toBe(500);
  });
});
