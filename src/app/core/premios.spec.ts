import { describe, expect, it } from 'vitest';
import { PremioSorteo } from './models';
import { comprobarDecimo, escalarPremio } from './premios';

const P: PremioSorteo[] = [
  { id: '1', categoria: 'primero', numero: '12345' },
  { id: '2', categoria: 'segundo', numero: '67890' },
  { id: '3', categoria: 'quinto', numero: '00001' },
];

describe('comprobarDecimo', () => {
  it('premio directo', () => expect(comprobarDecimo('12345', P).cent).toBe(40_000_000));
  it('aproximación anterior y posterior', () => {
    expect(comprobarDecimo('12344', P).cent).toBe(200_000);
    expect(comprobarDecimo('12346', P).cent).toBe(200_000);
    expect(comprobarDecimo('67891', P).cent).toBe(125_000);
  });
  it('centena', () => expect(comprobarDecimo('12399', P).cent).toBe(10_000));
  it('terminación de 2 cifras más reintegro del primero', () => expect(comprobarDecimo('99945', P).cent).toBe(10_000 + 2_000));
  it('reintegro solo', () => expect(comprobarDecimo('55555', P).cent).toBe(2_000));
  it('sin premio', () => expect(comprobarDecimo('99992', P).cent).toBe(0));
  it('escala por importe jugado', () => expect(escalarPremio(10_000, 500)).toBe(2_500));
});
