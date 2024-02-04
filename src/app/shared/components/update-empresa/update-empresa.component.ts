import { Component, Input, OnInit } from '@angular/core';
import { Country, Empresa } from 'src/app/models';
import { UtilsService } from '../../../services/utils.service';
import { EmpresaService } from '../../../services/empresa.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CountriesService } from '../../../services/countries.service';

@Component({
  selector: 'app-update-empresa',
  templateUrl: './update-empresa.component.html',
  styleUrls: ['./update-empresa.component.scss'],
})
export class UpdateEmpresaComponent  implements OnInit {

  @Input() empresa: Empresa;

  paises: Country[] = []

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    country: new FormControl('', [Validators.required]),
  })

  constructor(
    private utilsSvc: UtilsService,
    private empresaSvc: EmpresaService,
    private countrySvc: CountriesService,
  ) { }

  ngOnInit() {

    if(!!this.empresa){
      this.form.patchValue(this.empresa);
    }

    this.getPaises();

  }

  getPaises() {
    this.countrySvc.getPaises().subscribe({
      next: (paises) => this.paises = paises,
      error: () => this.utilsSvc.dismissModal({success: false})
    })
  }

  editEmpresa() {
    this.empresaSvc.editEmpresa(this.empresa._id, this.form.value).subscribe({
      next: () => {
        this.utilsSvc.dismissModal({success: true})
      },
      error: err => {
        this.utilsSvc.presentAlert({
          header: 'Error',
          message: err.error.message,
          buttons: ['OK']
        })
      }
    })
  }

}
