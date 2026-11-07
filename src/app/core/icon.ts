import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { icono } from './ui';

/** Icono SVG propio (marcado estático, sin datos de usuario). */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [innerHTML]="html()" style="display:contents"></span>`,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly fill = input(false);
  private readonly san = inject(DomSanitizer);
  readonly html = computed(() => this.san.bypassSecurityTrustHtml(icono(this.name(), this.fill())));
}
