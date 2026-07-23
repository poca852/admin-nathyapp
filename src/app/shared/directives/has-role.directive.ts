import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { RoleService } from '../../services/role.service';
import { Roles } from '../../models/roles.enum';

/**
 * Directiva estructural: *appHasRole="'SUPERADMIN'" o *appHasRole="['ADMIN','SUPERADMIN']"
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly roleSvc = inject(RoleService);

  private roles: string[] = [];
  private hasView = false;

  constructor() {
    effect(() => {
      // Depend on rol signal
      this.roleSvc.rol();
      this.updateView();
    });
  }

  @Input()
  set appHasRole(value: Roles | string | Array<Roles | string>) {
    this.roles = Array.isArray(value) ? value.map(String) : [String(value)];
    this.updateView();
  }

  private updateView(): void {
    const allowed = this.roles.length === 0
      ? false
      : this.roleSvc.hasAnyRole(...this.roles);

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
