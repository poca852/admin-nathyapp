import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { UtilsService } from './utils.service';
import { User } from '../models';
import { Roles } from '../models/roles.enum';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly authSvc = inject(AuthService);
  private readonly utilsSvc = inject(UtilsService);

  readonly currentUser = computed(() => {
    return this.authSvc.currentUser() ?? (this.utilsSvc.getFromLocalStorage('user') as User | null);
  });

  readonly rol = computed(() => this.currentUser()?.rol ?? null);

  readonly isSuperAdmin = computed(() => this.rol() === Roles.superAdmin);

  readonly isAdminOrSuperAdmin = computed(() => {
    const r = this.rol();
    return r === Roles.admin || r === Roles.superAdmin;
  });

  hasAnyRole(...roles: Array<Roles | string>): boolean {
    const current = this.rol();
    if (!current) return false;
    return roles.map(String).includes(current);
  }
}
