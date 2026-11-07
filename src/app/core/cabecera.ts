import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { IconComponent } from './icon';
import { Store } from './store';

@Component({
  selector: 'app-cabecera',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="top">
      @if (atras()) { <button class="icon-btn" type="button" (click)="volver()" aria-label="Volver"><app-icon name="back" /></button> }
      <h2>{{ titulo() }}</h2>
      <ng-content />
      @if (anio()) {
        <select class="year" aria-label="Sorteo" [value]="store.year()" (change)="cambiar($any($event.target).value)">
          @for (s of store.sorteos(); track s.year) { <option [value]="s.year">{{ s.year }}</option> }
        </select>
      }
    </div>
  `,
})
export class CabeceraComponent {
  readonly titulo = input.required<string>();
  readonly atras = input(false);
  readonly anio = input(true);
  protected readonly store = inject(Store);
  private readonly loc = inject(Location);
  protected volver() { this.loc.back(); }
  protected cambiar(v: string) { this.store.setYear(Number(v)); }
}
