import { Injectable, inject } from '@angular/core';
import { CanActivate, UrlTree } from '@angular/router';
import { Observable, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UtilsService } from '../services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  private readonly authSvc = inject(AuthService);
  private readonly utilsSvc = inject(UtilsService);

  canActivate(): Observable<boolean | UrlTree> {
    if (!this.authSvc.hasStoredToken()) {
      return of(true);
    }

    // force=true: valida sesión real antes de redirigir al main
    return this.authSvc.revalidarToken(true).pipe(
      map((isAuth) => {
        if (!isAuth) {
          return true;
        }
        this.utilsSvc.routerLink('/main/home');
        return false;
      }),
    );
  }
}
