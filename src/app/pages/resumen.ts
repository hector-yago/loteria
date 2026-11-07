import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CabeceraComponent } from '../core/cabecera';
import { TablaMatriz, compartirMatriz } from '../core/compartir';
import { IconComponent } from '../core/icon';
import { Decimo, ESTADOS, Grupo } from '../core/models';
import { formatoEuros, formatoNumero, partePersona, partePersonaEnGrupo, resumenPorGrupo, resumenPorPersona } from '../core/reparto';
import { Store } from '../core/store';
import { Ui } from '../core/ui';

interface LineaDecimo { id: string; numero: string; lugar: string; estado: Decimo['estado']; cent: number }

@Component({
  selector: 'app-resumen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CabeceraComponent, IconComponent, RouterLink],
  template: `
    <app-cabecera titulo="Resumen" [atras]="true">
      @if (tab() === 'personas') { <button class="icon-btn" type="button" (click)="compartirPersonas()" aria-label="Compartir tabla de personas"><app-icon name="share" /></button> }
    </app-cabecera>
    <div class="pad">
      <div class="seg"><button type="button" [class.on]="tab() === 'personas'" (click)="tab.set('personas')">Por persona</button><button type="button" [class.on]="tab() === 'grupos'" (click)="tab.set('grupos')">Por grupo</button></div>

      @if (tab() === 'personas') {
        @for (p of personas(); track p.id) {
          <div class="card">
            <div class="row"><span class="av" [style.background]="p.color">{{ p.nombre[0] }}</span>
              <div class="grow"><b>{{ p.nombre }}</b><span>{{ p.compradas }} {{ p.compradas === 1 ? 'décimo' : 'décimos' }} comprados</span></div>
              <span class="amt">{{ eur(p.total) }}</span></div>
            @for (l of p.lineas; track l.id) {
              <a class="who" [routerLink]="['/decimos', l.id]">
                <div class="num" style="font-size:16px;padding:4px 8px">{{ num(l.numero) }}</div>
                <div class="grow"><b>{{ l.lugar || 'Sin lugar' }}</b>@if (l.estado === 'pendiente') { <span class="pill s-pendiente">Pendiente de compra</span> }</div>
                <span class="amt">{{ eur(l.cent) }}</span></a>
            } @empty { <p class="note" style="margin:8px 0 0">No tiene ningún décimo asignado en {{ store.year() }}.</p> }
          </div>
        } @empty { <p class="note">Crea personas en la pestaña Personas.</p> }
        <div class="row" style="justify-content:space-between"><b>Total</b><span class="amt">{{ eur(totalPersonas()) }}</span></div>
        <p class="note">Lo asignado a un grupo se divide a partes iguales entre sus miembros. El total solo suma los décimos ya comprados.</p>
      } @else {
        @for (g of gruposVista(); track g.id) {
          <div class="card">
            <div class="row"><div class="grow"><b>{{ g.nombre }}</b><span>{{ g.columnas.length }} {{ g.columnas.length === 1 ? 'décimo' : 'décimos' }}</span></div>
              <button class="icon-btn" type="button" (click)="compartirGrupo(g.id)" [attr.aria-label]="'Compartir ' + g.nombre"><app-icon name="share" /></button></div>
            @if (g.columnas.length) {
              <div style="overflow-x:auto;margin-top:8px"><table>
                <thead><tr><th></th>@for (c of g.columnas; track c.id) { <th class="r">{{ num(c.numero) }}@if (c.estado === 'pendiente') { <br><span class="pill s-pendiente">Pend.</span> }</th> }<th class="r">Total</th></tr></thead>
                <tbody>@for (f of g.filas; track f.nombre) { <tr><td><b>{{ f.nombre }}</b></td>@for (v of f.celdas; track $index) { <td class="r">{{ v ? eur(v) : '—' }}</td> }<td class="r"><b>{{ eur(f.total) }}</b></td></tr> }</tbody>
                <tfoot><tr><td>Total</td>@for (v of g.totales; track $index) { <td class="r">{{ eur(v) }}</td> }<td class="r">{{ eur(g.totalGeneral) }}</td></tr></tfoot>
              </table></div>
            } @else { <p class="note" style="margin:8px 0 0">Este grupo no tiene décimos asignados en {{ store.year() }}.</p> }
          </div>
        } @empty { <p class="note">Crea grupos en la pestaña Personas.</p> }
      }
    </div>
  `,
})
export class ResumenPage {
  protected readonly store = inject(Store);
  private readonly ui = inject(Ui);
  protected readonly eur = formatoEuros;
  protected readonly num = formatoNumero;
  protected readonly estados = ESTADOS;
  protected readonly tab = signal<'personas' | 'grupos'>('personas');

