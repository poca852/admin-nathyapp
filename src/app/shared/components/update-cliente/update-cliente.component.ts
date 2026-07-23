import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ClienteService } from '../../../services/cliente.service';
import { UtilsService } from '../../../services/utils.service';
import { Cliente } from 'src/app/models';
import { FirebaseService } from '../../../services/firebase.service';

@Component({
  selector: 'app-update-cliente',
  templateUrl: './update-cliente.component.html',
  styleUrls: ['./update-cliente.component.scss'],
})
export class UpdateClienteComponent implements OnInit {
  @Input()
  cliente: Cliente;

  form = new FormGroup({
    dpi: new FormControl('', [Validators.required]),
    nombre: new FormControl('', [Validators.required]),
    alias: new FormControl(''),
    ciudad: new FormControl(''),
    direccion: new FormControl('', [Validators.required]),
    telefono: new FormControl('', [Validators.required]),
    document_image: new FormControl(''),
    business_image: new FormControl(''),
    house_image: new FormControl(''),
  });

  imagesCliente: {
    document_image: string | null;
    business_image: string | null;
    house_image: string | null;
  } = {
    document_image: null,
    business_image: null,
    house_image: null,
  };

  submitting = false;

  constructor(
    private clienteSvc: ClienteService,
    private utilsSvc: UtilsService,
    private firebaseSvc: FirebaseService,
  ) {}

  ngOnInit() {
    if (this.cliente) {
      this.form.patchValue({
        dpi: this.cliente.dpi,
        nombre: this.cliente.nombre,
        alias: this.cliente.alias,
        ciudad: this.cliente.ciudad,
        direccion: this.cliente.direccion,
        telefono: this.cliente.telefono,
        document_image: this.cliente.document_image || '',
        business_image: this.cliente.business_image || '',
        house_image: this.cliente.house_image || '',
      });
      this.imagesCliente.document_image = this.cliente.document_image || null;
      this.imagesCliente.business_image = this.cliente.business_image || null;
      this.imagesCliente.house_image = this.cliente.house_image || null;
    }
  }

  private clienteId(): string {
    return this.cliente?.id || this.cliente?._id || '';
  }

  async updateCliente(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.clienteId();
    if (!id) {
      await this.utilsSvc.presentToast({
        message: 'No se encontró el identificador del cliente',
        duration: 3000,
        color: 'danger',
      });
      return;
    }

    this.submitting = true;
    const loading = await this.utilsSvc.loading({ message: 'Guardando...' });
    await loading.present();

    this.clienteSvc.updateCliente(id, this.form.value).subscribe({
      next: () => {
        loading.dismiss();
        this.submitting = false;
        this.utilsSvc.presentToast({
          message: 'Cliente actualizado',
          duration: 2500,
          color: 'success',
          icon: 'checkmark-outline',
        });
        this.utilsSvc.dismissModal({ success: true });
      },
      error: async (err) => {
        loading.dismiss();
        this.submitting = false;
        await this.utilsSvc.presentAlert({
          header: 'Alerta',
          message: err.error?.message || 'No se pudo actualizar el cliente',
          buttons: ['OK'],
        });
      },
    });
  }

  public async takePicture(control: 'document_image' | 'business_image' | 'house_image'): Promise<void> {
    try {
      const { dataUrl } = await this.utilsSvc.takePicture(
        `Selecciona / Toma una foto`,
      );

      let path = 'clientes';
      const id = this.clienteId();

      switch (control) {
        case 'document_image':
          path += `/documentos/${id}`;
          break;
        case 'business_image':
          path += `/business/${id}`;
          break;
        case 'house_image':
          path += `/house/${id}`;
          break;
        default:
          break;
      }

      const loading = await this.utilsSvc.loading({
        message: 'Subiendo imagen...',
      });
      await loading.present();

      try {
        const urlImage = await this.firebaseSvc.uploadImage(path, dataUrl);
        this.imagesCliente[control] = urlImage;
        this.form.get(control)?.setValue(urlImage);
      } finally {
        loading.dismiss();
      }
    } catch {
      // Usuario canceló o falló la captura; sin toast ruidoso
    }
  }
}
