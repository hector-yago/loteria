import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CabeceraComponent } from '../core/cabecera';
import { IconComponent } from '../core/icon';
import { ESTADOS, Estado, PRECIO_DECIMO_CENT } from '../core/models';
import { formatoEuros, formatoNumero } from '../core/reparto';
import { Store } from '../core/store';

@Component({
  selector: 'app-decimos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CabeceraComponent, IconComponent],
  template: `
    <app-cabecera titulo="Décimos" />
    <div class="pad">
      <div class="chips">
        <button type="button" class="chip" [class.on]="filtro() === 'todos'" (click)="filtro.set('todos')">Todos</button>
        @for (e of estados; track e[0]) {
          <button type="button" class="chip" [class.on]="filtro() === e[0]" (click)="filtro.set(e[0])">{{ e[1] }}</button>
        }
        <button type="button" class="chip" [class.on]="soloFav()" (click)="soloFav.set(!soloFav())">★ Favoritos</button>
      </div>
      <input class="input" type="search" placeholder="Buscar por número o lugar" aria-label="Buscar" (input)="texto.set($any($event.target).value)">
      @for (d of lista(); track d.id) {
        <div class="item">
          <a [routerLink]="['/decimos', d.id]" class="row" style="flex:1;min-width:0;gap:12px">
            <div class="num">{{ num(d.numero) }}</div>
            <div class="meta"><b>{{ d.lugar || 'Sin lugar' }}</b><span>{{ cantidad(d.importeCent) }}</span></div>
          </a>
          <div class="right">
            <button type="button" class="star" [class.on]="d.favorito" (click)="store.alternarFavorito(d.id)" [attr.aria-label]="d.favorito ? 'Quitar de favoritos' : 'Añadir a favoritos'"><app-icon name="star" [fill]="d.favorito" /></button>
            <span class="pill s-{{ d.estado }}">{{ nombres[d.estado] }}</span>
          </div>
        </div>
      } @empty {
        <p class="note">{{ store.decimosAnio().length ? 'Ningún décimo con este filtro.' : 'Aún no hay décimos en ' + store.year() + '. Pulsa + para añadir el primero.' }}</p>
      }
    </div>
    <a class="fab" routerLink="/decimos/nuevo" aria-label="Añadir décimo"><app-icon name="plus" /></a>
  `,
})
export class DecimosPage {
  protected readonly store = inject(Store);
  protected readonly nombres = ESTADOS;
  protected readonly estados = Object.entries(ESTADOS) as [Estado, string][];
  protected readonly num = formatoNumero;
  protected readonly filtro = signal<'todos' | Estado>('todos');
  protected readonly soloFav = signal(false);
  protected readonly texto = signal('');
  protected readonly lista = computed(() => {
    const t = this.texto().trim().toLowerCase();
    return this.store.decimosAnio()
      .filter((d) => (this.filtro() === 'todos' || d.estado === this.filtro()) && (!this.soloFav() || d.favorito)
        && (!t || d.numero.includes(t.replace('.', '')) || d.lugar.toLowerCase().includes(t)))
      .sort((a, b) => a.numero.localeCompare(b.numero));
  });
  protected cantidad(c: number) {
    const n = c / PRECIO_DECIMO_CENT;
    return formatoEuros(c) + (Number.isInteger(n) ? ` · ${n} ${n === 1 ? 'décimo' : 'décimos'}` : '');
  }
}
