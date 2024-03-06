import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UtilsService } from '../../services/utils.service';
import { AuthService } from '../../services/auth.service';
import { User } from 'src/app/models';
import { RutaService } from '../../services/ruta.service';
import { EmpresaService } from '../../services/empresa.service';
import { UpdateUserComponent } from 'src/app/shared/components/update-user/update-user.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
})
export class MainPage implements OnInit {

  utilsSvc = inject(UtilsService);
  authSvc = inject(AuthService);
  empresaSvc = inject(EmpresaService);
  private rutaSvc = inject(RutaService);
  router = inject(Router);
  currentPath: string = '';


  pages = [
    { title: 'Inicio', url: '/main/home', icon: 'home-outline' },
    { title: 'Rutas', url: '/main/rutas', icon: 'layers-outline' },
    { title: 'Empresa', url: '/main/empresa', icon: 'business-outline' },
    { title: 'Caja', url: '/main/caja', icon: 'calculator-outline' },
    { title: 'Pagos', url: '/main/pagos', icon: 'cash-outline' },
    { title: 'Empleados', url: '/main/empleados', icon: 'people-outline' },
    { title: 'Clientes', url: '/main/clientes', icon: 'people-circle-outline' },
    { title: 'Renovaciones', url: '/main/renovaciones', icon: 'refresh-outline' },
    { title: 'Oficina', url: '/main/oficina', icon: 'briefcase-outline' },
  ]

  ngOnInit() {
    this.router.events.subscribe((event: any) => {

      if(event?.url) this.currentPath = event.url;

    })
  }

  ionViewWillEnter() {
    
  }

  ionViewDidLeave() {
   this.empresaSvc.removeRuta()
   this.empresaSvc.removeRutas()
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  signOut() {
    this.authSvc.logout();
    this.utilsSvc.routerLink('/auth')
  }

  isAdminOrSuperAdmin(): boolean {
    const user = this.user();
    return user && (user.rol === 'ADMIN' || user.rol === 'SUPERADMIN');
  }

  public updateUser = async () => {

    let success = await this.utilsSvc.presentModal({
      component: UpdateUserComponent,
      cssClass: 'add-update-modal',
      componentProps: {user: this.user()}
    })

    if( success ){

      this.utilsSvc.presentToast({
        message: 'Usuario actualizado',
        duration: 2400,
        color: 'success',
        icon: 'checkmark'
      })

    }

  }

}
