import { Injectable, computed, signal } from '@angular/core';
import { crearBackup, leerBackup } from './backup';
import { db } from './db';
import { Decimo, Estado, Grupo, Persona, PremioSorteo, Sorteo } from './models';
import { favoritosParaAnio, miParteCent, miPremioCent } from './reparto';

const nuevoId = () => crypto.randomUUID();
const COLORES = ['#B3202A', '#1F5C45', '#8A5A00', '#1F5E86', '#6B3FA0', '#B34A1F'];

@Injectable({ providedIn: 'root' })
export class Store {
  readonly decimos = signal<Decimo[]>([]);
  readonly personas = signal<Persona[]>([]);
  readonly grupos = signal<Grupo[]>([]);
  readonly sorteos = signal<Sorteo[]>([]);
  readonly year = signal<number>(this.leerYear());
  readonly tema = signal<'sistema' | 'claro' | 'oscuro'>(this.leerTema());
  readonly listo = signal(false);

  readonly decimosAnio = computed(() => this.decimos().filter((d) => d.year === this.year()));
  /** Ids de las personas marcadas como «yo». */
  readonly yoIds = computed(() => this.personas().filter((p) => p.soyYo).map((p) => p.id));
  /** Lo que juego yo (no lo comprado en total) en el año seleccionado. */
  readonly totalJugadoCent = computed(() => this.decimosAnio().filter((d) => d.estado !== 'pendiente').reduce((a, d) => a + this.miParte(d), 0));
  readonly totalPremioCent = computed(() => this.decimosAnio().reduce((a, d) => a + this.miPremio(d), 0));
  readonly porComprarCent = computed(() => this.decimosAnio().filter((d) => d.estado === 'pendiente').reduce((a, d) => a + this.miParte(d), 0));

  constructor() {
    this.aplicarTema();
    void this.cargar();
  }

  miParte(d: Decimo) { return miParteCent(d, this.yoIds(), this.grupos()); }
  miPremio(d: Decimo) { return miPremioCent(d, this.yoIds(), this.grupos()); }

  async cargar() {
    const [d, p, g, s] = await Promise.all([db.decimos.toArray(), db.personas.toArray(), db.grupos.toArray(), db.sorteos.toArray()]);
    this.decimos.set(d); this.personas.set(p); this.grupos.set(g); this.sorteos.set(s.sort((a, b) => b.year - a.year));
    if (!s.some((x) => x.year === this.year())) await this.crearSorteo(this.year());
    this.listo.set(true);
    // Pide almacenamiento persistente para que el navegador no purgue los datos.
    void navigator.storage?.persist?.();
  }

  // ---- ajustes ----
  setYear(y: number) { this.year.set(y); try { localStorage.setItem('year', String(y)); } catch { /* sin almacenamiento */ } }
  setTema(t: 'sistema' | 'claro' | 'oscuro') { this.tema.set(t); try { localStorage.setItem('tema', t); } catch { /* */ } this.aplicarTema(); }
  private leerYear() { try { const y = Number(localStorage.getItem('year')); if (y) return y; } catch { /* */ } return new Date().getFullYear(); }
  private leerTema(): 'sistema' | 'claro' | 'oscuro' { try { const t = localStorage.getItem('tema'); if (t === 'claro' || t === 'oscuro') return t; } catch { /* */ } return 'sistema'; }
  private aplicarTema() {
    const r = document.documentElement, t = this.tema();
    if (t === 'sistema') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', t === 'oscuro' ? 'dark' : 'light');
  }

  /** Crea el sorteo del año y, si es nuevo, copia como «pendiente de compra» los décimos favoritos. */
  async crearSorteo(year: number) {
    const existia = this.sorteos().some((x) => x.year === year);
    const s: Sorteo = { year, fecha: `${year}-12-22` };
    await db.sorteos.put(s);
    this.sorteos.update((l) => [...l.filter((x) => x.year !== year), s].sort((a, b) => b.year - a.year));
    if (existia) return;
    const ya = new Set(this.decimos().filter((d) => d.year === year).map((d) => d.numero));
    for (const f of favoritosParaAnio(this.decimos(), year)) {
      if (ya.has(f.numero)) continue;
      await this.guardarDecimo({ ...f, id: undefined, year, estado: 'pendiente', premioCent: 0, premioTexto: undefined });
    }
  }

  /** Elimina el sorteo y todos sus décimos. Si era el año en uso, pasa al más reciente que quede. */
  async eliminarSorteo(year: number) {
    if (this.sorteos().length <= 1) return;
    const ids = this.decimos().filter((d) => d.year === year).map((d) => d.id);
    await db.transaction('rw', db.decimos, db.sorteos, async () => { await db.decimos.bulkDelete(ids); await db.sorteos.delete(year); });
    this.decimos.update((l) => l.filter((d) => d.year !== year));
    this.sorteos.update((l) => l.filter((s) => s.year !== year));
    if (this.year() === year) this.setYear(Math.max(...this.sorteos().map((s) => s.year)));
  }

