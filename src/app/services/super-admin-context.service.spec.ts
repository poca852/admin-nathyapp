import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SuperAdminContextService } from './super-admin-context.service';
import { EmpresaService } from './empresa.service';
import { Empresa } from '../models';

describe('SuperAdminContextService', () => {
  let service: SuperAdminContextService;
  let empresaSvc: jasmine.SpyObj<EmpresaService>;

  const empA: Empresa = {
    id: 'a1',
    name: 'Empresa A',
    employes: [],
    rutas: [],
  } as Empresa;

  const empB: Empresa = {
    id: 'b2',
    name: 'Empresa B',
    employes: [{ id: 'u1' } as any],
    rutas: [{ id: 'r1' } as any],
  } as Empresa;

  beforeEach(() => {
    empresaSvc = jasmine.createSpyObj('EmpresaService', [
      'getAllEmpresas',
      'getEmpresa',
    ]);

    TestBed.configureTestingModule({
      providers: [
        SuperAdminContextService,
        { provide: EmpresaService, useValue: empresaSvc },
      ],
    });

    service = TestBed.inject(SuperAdminContextService);
  });

  it('loadEmpresas normaliza id y refresca selección', () => {
    service.selectEmpresa({ ...empA });
    empresaSvc.getAllEmpresas.and.returnValue(
      of([{ ...empA, name: 'Empresa A actualizada', _id: 'a1' } as any]),
    );

    let result: Empresa[] | undefined;
    service.loadEmpresas().subscribe((list) => (result = list));

    expect(result!.length).toBe(1);
    expect(service.empresas()[0].id).toBe('a1');
    expect(service.selectedEmpresa()?.name).toBe('Empresa A actualizada');
    expect(service.loading()).toBe(false);
  });

  it('selectEmpresa limpia la ruta seleccionada', () => {
    service.selectRuta({ id: 'r1' } as any);
    service.selectEmpresa(empB);

    expect(service.selectedEmpresa()?.id).toBe('b2');
    expect(service.selectedRuta()).toBeNull();
    expect(service.rutasDeEmpresa().length).toBe(1);
    expect(service.empleadosDeEmpresa().length).toBe(1);
  });

  it('loadAndSelectEmpresa actualiza cache y selección', () => {
    empresaSvc.getEmpresa.and.returnValue(of({ ...empB, _id: 'b2' } as any));

    service.loadAndSelectEmpresa('b2').subscribe();

    expect(service.selectedEmpresa()?.id).toBe('b2');
    expect(service.empresas().some((e) => e.id === 'b2')).toBeTrue();
    expect(service.loading()).toBe(false);
  });

  it('removeEmpresaLocal limpia selección e invalida', () => {
    service.upsertEmpresaLocal(empA);
    service.selectEmpresa(empA);
    const revBefore = service.revision();

    service.removeEmpresaLocal('a1');

    expect(service.empresas().length).toBe(0);
    expect(service.selectedEmpresa()).toBeNull();
    expect(service.revision()).toBe(revBefore + 1);
  });

  it('detailPayload se setea y limpia', () => {
    service.setDetailPayload({ foo: 1 });
    expect(service.detailPayload()).toEqual({ foo: 1 });
    service.clearDetailPayload();
    expect(service.detailPayload()).toBeNull();
  });
});
