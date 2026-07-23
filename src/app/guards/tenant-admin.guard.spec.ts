import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { tenantAdminGuard } from './tenant-admin.guard';
import { RoleService } from '../services/role.service';

describe('tenantAdminGuard', () => {
  let router: jasmine.SpyObj<Router>;

  function setup(isSuperAdmin: boolean) {
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RoleService,
          useValue: { isSuperAdmin: () => isSuperAdmin },
        },
        { provide: Router, useValue: router },
      ],
    });
  }

  function runGuard() {
    return TestBed.runInInjectionContext(() =>
      tenantAdminGuard({} as any, {} as any),
    );
  }

  it('bloquea SUPERADMIN y redirige a super-admin', () => {
    setup(true);
    expect(runGuard()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/main/super-admin/empresas');
  });

  it('permite roles de tenant (admin de empresa)', () => {
    setup(false);
    expect(runGuard()).toBeTrue();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
