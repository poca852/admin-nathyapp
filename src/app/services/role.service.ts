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

  readonly isSupervisor = computed(() => this.rol() === Roles.supervisor);

  readonly isAdminOrSuperAdmin = computed(() => {
    const r = this.rol();
    return r === Roles.admin || r === Roles.superAdmin;
  });

  /** IDs de rutas asignadas al SUPERVISOR (vacío para otros roles). */
  readonly assignedRutaIds = computed(() => {
    const user = this.currentUser();
    if (!user || user.rol !== Roles.supervisor) return [] as string[];
    if (!Array.isArray(user.rutas)) return [] as string[];
    return user.rutas
      .map((r) => {
        if (typeof r === 'string') return r;
        if (r && typeof r === 'object') {
          const obj = r as { id?: string; _id?: string };
          return obj.id || obj._id || '';
        }
        return '';
      })
      .filter((id): id is string => !!id);
  });

  hasAnyRole(...roles: Array<Roles | string>): boolean {
    const current = this.rol();
    if (!current) return false;
    return roles.map(String).includes(current);
  }
}
