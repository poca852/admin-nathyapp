import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';

@Component({
  selector: 'app-super-admin',
  template: `<ion-router-outlet></ion-router-outlet>`,
  styles: [':host { display: block; height: 100%; }'],
})
export class SuperAdminPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  readonly ctx = inject(SuperAdminContextService);
  private sub?: Subscription;

  ngOnInit(): void {
    // Solo limpiar selección al salir del módulo SA (no al ir a un detalle hijo)
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = e.urlAfterRedirects || e.url;
        if (!url.startsWith('/main/super-admin')) {
          this.ctx.clear();
        }
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.ctx.clear();
  }
}
