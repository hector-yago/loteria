import { elegirNumero } from './ocr';

describe('elegirNumero', () => {
  it('elige el número de 5 cifras más alto', () =>
    expect(elegirNumero([{ texto: '20', alto: 30 }, { texto: '05490', alto: 120 }, { texto: '12345', alto: 40 }])).toBe('05490'));
  it('acepta punto de millar', () => expect(elegirNumero([{ texto: '27.883', alto: 90 }])).toBe('27883'));
  it('sin candidatos devuelve null', () => expect(elegirNumero([{ texto: '2026', alto: 50 }, { texto: '007', alto: 20 }])).toBeNull());
});
