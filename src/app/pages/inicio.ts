import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CabeceraComponent } from '../core/cabecera';
import { ESTADOS } from '../core/models';
import { formatoEuros, formatoNumero } from '../core/reparto';
import { Store } from '../core/store';

@Component({
  selector: 'app-inicio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CabeceraComponent],
  template: `
    <app-cabecera titulo="Mis décimos" />
    <div class="pad">
      <div class="hero">
        <small>Sorteo de Navidad · {{ fecha() }}</small>
        <div class="big">{{ eur(store.totalJugadoCent()) }}</div>
        <div>jugado en {{ store.year() }}</div>
        <div class="row3">
          <div><b>{{ store.decimosAnio().length }}</b>décimos</div>
          <div><b>{{ eur(store.totalPremioCent()) }}</b>premios</div>
          <div><b>{{ eur(store.porComprarCent()) }}</b>por comprar</div>
        </div>
      </div>
      <div class="sect"><h3>Favoritos</h3><span>{{ favoritos().length }}</span></div>
      @for (d of favoritos(); track d.id) {
        <a class="item" [routerLink]="['/decimos', d.id]"><div class="num">{{ num(d.numero) }}</div><div class="meta"><b>{{ d.lugar }}</b><span>{{ eur(d.importeCent) }}</span></div><span class="pill s-{{ d.estado }}">{{ estados[d.estado] }}</span></a>
      } @empty { <p class="note">Marca la estrella de un décimo para verlo aquí.</p> }
      @if (pendientes().length) {
        <div class="sect"><h3>Por comprar</h3><span>{{ pendientes().length }}</span></div>
        @for (d of pendientes(); track d.id) {
          <a class="item" [routerLink]="['/decimos', d.id]"><div class="num">{{ num(d.numero) }}</div><div class="meta"><b>{{ d.lugar }}</b><span>{{ eur(d.importeCent) }}</span></div></a>
        }
      }
    </div>
  `,
})
export class InicioPage {
  protected readonly store = inject(Store);
  protected readonly estados = ESTADOS;
  protected readonly eur = formatoEuros;
  protected readonly num = formatoNumero;
  protected readonly favoritos = computed(() => this.store.decimosAnio().filter((d) => d.favorito));
  // Los favoritos pendientes ya salen en «Favoritos»: no se repiten en «Por comprar».
  protected readonly pendientes = computed(() => this.store.decimosAnio().filter((d) => d.estado === 'pendiente' && !d.favorito));
  protected readonly fecha = computed(() => {
    const s = this.store.sorteos().find((x) => x.year === this.store.year());
    return s ? new Date(s.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  });

}
