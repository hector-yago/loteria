import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CabeceraComponent } from '../core/cabecera';
import { compartirDecimo } from '../core/compartir';
import { IconComponent } from '../core/icon';
import { Decimo, ESTADOS, Estado, PRECIO_DECIMO_CENT, Reparto } from '../core/models';
import { formatoEuros, formatoNumero, partePersona, pendienteDeAsignar, repartoEquitativo } from '../core/reparto';
import { Store } from '../core/store';
import { Ui } from '../core/ui';

/** "12,5" o "12.5" → céntimos; null si no es un importe válido. */
function aCentimos(texto: string): number | null {
  const v = parseFloat(texto.trim().replace(',', '.'));
  return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) : null;
}
const aTexto = (cent: number) => String(cent / 100).replace('.', ',');

@Component({
  selector: 'app-detalle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CabeceraComponent, IconComponent],
  template: `
    <app-cabecera [titulo]="esNuevo() ? 'Nuevo décimo' : 'Décimo'" [atras]="true" [anio]="false">
      @if (!esNuevo()) {
        <button class="icon-btn" type="button" (click)="compartir()" aria-label="Compartir"><app-icon name="share" /></button>
        <button class="icon-btn" type="button" (click)="confirmando.set(true)" aria-label="Eliminar"><app-icon name="trash" /></button>
      }
    </app-cabecera>
    <div class="pad">
      @if (confirmando()) {
        <div class="card"><b>¿Eliminar este décimo?</b><p class="note">Se borrará con su reparto. No se puede deshacer.</p>
          <div class="row"><button class="btn ghost sm" type="button" style="flex:1" (click)="confirmando.set(false)">Cancelar</button><button class="btn sm" type="button" style="flex:1" (click)="eliminar()">Eliminar</button></div></div>
      }
      <div class="ticket">
        <div class="t1"><span>Lotería de Navidad</span><span>{{ anio() }}</span></div>
        <div class="tn">{{ numero().length === 5 ? num(numero()) : '· · · · ·' }}</div>
        <div class="t3"><span>{{ lugar() || 'Sin lugar' }}</span><span>{{ eur(importe()) }}</span></div>
      </div>

      <button class="btn ghost" type="button" (click)="favorito.set(!favorito())"><app-icon name="star" [fill]="favorito()" />{{ favorito() ? 'Quitar de favoritos' : 'Añadir a favoritos' }}</button>

      <div class="field"><label for="num">Número (5 cifras)</label>
        <input class="input" id="num" inputmode="numeric" maxlength="5" [value]="numero()" (input)="numero.set(limpiar($any($event.target).value))">
        @if (numero() && numero().length !== 5) { <span class="note">Faltan cifras.</span> }</div>
      <div class="field"><label for="lugar">Detalles</label>
        <input class="input" id="lugar" [value]="lugar()" (input)="lugar.set($any($event.target).value)" placeholder="Bar, administración, trabajo…"></div>
      <div class="field"><label for="cant">Cantidad que juego</label>
        <div class="seg"><button type="button" [class.on]="unidad() === 'eur'" (click)="cambiarUnidad('eur')">Euros</button><button type="button" [class.on]="unidad() === 'dec'" (click)="cambiarUnidad('dec')">Décimos</button></div>
        <input class="input" id="cant" inputmode="decimal" [value]="cantidadTxt()" (input)="escribirCantidad($any($event.target).value)">
        <span class="note">Equivale a {{ eur(importe()) }} ({{ importe() / precio }} décimos)</span></div>
      <div class="field"><label>Estado</label>
        <div class="chips">@for (e of estados; track e[0]) { <button type="button" class="chip" [class.on]="estado() === e[0]" (click)="estado.set(e[0])">{{ e[1] }}</button> }</div></div>

      @if (estado() === 'premiado') {
        <div class="field"><label for="premio">Premio total que ha tocado (€)</label>
          <input class="input" id="premio" inputmode="decimal" [value]="premioTxt()" (input)="escribirPremio($any($event.target).value)"></div>
      }

      <div class="card">
        <div class="sect"><h3>Repartir entre</h3></div>
        <div class="seg" style="margin:10px 0 4px"><button type="button" [class.on]="modo() === 'equi'" (click)="modo.set('equi')">Equitativo</button><button type="button" [class.on]="modo() === 'man'" (click)="modo.set('man')">Importe a mano</button></div>
        @for (r of destinos(); track r.id) {
          @if (modo() === 'equi') {
            <div class="who" role="button" tabindex="0" (click)="alternar(r.id)" (keydown.enter)="alternar(r.id)" (keydown.space)="alternar(r.id); $event.preventDefault()">
              <span class="av" [style.background]="r.color">{{ r.nombre[0] }}</span><div class="grow"><b>{{ r.nombre }}</b>@if (r.grupo) { <span>Grupo</span> }</div>
              <span class="amt">{{ importeEq(r.id) !== null ? eur(importeEq(r.id)!) : '—' }}</span><span class="tick" [class.on]="elegidos().includes(r.id)"><app-icon name="check" /></span></div>
          } @else {
            <div class="who"><span class="av" [style.background]="r.color">{{ r.nombre[0] }}</span><div class="grow"><b>{{ r.nombre }}</b></div>
              <div class="step">
                <button type="button" (click)="ajustar(r.id, -50)" [attr.aria-label]="'Menos ' + r.nombre">−</button>
                <input class="amt-input" inputmode="decimal" [attr.aria-label]="'Importe de ' + r.nombre"
                  [value]="editando() === r.id ? editTxt() : eur(manual()[r.id] ?? 0)"
                  (focus)="enfocar(r.id, $event)" (input)="escribirManual(r.id, $any($event.target).value)" (blur)="soltar()" (keydown.enter)="$any($event.target).blur()">
                <button type="button" (click)="ajustar(r.id, 50)" [attr.aria-label]="'Más ' + r.nombre">+</button></div></div>
          }
        } @empty { <p class="note">Crea personas o grupos en la pestaña Personas para repartir.</p> }
        @if (destinos().length) {
          @if (pendiente() === 0 && repartoActual().length) { <div class="ok">Repartido por completo: {{ eur(importe()) }}.</div> }
          @else { <div class="hint">{{ pendiente() > 0 ? 'Faltan por asignar ' + eur(pendiente()) : 'Te pasas en ' + eur(-pendiente()) }}.</div> }
        }
      </div>
      @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
      <button class="btn" type="button" (click)="guardar()">Guardar</button>
    </div>
  `,
})
export class DetallePage {
  protected readonly store = inject(Store);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ui = inject(Ui);
  protected readonly estados = Object.entries(ESTADOS) as [Estado, string][];
  protected readonly eur = formatoEuros;
  protected readonly num = formatoNumero;
  protected readonly precio = PRECIO_DECIMO_CENT;