  private readonly ordenados = computed(() => [...this.store.decimosAnio()].sort((a, b) => a.numero.localeCompare(b.numero)));

  protected readonly personas = computed(() => {
    const totales = resumenPorPersona(this.store.decimosAnio(), this.store.personas(), this.store.grupos());
    return this.store.personas().map((p) => {
      const lineas: LineaDecimo[] = this.ordenados()
        .map((d) => ({ id: d.id, numero: d.numero, lugar: d.lugar, estado: d.estado, cent: partePersona(d, p.id, this.store.grupos()) }))
        .filter((l) => l.cent > 0);
      return { ...p, total: totales.get(p.id) ?? 0, lineas, compradas: lineas.filter((l) => l.estado !== 'pendiente').length };
    });
  });
  protected readonly totalPersonas = computed(() => this.personas().reduce((a, p) => a + p.total, 0));

  private matriz(g: Grupo, incluirPendientes: boolean) {
    const columnas = this.ordenados().filter((d) => d.reparto.some((r) => r.destino === 'g:' + g.id) && (incluirPendientes || d.estado !== 'pendiente'));
    const miembros = this.store.personas().filter((p) => g.personaIds.includes(p.id));
    const filas = miembros.map((p) => {
      const celdas = columnas.map((d) => partePersonaEnGrupo(d, p.id, g));
      return { nombre: p.nombre, celdas, total: columnas.reduce((a, d, i) => a + (d.estado === 'pendiente' ? 0 : celdas[i]), 0) };
    });
    const totales = columnas.map((_, i) => filas.reduce((a, f) => a + f.celdas[i], 0));
    return { id: g.id, nombre: g.nombre, columnas, filas, totales, totalGeneral: filas.reduce((a, f) => a + f.total, 0) };
  }
  protected readonly gruposVista = computed(() => this.store.grupos().map((g) => this.matriz(g, true)));

  protected async compartirGrupo(id: string) {
    const g = this.store.grupos().find((x) => x.id === id);
    if (!g) return;
    const m = this.matriz(g, false);
    if (!m.columnas.length) { this.ui.aviso('Este grupo aún no tiene décimos comprados que compartir.'); return; }
    await this.enviar({
      titulo: `Lotería de Navidad ${this.store.year()}`,
      columnas: m.columnas.map((d) => d.numero),
      filas: m.filas.map((f) => ({ nombre: f.nombre, celdas: f.celdas.map((v) => (v ? formatoEuros(v) : '')), total: formatoEuros(f.total) })),
    });
  }

  protected async compartirPersonas() {
    const cols = this.ordenados().filter((d) => d.estado !== 'pendiente' && d.reparto.length);
    if (!cols.length) { this.ui.aviso('Aún no hay décimos comprados y repartidos que compartir.'); return; }
    const filas = this.store.personas().map((p) => {
      const v = cols.map((d) => partePersona(d, p.id, this.store.grupos()));
      return { nombre: p.nombre, celdas: v.map((x) => (x ? formatoEuros(x) : '')), total: formatoEuros(v.reduce((a, x) => a + x, 0)) };
    });
    await this.enviar({
      titulo: `Lotería de Navidad ${this.store.year()}`, columnas: cols.map((d) => d.numero), filas,
    });
  }

  private async enviar(m: TablaMatriz) {
    const ok = await compartirMatriz(m);
    if (!ok) this.ui.aviso('Tu navegador no permite compartir; se ha descargado la imagen.');
  }
}
