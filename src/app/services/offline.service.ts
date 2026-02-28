import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private isOffline = new BehaviorSubject<boolean>(!navigator.onLine);
  isOffline$ = this.isOffline.asObservable();

  private offlineToast: HTMLIonToastElement | null = null;

  constructor(private toastController: ToastController) {
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }

  private updateOnlineStatus(): void {
    const offline = !navigator.onLine;
    this.isOffline.next(offline);
    if (offline) {
      this.showOfflineWarning();
    } else {
      this.dismissOfflineWarning();
    }
  }

  async showOfflineWarning(): Promise<void> {
    if (this.offlineToast) {
      return;
    }
    this.offlineToast = await this.toastController.create({
      message: 'You are currently offline. Some features may be unavailable.',
      color: 'warning',
      duration: 0, // persistent
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
          handler: () => {
            this.offlineToast = null;
          }
        }
      ]
    });
    await this.offlineToast.present();
  }

  private async dismissOfflineWarning(): Promise<void> {
    if (this.offlineToast) {
      await this.offlineToast.dismiss();
      this.offlineToast = null;
    }
  }
}