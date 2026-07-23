import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { roleGuard } from './role.guard';
import { RoleService } from '../services/role.service';
import { Roles } from '../models/roles.enum';

describe('roleGuard', () => {
  let roleSvc: jasmine.SpyObj<RoleService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    roleSvc = jasmine.createSpyObj('RoleService', ['hasAnyRole']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: RoleService, useValue: roleSvc },
        { provide: Router, useValue: router },
      ],
    });
  });

  function runGuard(roles?: Array<Roles | string>) {
    return TestBed.runInInjectionContext(() =>
      roleGuard({ data: roles ? { roles } : {} } as any, {} as any),
    );
  }

  it('permite si no hay roles requeridos', () => {
    expect(runGuard()).toBeTrue();
    expect(roleSvc.hasAnyRole).not.toHaveBeenCalled();
  });

  it('permite si el usuario tiene el rol', () => {
    roleSvc.hasAnyRole.and.returnValue(true);
    expect(runGuard([Roles.superAdmin])).toBeTrue();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('redirige a home si no tiene el rol', () => {
    roleSvc.hasAnyRole.and.returnValue(false);
    expect(runGuard([Roles.superAdmin])).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/main/home');
  });
});
