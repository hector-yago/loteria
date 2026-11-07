import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CabeceraComponent } from '../core/cabecera';
import { formatoEuros } from '../core/reparto';
import { Store } from '../core/store';

@Component({
  selector: 'app-informe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CabeceraComponent],
  template: `
    <app-cabecera titulo="Informe" [anio]="false" />
    <div class="pad">
      <div class="stats">
        <div class="card stat"><b>{{ eur(jugado()) }}</b><span>jugado en total</span></div>
        <div class="card stat"><b style="color:var(--ok)">{{ eur(premio()) }}</b><span>premios</span></div>
        <div class="card stat"><b [style.color]="balance() >= 0 ? 'var(--ok)' : 'var(--accent)'">{{ eur(balance()) }}</b><span>balance</span></div>
        <div class="card stat"><b>{{ anios().length }}</b><span>sorteos con décimos</span></div>
      </div>
      <div class="card" style="overflow-x:auto">
        <table>
          <thead><tr><th>Año</th><th class="r">Jugado</th><th class="r">Premio</th><th class="r">Balance</th></tr></thead>
          <tbody>@for (a of anios(); track a.year) {
            <tr><td><b>{{ a.year }}</b></td><td class="r">{{ eur(a.jugado) }}</td><td class="r">{{ eur(a.premio) }}</td><td class="r" [style.color]="a.premio - a.jugado >= 0 ? 'var(--ok)' : 'var(--accent)'">{{ eur(a.premio - a.jugado) }}</td></tr>
          } @empty { <tr><td colspan="4" class="note">Sin datos todavía.</td></tr> }</tbody>
        </table>
      </div>
      @if (anios().length) {
        <div class="card"><div class="sect"><h3>Jugado y premio por año</h3></div>
          <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" width="100%" role="img" aria-label="Barras de euros jugados y premios por año">
            @for (t of ticks(); track t.v) { <line [attr.x1]="X0" [attr.x2]="W - 4" [attr.y1]="t.y" [attr.y2]="t.y" stroke="var(--line)" /><text [attr.x]="X0 - 6" [attr.y]="t.y + 4" text-anchor="end" font-size="10" fill="var(--muted)">{{ t.v }}</text> }
            @for (b of barras(); track b.year) {
              <rect [attr.x]="b.cx - 19" [attr.y]="b.y1" width="18" [attr.height]="b.h1" rx="3" fill="var(--muted)" />
              <rect [attr.x]="b.cx + 1" [attr.y]="b.y2" width="18" [attr.height]="b.h2" rx="3" fill="var(--ok)" />
              <text [attr.x]="b.cx" [attr.y]="H - 8" text-anchor="middle" font-size="11" fill="var(--ink)">{{ b.year }}</text>
            }
          </svg>
          <div class="row note" style="gap:16px"><span>■ Jugado (€)</span><span style="color:var(--ok)">■ Premio (€)</span></div></div>
      }
    </div>
  `,
})
export class InformePage {
  private readonly store = inject(Store);
  protected readonly eur = formatoEuros;
  protected readonly W = 330; protected readonly H = 170; protected readonly X0 = 34;

  protected readonly anios = computed(() => {
    const m = new Map<number, { year: number; jugado: number; premio: number }>();
    for (const d of this.store.decimos()) {
      const a = m.get(d.year) ?? { year: d.year, jugado: 0, premio: 0 };
      if (d.estado !== 'pendiente') a.jugado += d.importeCent;
      a.premio += d.premioCent;
      m.set(d.year, a);
    }
    return [...m.values()].sort((a, b) => a.year - b.year);
  });
  protected readonly jugado = computed(() => this.anios().reduce((a, x) => a + x.jugado, 0));
  protected readonly premio = computed(() => this.anios().reduce((a, x) => a + x.premio, 0));
  protected readonly balance = computed(() => this.premio() - this.jugado());

  private readonly maxEur = computed(() => {
    const m = Math.max(1, ...this.anios().flatMap((a) => [a.jugado, a.premio])) / 100;
    const paso = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m / paso) * paso;
  });
  private y(eurVal: number) { return this.H - 24 - ((this.H - 44) * eurVal) / this.maxEur(); }
  protected readonly ticks = computed(() => [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: Math.round(this.maxEur() * f), y: this.y(this.maxEur() * f) })));
  protected readonly barras = computed(() => {
    const paso = (this.W - this.X0 - 10) / this.anios().length;
    return this.anios().map((a, i) => {
      const y1 = this.y(a.jugado / 100), y2 = this.y(a.premio / 100), base = this.H - 24;
      return { year: a.year, cx: this.X0 + paso * i + paso / 2, y1, h1: base - y1, y2, h2: base - y2 };
    });
  });
}
