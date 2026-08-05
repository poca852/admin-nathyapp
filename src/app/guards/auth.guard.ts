import { Injectable, inject } from '@angular/core';
import { CanActivate, UrlTree } from '@angular/router';
import { Observable, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UtilsService } from '../services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  private readonly authSvc = inject(AuthService);
  private readonly utilsSvc = inject(UtilsService);

  canActivate(): Observable<boolean | UrlTree> {
    if (!this.authSvc.hasStoredToken()) {
      this.authSvc.clearStoredSession();
      this.utilsSvc.routerLink('/auth');
      return of(false);
    }

    // force=true: siempre consulta al API al entrar a rutas protegidas
    return this.authSvc.revalidarToken(true).pipe(
      map((isAuth) => {
        if (isAuth) {
          return true;
        }
        this.utilsSvc.routerLink('/auth');
        return false;
      }),
    );
  }
}
