import { Injectable, signal } from '@angular/core';

/**
 * Estado de conectividad del dispositivo.
 * La UI (header) consume `isOffline`; no muestra toasts invasivos.
 */
@Injectable({
  providedIn: 'root',
})
export class OfflineService {
  private readonly _isOffline = signal(!navigator.onLine);
  readonly isOffline = this._isOffline.asReadonly();

  constructor() {
    window.addEventListener('online', () => this.setOffline(false));
    window.addEventListener('offline', () => this.setOffline(true));
  }

  private setOffline(offline: boolean): void {
    if (this._isOffline() === offline) {
      return;
    }
    this._isOffline.set(offline);
  }

  /**
   * Sincroniza estado cuando un HTTP falla con status 0 (red caída).
   * No marca offline por timeouts/504 del servidor.
   */
  reportNetworkFailure(): void {
    if (!navigator.onLine) {
      this.setOffline(true);
    }
  }
}
