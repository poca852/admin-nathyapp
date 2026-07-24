import { of, throwError } from 'rxjs';

import { HomePage } from './home.page';
import { Ruta } from '../../../models';

describe('HomePage acciones caja', () => {
  let page: HomePage;
  let rutaSvc: {
    closeCaja: jasmine.Spy;
    newCaja: jasmine.Spy;
    lockRuta: jasmine.Spy;
    unlockRuta: jasmine.Spy;
    getRutasByEmpresa: jasmine.Spy;
  };
  let utilsSvc: {
    presentToast: jasmine.Spy;
    presentAlert: jasmine.Spy;
    getFromLocalStorage: jasmine.Spy;
    saveInLocalStorage: jasmine.Spy;
    presentModal: jasmine.Spy;
  };
  let empresaSvc: { applyEmpresa: jasmine.Spy; rutas: jasmine.Spy };
  let ws: {
    onCloseCaja: jasmine.Spy;
    onBlockCaja: jasmine.Spy;
    onUnblockCaja: jasmine.Spy;
  };
  let cdr: { markForCheck: jasmine.Spy };

  const rutaAbierta: Ruta = {
    id: 'ruta-1',
    _id: 'ruta-1',
    nombre: 'Ruta Demo',
    status: true,
    isLocked: false,
  } as Ruta;

  beforeEach(() => {
    rutaSvc = {
      closeCaja: jasmine.createSpy('closeCaja').and.returnValue(of(true)),
      newCaja: jasmine.createSpy('newCaja').and.returnValue(of(true)),
      lockRuta: jasmine
        .createSpy('lockRuta')
        .and.returnValue(of({ ok: true, ruta: 'ruta-1', isLocked: true })),
      unlockRuta: jasmine
        .createSpy('unlockRuta')
        .and.returnValue(of({ ok: true, ruta: 'ruta-1', isLocked: false })),
      getRutasByEmpresa: jasmine
        .createSpy('getRutasByEmpresa')
        .and.returnValue(of({ id: 'emp1', rutas: [] })),
    };
    utilsSvc = {
      presentToast: jasmine.createSpy('presentToast'),
      presentAlert: jasmine.createSpy('presentAlert'),
      getFromLocalStorage: jasmine.createSpy('getFromLocalStorage'),
      saveInLocalStorage: jasmine.createSpy('saveInLocalStorage'),
      presentModal: jasmine.createSpy('presentModal'),
    };
    empresaSvc = {
      applyEmpresa: jasmine.createSpy('applyEmpresa'),
      rutas: jasmine.createSpy('rutas').and.returnValue([]),
    };
    ws = {
      onCloseCaja: jasmine
        .createSpy('onCloseCaja')
        .and.returnValue(of()),
      onBlockCaja: jasmine.createSpy('onBlockCaja').and.returnValue(of()),
      onUnblockCaja: jasmine.createSpy('onUnblockCaja').and.returnValue(of()),
    };
    cdr = { markForCheck: jasmine.createSpy('markForCheck') };

    page = new HomePage(
      rutaSvc as any,
      utilsSvc as any,
      empresaSvc as any,
      ws as any,
      cdr as any,
    );
  });

  it('cerrar ruta usa HTTP closeCaja (no WS)', () => {
    page.toggleRutaStatus(rutaAbierta);
    expect(rutaSvc.closeCaja).toHaveBeenCalledWith('ruta-1');
  });

  it('bloquear ruta usa HTTP lockRuta (no WS)', () => {
    page.toggleRutaLock(rutaAbierta);
    expect(rutaSvc.lockRuta).toHaveBeenCalledWith('ruta-1');
  });

  it('desbloquear ruta usa HTTP unlockRuta', () => {
    page.toggleRutaLock({ ...rutaAbierta, isLocked: true } as Ruta);
    expect(rutaSvc.unlockRuta).toHaveBeenCalledWith('ruta-1');
  });

  it('muestra toast si lockRuta falla', () => {
    rutaSvc.lockRuta.and.returnValue(throwError(() => new Error('fail')));
    page.toggleRutaLock(rutaAbierta);
    expect(utilsSvc.presentToast).toHaveBeenCalled();
    expect(page.actionPendingId).toBeNull();
  });
});
