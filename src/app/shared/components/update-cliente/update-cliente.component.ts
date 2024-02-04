import { Component, Input, OnInit } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';
import { UtilsService } from '../../../services/utils.service';
import { Cliente } from 'src/app/models';
import { FormControl, FormGroup } from '@angular/forms';
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
    dpi: new FormControl(''),
    nombre: new FormControl(''),
    alias: new FormControl(''),
    direccion: new FormControl(''),
    telefono: new FormControl(''),
    document_image: new FormControl(''),
    business_image: new FormControl(''),
    house_image: new FormControl(''),
  })

  imagesCliente = {
    document_image: null,
    business_image: null,
    house_image: null,
  }

  constructor(
    private clienteSvc: ClienteService,
    private utilsSvc: UtilsService,
    private firebaseSvc: FirebaseService,
  ) { }

  ngOnInit() {
    if (!!this.cliente) {
      this.form.patchValue(this.cliente);
      this.imagesCliente.document_image = this.cliente.document_image;
      this.imagesCliente.business_image = this.cliente.business_image;
      this.imagesCliente.house_image = this.cliente.house_image;
    }
  }

  // get cliente(): Cliente {
  //   return this.clienteSvc.currentCliente();
  // }

  updateCliente() {
    this.clienteSvc.updateCliente(this.cliente._id, this.form.value)
      .subscribe({
        next: () => {
          this.utilsSvc.dismissModal({ success: true })
        }
      })
  }

  public async takePicture(control: string) {

    try {

      const { dataUrl } = await this.utilsSvc.takePicture(`Selecciona / Toma una foto`);

      let path: string = 'clientes';

      switch (control) {

        case 'document_image':
          path += `/documentos/${this.cliente._id}`;
          break;

        case 'business_image':
          path += `/business/${this.cliente._id}`;
          break;

        case 'house_image':
          path += `/house/${this.cliente._id}`;
          break;

        default:
          break;
      }

      const urlImage = await this.firebaseSvc.uploadImage(path, dataUrl);
      const loading = await this.utilsSvc.loading({ message: 'Subiendo imagen...' });
      await loading.present()
      this.imagesCliente[control] = urlImage;
      this.form.get(control).setValue(urlImage);
      loading.dismiss();

    } catch (error) {

    }

  }
}
