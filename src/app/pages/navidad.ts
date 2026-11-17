import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CabeceraComponent } from '../core/cabecera';
import { IconComponent } from '../core/icon';
import { Categoria } from '../core/models';
import { CATEGORIAS, MAX_POR_CATEGORIA, NOMBRE_CATEGORIA, comprobarDecimo, escalarPremio } from '../core/premios';
import { formatoEuros, formatoNumero } from '../core/reparto';
import { Store } from '../core/store';

@Component({
  selector: 'app-navidad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CabeceraComponent, IconComponent, RouterLink],
  template: `
    <app-cabecera titulo="Día de Navidad" />
    <div class="pad">
      <div class="card">
        <div class="lbl" style="margin-bottom:8px">Primeros premios {{ store.year() }}</div>
        @for (p of store.premiosAnio(); track p.id) {
          <div class="who"><div class="grow"><b>{{ num(p.numero) }}</b><span>{{ nombre[p.categoria] }}</span></div>
            <button class="btn ghost sm" type="button" (click)="editar(p.id, p.categoria, p.numero)">Editar</button></div>
        } @empty { <p class="note" style="margin:0 0 8px">Aún no has introducido ningún premio.</p> }

        @if (abierto()) {
          <div class="field" style="margin-top:8px"><label for="cat">Premio</label>
            <select class="input" id="cat" [value]="categoria()" (change)="categoria.set($any($event.target).value)">
              @for (c of categorias; track c) { <option [value]="c">{{ nombre[c] }}</option> }
            </select></div>
          <div class="field"><label for="num">Número (5 cifras)</label>
            <input class="input" id="num" inputmode="numeric" maxlength="5" autocomplete="off" [value]="numero()" (input)="numero.set(soloCifras($any($event.target).value))"></div>
          @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
          <div class="row" style="margin-top:10px">
            @if (editId()) { <button class="btn ghost sm" type="button" (click)="borrar()">Eliminar</button> }
            <button class="btn ghost sm" type="button" style="flex:1" (click)="cerrar()">Cancelar</button>
            <button class="btn sm" type="button" style="flex:1" (click)="guardar()">Guardar</button></div>
        } @else { <button class="btn ghost" type="button" style="margin-top:8px" (click)="abierto.set(true)"><app-icon name="plus" />Añadir premio</button> }
      </div>

      <div class="sect"><h3>Mis décimos</h3></div>
      @if (!store.premiosAnio().length) { <div class="hint">Introduce los números premiados para ver cuáles te han tocado. No se incluye la pedrea.</div> }
      @if (total() > 0) { <div class="card stat"><b style="color:var(--ok)">{{ eur(total()) }}</b><span>premios sin pedrea</span></div> }
      @for (l of lineas(); track l.id) {
        <a class="who" [routerLink]="['/decimos', l.id]" [style.border-color]="l.cent ? 'var(--ok)' : ''" [style.background]="l.cent ? 'color-mix(in srgb, var(--ok) 14%, transparent)' : ''">
          <div class="num" style="font-size:16px;padding:4px 8px" [style.color]="l.cent ? 'var(--ok)' : ''">{{ num(l.numero) }}</div>
          <div class="grow">
            <b>{{ l.lugar || 'Sin lugar' }}</b>
            @for (m of l.motivos; track m.texto) { <span style="color:var(--ok);display:block">{{ m.texto }}: {{ eur(m.cent) }}</span> }
            @if (l.pendiente) { <span class="pill s-pendiente">Pendiente de compra</span> }
          </div>
          <span class="amt" [style.color]="l.cent ? 'var(--ok)' : ''">{{ l.cent ? eur(l.cent) : eur(l.importe) }}</span></a>
      } @empty { <p class="note">No tienes décimos en {{ store.year() }}.</p> }
    </div>
  `,
})
export class NavidadPage {
  protected readonly store = inject(Store);
  protected readonly eur = formatoEuros;
  protected readonly num = formatoNumero;
  protected readonly nombre = NOMBRE_CATEGORIA;
  protected readonly categorias = CATEGORIAS;
  protected readonly abierto = signal(false);
  protected readonly editId = signal<string | undefined>(undefined);
  protected readonly categoria = signal<Categoria>('primero');
  protected readonly numero = signal('');
  protected readonly error = signal('');

  protected readonly lineas = computed(() =>
    [...this.store.decimosAnio()].sort((a, b) => a.numero.localeCompare(b.numero)).map((d) => {
      const c = comprobarDecimo(d.numero, this.store.premiosAnio());
      const k = (x: number) => escalarPremio(x, d.importeCent);
      return {
        id: d.id, numero: d.numero, lugar: d.lugar, pendiente: d.estado === 'pendiente', importe: d.importeCent,
        cent: k(c.cent), motivos: c.motivos.map((m) => ({ texto: m.texto, cent: k(m.cent) })),
      };
    }));
  protected readonly total = computed(() => this.lineas().reduce((a, l) => a + l.cent, 0));

  protected soloCifras(v: string) { return v.replace(/\D/g, '').slice(0, 5); }
  protected editar(id: string, c: Categoria, n: string) { this.abierto.set(true); this.editId.set(id); this.categoria.set(c); this.numero.set(n); this.error.set(''); }
  protected cerrar() { this.abierto.set(false); this.editId.set(undefined); this.numero.set(''); this.categoria.set('primero'); this.error.set(''); }

  protected async guardar() {
    const c = this.categoria(), id = this.editId();
    if (!/^\d{5}$/.test(this.numero())) { this.error.set('El número debe tener 5 cifras.'); return; }
    const hay = this.store.premiosAnio().filter((p) => p.categoria === c && p.id !== id).length;
    if (hay >= MAX_POR_CATEGORIA[c]) { this.error.set(`Ya has introducido todos los ${this.nombre[c]} (máximo ${MAX_POR_CATEGORIA[c]}).`); return; }
    await this.store.guardarPremio({ id, categoria: c, numero: this.numero() });
    this.cerrar();
  }
  protected async borrar() {
    const id = this.editId(); if (!id) return;
    await this.store.eliminarPremio(id); this.cerrar();
  }
}
