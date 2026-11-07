import { validarBackup } from './backup';

const base = { app: 'mis-decimos', version: 1, exportadoEn: '', sorteos: [], personas: [], grupos: [], decimos: [] };

describe('validarBackup', () => {
  it('acepta una copia válida', () => expect(validarBackup(base).version).toBe(1));
  it('rechaza archivos ajenos', () => expect(() => validarBackup({ app: 'otra' })).toThrowError(/no es una copia/));
  it('rechaza versión futura', () => expect(() => validarBackup({ ...base, version: 99 })).toThrowError(/más nueva/));
  it('rechaza décimos con número inválido', () =>
    expect(() => validarBackup({ ...base, decimos: [{ id: 'x', numero: '12', importeCent: 100 }] })).toThrowError(/dañada/));
});
