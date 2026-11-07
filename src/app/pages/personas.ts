import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CabeceraComponent } from '../core/cabecera';
import { IconComponent } from '../core/icon';
import { Store } from '../core/store';
import { Ui } from '../core/ui';

@Component({
  selector: 'app-personas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CabeceraComponent, RouterLink, IconComponent],
  template: `
    <app-cabecera titulo="Personas" [anio]="false" />
    <div class="pad">
      <div class="seg"><button type="button" [class.on]="tab() === 'personas'" (click)="cerrar('personas')">Personas</button><button type="button" [class.on]="tab() === 'grupos'" (click)="cerrar('grupos')">Grupos</button></div>

      @if (tab() === 'personas') {
        @for (p of store.personas(); track p.id) {
          <div class="item"><span class="av" [style.background]="p.color">{{ p.nombre[0] }}</span>
            <div class="meta"><b>{{ p.nombre }}@if (p.soyYo) { <span class="pill s-comprado" style="margin-left:6px">Yo</span> }</b><span>{{ gruposDe(p.id) }}</span></div>
            <button class="btn ghost sm" type="button" (click)="editarPersona(p.id, p.nombre, p.soyYo ?? false)">Editar</button></div>
        } @empty { <p class="note">Aún no hay personas. Añade a quienes juegas contigo.</p> }
        @if (edit() === 'p') {
          <div class="card"><div class="field"><label for="n">Nombre</label><input class="input" id="n" [value]="nombre()" (input)="nombre.set($any($event.target).value)" maxlength="40"></div>
            <div class="who" role="button" tabindex="0" (click)="soyYo.set(!soyYo())" (keydown.enter)="soyYo.set(!soyYo())" (keydown.space)="soyYo.set(!soyYo()); $event.preventDefault()">
              <div class="grow"><b>Esta persona soy yo</b><span>El informe cuenta solo lo que juegan las personas marcadas como «yo».</span></div><span class="tick" [class.on]="soyYo()"><app-icon name="check" /></span></div>
            @if (error()) { <div class="err" role="alert" style="margin-top:8px">{{ error() }}</div> }
            <div class="row" style="margin-top:10px">
              @if (editId()) { <button class="btn ghost sm" type="button" (click)="borrar()">Eliminar</button> }
              <button class="btn ghost sm" type="button" style="flex:1" (click)="cerrar(tab())">Cancelar</button><button class="btn sm" type="button" style="flex:1" (click)="guardarPersona()">Guardar</button></div></div>
        } @else { <button class="btn ghost" type="button" (click)="nueva('p')"><app-icon name="plus" />Nueva persona</button> }
      } @else {
        @for (g of store.grupos(); track g.id) {
          <div class="card"><div class="row"><div class="grow"><b>{{ g.nombre }}</b><span>{{ g.personaIds.length }} personas</span></div><button class="btn ghost sm" type="button" (click)="editarGrupo(g.id)">Editar</button></div>
            <div class="chips" style="margin-top:10px">@for (m of miembros(g.personaIds); track m.id) { <span class="chip on" [style.background]="m.color" [style.border-color]="m.color" style="color:#fff">{{ m.nombre }}</span> }</div></div>
        } @empty { <p class="note">Aún no hay grupos. Crea uno y elige sus personas.</p> }
        @if (edit() === 'g') {
          <div class="card"><div class="field"><label for="gn">Nombre del grupo</label><input class="input" id="gn" [value]="nombre()" (input)="nombre.set($any($event.target).value)" maxlength="40"></div>
            <div class="lbl" style="margin:12px 0 4px">Personas</div>
            @for (p of store.personas(); track p.id) {
              <div class="who" role="button" tabindex="0" (click)="alternar(p.id)" (keydown.enter)="alternar(p.id)" (keydown.space)="alternar(p.id); $event.preventDefault()">
                <span class="av" [style.background]="p.color">{{ p.nombre[0] }}</span><div class="grow"><b>{{ p.nombre }}</b></div><span class="tick" [class.on]="sel().includes(p.id)"><app-icon name="check" /></span></div>
            } @empty { <p class="note">Primero crea personas.</p> }
            @if (error()) { <div class="err" role="alert" style="margin-top:8px">{{ error() }}</div> }
            <div class="row" style="margin-top:10px">
              @if (editId()) { <button class="btn ghost sm" type="button" (click)="borrar()">Eliminar</button> }
              <button class="btn ghost sm" type="button" style="flex:1" (click)="cerrar(tab())">Cancelar</button><button class="btn sm" type="button" style="flex:1" (click)="guardarGrupo()">Guardar</button></div></div>
        } @else { <button class="btn ghost" type="button" (click)="nueva('g')"><app-icon name="plus" />Nuevo grupo</button> }
      }
      <a class="btn" routerLink="/resumen">Ver resumen de lo que juega cada uno</a>
    </div>
  `,
})
export class PersonasPage {
  protected readonly store = inject(Store);
  private readonly ui = inject(Ui);
  protected readonly tab = signal<'personas' | 'grupos'>('personas');
  protected readonly edit = signal<'p' | 'g' | null>(null);
  protected readonly editId = signal<string | undefined>(undefined);
  protected readonly nombre = signal('');
  protected readonly soyYo = signal(false);
  protected readonly sel = signal<string[]>([]);
  protected readonly error = signal('');
  protected readonly miembros = (ids: string[]) => this.store.personas().filter((p) => ids.includes(p.id));
  protected readonly gruposDe = (id: string) => this.store.grupos().filter((g) => g.personaIds.includes(id)).map((g) => g.nombre).join(' · ');
  protected readonly vacio = computed(() => !this.nombre().trim());

  protected cerrar(t: 'personas' | 'grupos') { this.tab.set(t); this.edit.set(null); this.editId.set(undefined); this.nombre.set(''); this.soyYo.set(false); this.sel.set([]); this.error.set(''); }
  protected nueva(k: 'p' | 'g') { this.cerrar(this.tab()); this.edit.set(k); }
  protected editarPersona(id: string, n: string, yo: boolean) { this.edit.set('p'); this.editId.set(id); this.nombre.set(n); this.soyYo.set(yo); this.error.set(''); }
  protected editarGrupo(id: string) {
    const g = this.store.grupos().find((x) => x.id === id)!;
    this.edit.set('g'); this.editId.set(id); this.nombre.set(g.nombre); this.sel.set([...g.personaIds]); this.error.set('');
  }
  protected alternar(id: string) { this.sel.update((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])); }

  protected async guardarPersona() {
    if (this.vacio()) { this.error.set('Escribe un nombre.'); return; }
    await this.store.guardarPersona(this.nombre(), this.soyYo(), this.editId());
    this.cerrar('personas');
  }
  protected async guardarGrupo() {
    if (this.vacio()) { this.error.set('Escribe un nombre para el grupo.'); return; }
    if (!this.sel().length) { this.error.set('Elige al menos una persona.'); return; }
    await this.store.guardarGrupo(this.nombre(), this.sel(), this.editId());
    this.cerrar('grupos');
  }
  protected async borrar() {
    const id = this.editId(); if (!id) return;
    if (this.edit() === 'p') await this.store.eliminarPersona(id); else await this.store.eliminarGrupo(id);
    this.ui.aviso('Eliminado. Se ha quitado también de los repartos.');
    this.cerrar(this.tab());
  }
}
