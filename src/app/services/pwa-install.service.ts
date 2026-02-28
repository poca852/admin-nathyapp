import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: any = null;
  private isStandalone = false;

  constructor() {
    // Detect if the app is already installed (display mode standalone)
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    // Capture the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    // Track app installation
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isStandalone = true;
    });
  }

  /**
   * Whether the app can be installed (PWA install prompt available)
   */
  get canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isStandalone;
  }

  /**
   * Whether the app is running in standalone mode (already installed)
   */
  get installed(): boolean {
    return this.isStandalone;
  }

  /**
   * Show the install prompt to the user
   * @returns Promise that resolves after user choice
   */
  async showInstallPrompt(): Promise<void> {
    if (!this.deferredPrompt) {
      throw new Error('Install prompt not available');
    }
    this.deferredPrompt.prompt();
    const choiceResult = await this.deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      this.deferredPrompt = null;
    }
  }
}