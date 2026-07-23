import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleService } from '../services/role.service';
import { Roles } from '../models/roles.enum';

export const roleGuard: CanActivateFn = (route) => {
  const roleSvc = inject(RoleService);
  const router = inject(Router);
  const required = (route.data?.['roles'] as Array<Roles | string> | undefined) ?? [];

  if (required.length === 0) return true;
  if (roleSvc.hasAnyRole(...required)) return true;

  router.navigateByUrl('/main/home');
  return false;
};
