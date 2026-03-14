import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UtilsService } from '../services/utils.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private utilsSvc = inject(UtilsService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const user = this.utilsSvc.getFromLocalStorage('user');

    if (user && user.token) {
      const cloned = request.clone({
        setHeaders: {
          authorization: `Bearer ${user.token}`
        }
      });
      return next.handle(cloned);
    }

    return next.handle(request);
  }
}
