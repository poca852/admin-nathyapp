import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UtilsService } from '../services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  authSvc = inject(AuthService);
  utilsSvc = inject(UtilsService);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
      return new Promise((resolve) => {

        this.authSvc.revalidarToken().subscribe((isAuth) => {
          if(isAuth) {
            resolve(true);
          }else {
            this.utilsSvc.routerLink('/auth')
            localStorage.removeItem('user');
            resolve(false)
          }

        })

      })

  }
  
}
