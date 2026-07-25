import { Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class PwaInstallService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  private readonly _canInstall = signal(false);
  private readonly _installed = signal(false);

  readonly canInstall = this._canInstall.asReadonly();
  readonly installed = this._installed.asReadonly();

  constructor() {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    this._installed.set(standalone);

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this._canInstall.set(!this._installed());
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this._canInstall.set(false);
      this._installed.set(true);
    });
  }

  async showInstallPrompt(): Promise<void> {
    if (!this.deferredPrompt) {
      throw new Error('Install prompt not available');
    }
    await this.deferredPrompt.prompt();
    const choiceResult = await this.deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      this.deferredPrompt = null;
      this._canInstall.set(false);
    }
  }
}