  // ---- primeros premios del sorteo ----
  readonly premiosAnio = computed(() => this.sorteos().find((s) => s.year === this.year())?.premios ?? []);
  private async guardarPremios(premios: PremioSorteo[]) {
    const s = this.sorteos().find((x) => x.year === this.year()) ?? { year: this.year(), fecha: `${this.year()}-12-22` };
    const nuevo: Sorteo = { ...s, premios };
    await db.sorteos.put(nuevo);
    this.sorteos.update((l) => [...l.filter((x) => x.year !== nuevo.year), nuevo].sort((a, b) => b.year - a.year));
  }
  async guardarPremio(p: Omit<PremioSorteo, 'id'> & { id?: string }) {
    const completo: PremioSorteo = { ...p, id: p.id ?? nuevoId() };
    await this.guardarPremios([...this.premiosAnio().filter((x) => x.id !== completo.id), completo]);
  }
  async eliminarPremio(id: string) { await this.guardarPremios(this.premiosAnio().filter((x) => x.id !== id)); }

  // ---- décimos ----
  async guardarDecimo(d: Omit<Decimo, 'id'> & { id?: string }): Promise<Decimo> {
    const completo: Decimo = { ...d, id: d.id ?? nuevoId() };
    await db.decimos.put(completo);
    this.decimos.update((l) => [...l.filter((x) => x.id !== completo.id), completo]);
    return completo;
  }
  async eliminarDecimo(id: string) { await db.decimos.delete(id); this.decimos.update((l) => l.filter((x) => x.id !== id)); }
  async alternarFavorito(id: string) { const d = this.decimos().find((x) => x.id === id); if (d) await this.guardarDecimo({ ...d, favorito: !d.favorito }); }
  async cambiarEstado(id: string, estado: Estado) { const d = this.decimos().find((x) => x.id === id); if (d) await this.guardarDecimo({ ...d, estado }); }

  // ---- personas y grupos ----
  async guardarPersona(nombre: string, soyYo: boolean, id?: string) {
    const prev = this.personas().find((p) => p.id === id);
    const p: Persona = { id: id ?? nuevoId(), nombre: nombre.trim(), color: prev?.color ?? COLORES[this.personas().length % COLORES.length], soyYo };
    await db.personas.put(p); this.personas.update((l) => [...l.filter((x) => x.id !== p.id), p]);
  }
  async eliminarPersona(id: string) {
    await db.personas.delete(id);
    this.personas.update((l) => l.filter((x) => x.id !== id));
    for (const g of this.grupos().filter((g) => g.personaIds.includes(id))) await this.guardarGrupo(g.nombre, g.personaIds.filter((x) => x !== id), g.id);
    for (const d of this.decimos().filter((d) => d.reparto.some((r) => r.destino === 'p:' + id))) await this.guardarDecimo({ ...d, reparto: d.reparto.filter((r) => r.destino !== 'p:' + id) });
  }
  async guardarGrupo(nombre: string, personaIds: string[], id?: string) {
    const g: Grupo = { id: id ?? nuevoId(), nombre: nombre.trim(), personaIds };
    await db.grupos.put(g); this.grupos.update((l) => [...l.filter((x) => x.id !== g.id), g]);
  }
  async eliminarGrupo(id: string) {
    await db.grupos.delete(id); this.grupos.update((l) => l.filter((x) => x.id !== id));
    for (const d of this.decimos().filter((d) => d.reparto.some((r) => r.destino === 'g:' + id))) await this.guardarDecimo({ ...d, reparto: d.reparto.filter((r) => r.destino !== 'g:' + id) });
  }
  nombreDestino(destino: string): string {
    const id = destino.slice(2);
    return (destino.startsWith('g:') ? this.grupos().find((g) => g.id === id)?.nombre : this.personas().find((p) => p.id === id)?.nombre) ?? '(eliminado)';
  }

  // ---- copia de seguridad ----
  async exportar() {
    return crearBackup({ sorteos: this.sorteos(), personas: this.personas(), grupos: this.grupos(), decimos: this.decimos() });
  }
  /** Reemplaza todos los datos tras validar el archivo completo. */
  async importar(texto: string) {
    const b = await leerBackup(texto);
    await db.transaction('rw', db.decimos, db.personas, db.grupos, db.sorteos, async () => {
      await Promise.all([db.decimos.clear(), db.personas.clear(), db.grupos.clear(), db.sorteos.clear()]);
      await Promise.all([db.decimos.bulkPut(b.decimos), db.personas.bulkPut(b.personas), db.grupos.bulkPut(b.grupos), db.sorteos.bulkPut(b.sorteos)]);
    });
    await this.cargar();
  }
}