  private readonly id = this.ruta.snapshot.paramMap.get('id')!;
  protected readonly esNuevo = computed(() => this.id === 'nuevo');
  protected readonly anio = signal(this.store.year());
  protected readonly numero = signal('');
  protected readonly lugar = signal('');
  protected readonly importe = signal(PRECIO_DECIMO_CENT);
  protected readonly unidad = signal<'eur' | 'dec'>('eur');
  /** Texto del campo de cantidad: se guarda tal cual lo escribe el usuario (evita perder la coma al teclear). */
  protected readonly cantidadTxt = signal(aTexto(PRECIO_DECIMO_CENT));
  protected readonly estado = signal<Estado>('comprado');
  protected readonly favorito = signal(false);
  protected readonly premio = signal(0);
  protected readonly premioTxt = signal('');
  protected readonly modo = signal<'equi' | 'man'>('equi');
  protected readonly elegidos = signal<string[]>([]);
  protected readonly manual = signal<Record<string, number>>({});
  protected readonly editando = signal<string | null>(null);
  protected readonly editTxt = signal('');
  protected readonly error = signal('');
  protected readonly confirmando = signal(false);
  private original?: Decimo;

  protected readonly destinos = computed(() => [
    ...this.store.personas().map((p) => ({ id: 'p:' + p.id, nombre: p.nombre, color: p.color, grupo: false })),
    ...this.store.grupos().map((g) => ({ id: 'g:' + g.id, nombre: g.nombre, color: '#4A5550', grupo: true })),
  ]);
  protected readonly repartoActual = computed<Reparto[]>(() =>
    this.modo() === 'equi'
      ? repartoEquitativo(this.importe(), this.elegidos())
      : Object.entries(this.manual()).filter(([, c]) => c > 0).map(([destino, importeCent]) => ({ destino, importeCent })));
  protected readonly pendiente = computed(() => pendienteDeAsignar({ importeCent: this.importe() }, this.repartoActual()));

