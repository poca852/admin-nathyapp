import { Component, OnInit, inject, computed } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UtilsService } from '../../services/utils.service';
import { AuthService } from '../../services/auth.service';
import { User } from 'src/app/models';
import { Roles } from 'src/app/models/roles.enum';
import { EmpresaService } from '../../services/empresa.service';
import { RoleService } from '../../services/role.service';
import { UpdateUserComponent } from 'src/app/shared/components/update-user/update-user.component';

type MenuPage = {
  title: string;
  url: string;
  icon: string;
  /** Solo ADMIN (no SUPERVISOR). */
  adminOnly?: boolean;
};

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
})
export class MainPage implements OnInit {

  utilsSvc = inject(UtilsService);
  authSvc = inject(AuthService);
  empresaSvc = inject(EmpresaService);
  roleSvc = inject(RoleService);
  router = inject(Router);
  currentPath: string = '';

  readonly Roles = Roles;
  readonly isSuperAdmin = computed(() => this.roleSvc.isSuperAdmin());
  readonly isAdmin = computed(() => this.roleSvc.rol() === Roles.admin);

  /** Menú de ADMIN / SUPERVISOR (operación de una empresa). */
  private readonly adminPages: MenuPage[] = [
    { title: 'Inicio', url: '/main/home', icon: 'home-outline' },
    { title: 'Rutas', url: '/main/rutas', icon: 'layers-outline' },
    { title: 'Seguimiento', url: '/main/seguimiento', icon: 'navigate-outline' },
    { title: 'Empresa', url: '/main/empresa', icon: 'business-outline' },
    { title: 'Caja', url: '/main/caja', icon: 'calculator-outline' },
    { title: 'Pagos', url: '/main/pagos', icon: 'cash-outline' },
    { title: 'Empleados', url: '/main/empleados', icon: 'people-outline', adminOnly: true },
    { title: 'Clientes', url: '/main/clientes', icon: 'people-circle-outline' },
    { title: 'Renovaciones', url: '/main/renovaciones', icon: 'refresh-outline' },
    { title: 'Oficina', url: '/main/oficina', icon: 'briefcase-outline' },
    { title: 'Reportes', url: '/main/reportes', icon: 'bar-chart-outline', adminOnly: true },
  ];

  /** Menú exclusivo de SUPERADMIN (operación global / multi-empresa). */
  private readonly superAdminPages: MenuPage[] = [
    { title: 'Empresas', url: '/main/super-admin/empresas', icon: 'business-outline' },
    { title: 'Usuarios', url: '/main/super-admin/usuarios', icon: 'people-outline' },
    { title: 'Rutas', url: '/main/super-admin/rutas', icon: 'layers-outline' },
    { title: 'Transferencias', url: '/main/super-admin/transferencias', icon: 'swap-horizontal-outline' },
    { title: 'Operaciones', url: '/main/super-admin/operaciones', icon: 'construct-outline' },
  ];

  readonly menuPages = computed(() => {
    if (this.isSuperAdmin()) return this.superAdminPages;
    return this.adminPages.filter((p) => !p.adminOnly || this.isAdmin());
  });

  readonly menuTitle = computed(() =>
    this.isSuperAdmin() ? 'Super Admin' : 'Menú',
  );

  ngOnInit() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentPath = event.urlAfterRedirects || event.url;
        this.ensureSuperAdminHome();
      });

    this.ensureSuperAdminHome();
  }

  /** Si un SUPERADMIN aterriza fuera de su panel, lo manda a Empresas. */
  private ensureSuperAdminHome(): void {
    if (!this.isSuperAdmin()) return;

    const url = this.router.url || '';
    if (!url.startsWith('/main/super-admin')) {
      this.router.navigateByUrl('/main/super-admin/empresas');
    }
  }

  ionViewDidLeave() {
    this.empresaSvc.removeRuta();
    this.empresaSvc.removeRutas();
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  isActive(url: string): boolean {
    return this.currentPath === url || this.currentPath.startsWith(url + '/');
  }

  signOut() {
    this.authSvc.logout();
    this.utilsSvc.routerLink('/auth');
  }

  public updateUser = async () => {
    await this.utilsSvc.presentModal({
      component: UpdateUserComponent,
      cssClass: 'add-update-modal',
      componentProps: { user: this.user() },
    });
  };

}
