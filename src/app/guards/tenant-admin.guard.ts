import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleService } from '../services/role.service';

/**
 * Bloquea a SUPERADMIN en rutas de admin de empresa.
 * Redirige a /main/super-admin/empresas.
 */
export const tenantAdminGuard: CanActivateFn = () => {
  const roleSvc = inject(RoleService);
  const router = inject(Router);

  if (roleSvc.isSuperAdmin()) {
    router.navigateByUrl('/main/super-admin/empresas');
    return false;
  }
  return true;
};
