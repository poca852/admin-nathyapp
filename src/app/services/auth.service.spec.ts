import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { UtilsService } from './utils.service';
import { NotificacionesService } from './notificaciones.service';
import { WsService } from './ws.service';
import { EmpresaService } from './empresa.service';
import { environment } from 'src/environments/environment';
import { User } from '../models';

describe('AuthService.updateMe', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let utilsSvc: jasmine.SpyObj<UtilsService>;

  const currentUser: User = {
    id: 'u1',
    _id: 'u1',
    nombre: 'Old Name',
    username: 'olduser',
    rol: 'ADMIN',
    estado: true,
    empresa: 'emp1',
    token: 'tok-123',
  };

  beforeEach(() => {
    utilsSvc = jasmine.createSpyObj('UtilsService', [
      'getFromLocalStorage',
      'saveInLocalStorage',
    ]);
    utilsSvc.getFromLocalStorage.and.returnValue({ ...currentUser });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: UtilsService, useValue: utilsSvc },
        {
          provide: NotificacionesService,
          useValue: { notificarLogout: jasmine.createSpy() },
        },
        { provide: WsService, useValue: { connect: jasmine.createSpy(), disconnect: jasmine.createSpy() } },
        { provide: EmpresaService, useValue: { setEmpresa: jasmine.createSpy() } },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('PATCH /auth/me y sincroniza localStorage preservando token', () => {
    let result: User | undefined;

    service
      .updateMe({ nombre: 'Nuevo Nombre', username: 'nuevouser' })
      .subscribe((user) => {
        result = user;
      });

    const req = httpMock.expectOne(`${environment.baseUrl}/auth/me`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      nombre: 'Nuevo Nombre',
      username: 'nuevouser',
    });

    req.flush({
      id: 'u1',
      nombre: 'Nuevo Nombre',
      username: 'nuevouser',
      rol: 'ADMIN',
      estado: true,
      empresa: 'emp1',
    });

    expect(result?.nombre).toBe('Nuevo Nombre');
    expect(result?.username).toBe('nuevouser');
    expect(result?.token).toBe('tok-123');
    expect(utilsSvc.saveInLocalStorage).toHaveBeenCalledWith(
      'user',
      jasmine.objectContaining({
        nombre: 'Nuevo Nombre',
        username: 'nuevouser',
        token: 'tok-123',
      }),
    );
  });

  it('normaliza id/_id desde la respuesta', () => {
    let result: User | undefined;

    service.updateMe({ nombre: 'Xyz Nombre' }).subscribe((user) => {
      result = user;
    });

    const req = httpMock.expectOne(`${environment.baseUrl}/auth/me`);
    req.flush({
      _id: 'u1',
      nombre: 'Xyz Nombre',
      username: 'olduser',
      rol: 'ADMIN',
      estado: true,
      empresa: 'emp1',
    });

    expect(result?.id).toBe('u1');
    expect(result?._id).toBe('u1');
  });
});
