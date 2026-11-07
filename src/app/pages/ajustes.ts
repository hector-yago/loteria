import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CabeceraComponent } from '../core/cabecera';
import { IconComponent } from '../core/icon';
import { Store } from '../core/store';
import { Ui } from '../core/ui';

@Component({
  selector: 'app-ajustes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CabeceraComponent, IconComponent],
  template: `
    <app-cabecera titulo="Ajustes" [anio]="false" />
    <div class="pad">
      <div class="card"><div class="lbl" style="margin-bottom:8px">Tema</div>
        <div class="seg"><button type="button" [class.on]="store.tema() === 'sistema'" (click)="store.setTema('sistema')">Sistema</button><button type="button" [class.on]="store.tema() === 'claro'" (click)="store.setTema('claro')">Claro</button><button type="button" [class.on]="store.tema() === 'oscuro'" (click)="store.setTema('oscuro')">Oscuro</button></div></div>

      <div class="card"><div class="lbl" style="margin-bottom:6px">Sorteos</div>
        @for (s of store.sorteos(); track s.year) { <div class="who"><div class="grow"><b>{{ s.year }}</b><span>{{ s.fecha }}</span></div>@if (s.year === store.year()) { <span class="pill s-comprado">En uso</span> } @else { <button class="btn ghost sm" type="button" (click)="store.setYear(s.year)">Usar</button> }</div> }
        <button class="btn ghost sm" type="button" style="margin-top:8px" (click)="nuevoAnio()"><app-icon name="plus" />Añadir año {{ siguiente() }}</button></div>

      <div class="card"><div class="lbl" style="margin-bottom:8px">Copia de seguridad</div>
        <p class="note" style="margin:0 0 10px">Tus datos viven solo en este móvil. Exporta un archivo para recuperarlos si cambias de teléfono. Importar sustituye los datos actuales.</p>
        <div class="row">
          <button class="btn sm" type="button" style="flex:1" (click)="exportar()"><app-icon name="up" />Exportar</button>
          <label class="btn ghost sm" style="flex:1;cursor:pointer"><app-icon name="down" />Importar<input type="file" accept="application/json,.json" hidden (change)="elegir($any($event.target))"></label></div>
        @if (pendiente()) { <div class="hint" style="margin-top:10px">Se sustituirán todos los datos de este móvil por los del archivo. <div class="row" style="margin-top:8px"><button class="btn ghost sm" type="button" style="flex:1" (click)="pendiente.set(null)">Cancelar</button><button class="btn sm" type="button" style="flex:1" (click)="confirmar()">Importar</button></div></div> }
        @if (error()) { <div class="err" role="alert" style="margin-top:10px">{{ error() }}</div> }</div>

      <div class="card"><div class="lbl" style="margin-bottom:6px">Privacidad</div>
        <p class="note" style="margin:0">Nada se guarda en Internet. Solo «Comprobar décimos» consulta resultados y envía únicamente el número.</p></div>
    </div>
  `,
})
export class AjustesPage {
  protected readonly store = inject(Store);
  private readonly ui = inject(Ui);
  protected readonly pendiente = signal<string | null>(null);
  protected readonly error = signal('');
  protected siguiente() { return Math.max(...this.store.sorteos().map((s) => s.year), new Date().getFullYear()) + 1; }

  protected async nuevoAnio() { const y = this.siguiente(); await this.store.crearSorteo(y); this.store.setYear(y); this.ui.aviso(`Sorteo ${y} creado`); }

  protected async exportar() {
    const b = await this.store.exportar();
    const blob = new Blob([JSON.stringify(b)], { type: 'application/json' });
    const f = new File([blob], `mis-decimos-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' });
    if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f] }); return; } catch (e) { if ((e as DOMException).name === 'AbortError') return; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = f.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    this.ui.aviso('Copia descargada');
  }

  protected async elegir(input: HTMLInputElement) {
    const f = input.files?.[0]; input.value = ''; this.error.set('');
    if (!f) return;
    this.pendiente.set(await f.text());
  }
  protected async confirmar() {
    const t = this.pendiente(); this.pendiente.set(null);
    if (!t) return;
    try { await this.store.importar(t); this.ui.aviso('Copia importada'); }
    catch (e) { this.error.set((e as Error).message); }
  }
}
