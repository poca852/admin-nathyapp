import { Component, OnInit, inject } from '@angular/core';
import { EmpleadosService } from 'src/app/services/empleados.service';
import { RutaService } from 'src/app/services/ruta.service';
import { UtilsService } from '../../../services/utils.service';
import { User } from 'src/app/models';
import { AddUpdateEmployeComponent } from '../../../shared/components/add-update-employe/add-update-employe.component';
import { EmpresaService } from '../../../services/empresa.service';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.page.html',
  styleUrls: ['./empleados.page.scss'],
})
export class EmpleadosPage implements OnInit {

  private rutaSvc = inject(RutaService);
  private employeSvc = inject(EmpleadosService);
  private utilsSvc = inject(UtilsService);
  private empresaSvc = inject(EmpresaService);

  public employesFilter: User[] = [];
  public employes: User[] = [];

  constructor() { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initComponent();
  }

  private initComponent() {
    this.empresaSvc.getEmpleados().subscribe({
      next: empleados => {
        this.employesFilter = empleados;
        this.employes = empleados;
      }
    })
  }

  filtrarClientes(termino: string): void {
    if (!termino || termino === '') {
      this.employesFilter = [...this.employes];
      return;
    }

    const normalizedQuery = termino.toLowerCase();
    this.employesFilter = this.employes.filter((item) => {
      return item.nombre.toLowerCase().includes(normalizedQuery);
    });
  }

  async lockUser(employe: User){
    this.employeSvc.updateEmploye(employe._id, {estado: !employe.estado})
      .subscribe({
        next: () => {
          this.initComponent();
        }
      })
  }

  async deleteUser(employe: User) {
    this.empresaSvc.deleteEmpleado(employe._id)
      .subscribe({
        next: () => {
          this.initComponent();
        },
        error: async(err) => {
          this.utilsSvc.presentAlert({
            header: 'Alerta',
            message: err.error.message,
            buttons: ['OK']
          })
        }
      })
  }

  public async presentActions(employe: User): Promise<void> {
    let text: string = 'Bloquear';
    let message: string = '¿Esta seguro de bloquear a ' + employe.nombre + '?';

    if(!employe.estado){
      text = 'Desbloquear',
      message = '¿Esta seguro de desbloquear a ' + employe.nombre + '?';
    }

    await this.utilsSvc.presentActionSheet({
      header: `Acciones para ${employe.nombre}`,
      buttons: [
        {
          text: 'Actualizar',
          handler: () => this.addUpdateEmploye(employe)
        },
        {
          text,
          handler: async() =>{
            await this.utilsSvc.presentAlert({
              header: 'Confrmacion',
              message,
              buttons: [
                {
                  text: 'Si',
                  handler: () => this.lockUser(employe)
                },
                {
                  text: 'Cancelar',
                  role: 'cancel'
                }
              ]
            })
          }
        },
        {
          text: 'Eliminar',
          handler: async() =>{
            await this.utilsSvc.presentAlert({
              header: 'Confrmacion',
              message: '¿Esta seguro de Eliminar a ' + employe.nombre + '?, esta accion no se podra revertir.',
              buttons: [
                {
                  text: 'Si',
                  handler: () => this.deleteUser(employe)
                },
                {
                  text: 'Cancelar',
                  role: 'cancel'
                }
              ]
            })
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => this.employeSvc.removeCurrentEmploye()
        }
      ]
    })
  } 

  async addUpdateEmploye(employe?: User){

    if(this.utilsSvc.getFromLocalStorage('user').rol !== 'ADMIN') {
      this.utilsSvc.presentToast({
        message: 'Usted no tiene permiso para realizar esta accion',
        duration: 3500,
        color: 'danger'
      })

      return;
    }

    let success = await this.utilsSvc.presentModal({
      component: AddUpdateEmployeComponent,
      cssClass: 'add-update-modal',
      componentProps: {employe}
    })

    if(success) {
      this.initComponent();
    }
  }

}
