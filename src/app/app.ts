import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from './core/icon';
import { Ui } from './core/ui';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <main class="contenido"><router-outlet /></main>
    @if (ui.mensaje(); as m) { <div class="toast" role="status">{{ m }}</div> }
    <nav class="nav" aria-label="Principal">
      @for (n of items; track n.ruta) {
        <a [routerLink]="n.ruta" routerLinkActive="on"><app-icon [name]="n.icono" />{{ n.texto }}</a>
      }
    </nav>
  `,
  styles: `
    :host{display:flex;flex-direction:column;height:100%}
    .contenido{flex:1;overflow-y:auto;padding-top:env(safe-area-inset-top)}
    .nav{display:flex;border-top:1px solid var(--line);background:var(--surface);padding:6px 4px calc(8px + env(safe-area-inset-bottom))}
    .nav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;font-weight:500;color:var(--muted);padding:4px 0}
    .nav a.on{color:var(--accent)}
  `,
})
export class App {
  protected readonly ui = inject(Ui);
  protected readonly items = [
    { ruta: '/inicio', texto: 'Inicio', icono: 'home' },
    { ruta: '/decimos', texto: 'Décimos', icono: 'ticket' },
    { ruta: '/personas', texto: 'Personas', icono: 'users' },
    { ruta: '/informe', texto: 'Informe', icono: 'chart' },
    { ruta: '/ajustes', texto: 'Ajustes', icono: 'gear' },
  ];
}
