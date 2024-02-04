import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheetController, ActionSheetOptions, AlertController, AlertOptions, LoadingController, LoadingOptions, ModalController, ModalOptions, ToastController, ToastOptions } from '@ionic/angular';
import { Share, ShareOptions } from '@capacitor/share';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  loadingCtrl = inject(LoadingController);
  toastCtrl = inject(ToastController);
  modalCtrl = inject(ModalController);
  alertCtrl = inject(AlertController);
  actionSheetCtrl = inject(ActionSheetController);
  router = inject(Router);

  async presentAlert(opts?: AlertOptions) {
    const alert = await this.alertCtrl.create({
      ...opts,
      mode: 'ios'
    });
    await alert.present();
  }

  async takePicture(promptLabelHeader: string) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader,
        promptLabelPhoto: 'Selecciona una imagen',
        promptLabelPicture: 'Toma una foto'
      });
      return image
    } catch (error) {
      return null;
    }
  };


  // async getCurrentPosition(): Promise<[number, number]> {
  //   const { latitude, longitude } = (await Geolocation.getCurrentPosition()).coords;
  //   return [latitude, longitude];
  // }


  // loading
  loading(opts?: LoadingOptions) {
    return this.loadingCtrl.create({
      spinner: 'crescent',
      mode: 'ios',
      ...opts,
    })
  }

  // toas
  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtrl.create({
      ...opts,
      mode: 'ios',
    });
    await toast.present();
  }

  // enrutar a cualquier pagina disponible
  routerLink(url: string) {
    return this.router.navigateByUrl(url);
  }

  // guarda un elemento en localStorage
  saveInLocalStorage(key: string, value: any) {

    return localStorage.setItem(key, JSON.stringify(value));
  }

  // optiene un elemento desde el localstorage
  getFromLocalStorage(key: string) {

    return JSON.parse(localStorage.getItem(key));

  }

  // modal
  async presentModal(opts: ModalOptions) {
    const modal = await this.modalCtrl.create(opts);

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) return data;

  }

  async presentActionSheet(opts?: ActionSheetOptions) {
    const actionSheet = await this.actionSheetCtrl.create({
      ...opts,
      mode: 'ios',
    });
    await actionSheet.present();
  }

  dismissModal(data?: any) {
    return this.modalCtrl.dismiss(data);
  }

  async share(opts: ShareOptions) {
    return await Share.share(opts)
  }


}