  constructor() {
    effect(() => {
      if (!this.store.listo() || this.original || this.esNuevo()) return;
      const d = this.store.decimos().find((x) => x.id === this.id);
      if (!d) { void this.router.navigate(['/decimos']); return; }
      this.original = d;
      this.anio.set(d.year); this.numero.set(d.numero); this.lugar.set(d.lugar);
      this.importe.set(d.importeCent); this.cantidadTxt.set(aTexto(d.importeCent));
      this.estado.set(d.estado); this.premio.set(d.premioCent); this.premioTxt.set(d.premioCent ? aTexto(d.premioCent) : '');
      this.favorito.set(d.favorito);
      const eq = d.reparto.length > 0 && repartoEquitativo(d.importeCent, d.reparto.map((r) => r.destino))
        .every((r, i) => r.importeCent === d.reparto[i].importeCent);
      this.modo.set(eq || !d.reparto.length ? 'equi' : 'man');
      this.elegidos.set(d.reparto.map((r) => r.destino));
      this.manual.set(Object.fromEntries(d.reparto.map((r) => [r.destino, r.importeCent])));
    });
  }

  protected limpiar(v: string) { return v.replace(/\D/g, '').slice(0, 5); }

  protected cambiarUnidad(u: 'eur' | 'dec') {
    this.unidad.set(u);
    this.cantidadTxt.set(u === 'eur' ? aTexto(this.importe()) : String(this.importe() / PRECIO_DECIMO_CENT).replace('.', ','));
  }
  protected escribirCantidad(texto: string) {
    this.cantidadTxt.set(texto);
    const c = aCentimos(texto);
    if (c !== null) this.importe.set(this.unidad() === 'eur' ? c : Math.round((c * PRECIO_DECIMO_CENT) / 100));
  }
  protected escribirPremio(texto: string) { this.premioTxt.set(texto); this.premio.set(aCentimos(texto) ?? 0); }

  protected alternar(id: string) { this.elegidos.update((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])); }
  protected importeEq(id: string): number | null { return this.repartoActual().find((r) => r.destino === id)?.importeCent ?? null; }

  protected ajustar(id: string, delta: number) {
    this.manual.update((m) => ({ ...m, [id]: Math.max(0, (m[id] ?? 0) + delta) }));
  }
  /** Al tocar el importe se muestra el número en bruto, seleccionado, para teclear la cantidad. */
  protected enfocar(id: string, e: Event) {
    const el = e.target as HTMLInputElement;
    this.editando.set(id);
    this.editTxt.set(aTexto(this.manual()[id] ?? 0));
    setTimeout(() => el.select());
  }
  protected escribirManual(id: string, texto: string) {
    this.editTxt.set(texto);
    const c = aCentimos(texto);
    if (c !== null) this.manual.update((m) => ({ ...m, [id]: c }));
  }
  protected soltar() { this.editando.set(null); }

  protected async guardar() {
    if (!/^\d{5}$/.test(this.numero())) { this.error.set('El número debe tener 5 cifras.'); return; }
    if (this.importe() <= 0) { this.error.set('La cantidad debe ser mayor que 0.'); return; }
    if (this.pendiente() < 0) { this.error.set('El reparto supera lo que juegas. Ajusta los importes.'); return; }
    this.error.set('');
    await this.store.guardarDecimo({
      ...(this.original ?? { premioCent: 0, reparto: [] }),
      id: this.original?.id, year: this.anio(), numero: this.numero(), lugar: this.lugar().trim(),
      importeCent: this.importe(), estado: this.estado(), premioCent: this.estado() === 'premiado' ? this.premio() : 0,
      favorito: this.favorito(), reparto: this.repartoActual(),
    } as Omit<Decimo, 'id'> & { id?: string });
    this.ui.aviso('Décimo guardado');
    void this.router.navigate(['/decimos']);
  }

  protected async eliminar() {
    if (this.original) await this.store.eliminarDecimo(this.original.id);
    this.ui.aviso('Décimo eliminado');
    void this.router.navigate(['/decimos']);
  }

  protected async compartir() {
    if (!this.original) return;
    // Cada persona con lo que juega en este décimo (directo + su parte de los grupos), no el nombre del grupo.
    const d = this.original, grupos = this.store.grupos();
    const reparto = this.store.personas()
      .map((p) => ({ nombre: p.nombre, cent: partePersona(d, p.id, grupos) }))
      .filter((p) => p.cent > 0)
      .map((p) => ({ nombre: p.nombre, importe: formatoEuros(p.cent) }));
    const ok = await compartirDecimo({ year: this.anio(), numero: this.numero(), reparto });
    if (!ok) this.ui.aviso('Tu navegador no permite compartir; se ha descargado la imagen.');
  }
}
