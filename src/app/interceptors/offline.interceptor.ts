import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OfflineService } from '../services/offline.service';

@Injectable()
export class OfflineInterceptor implements HttpInterceptor {
  constructor(private offlineService: OfflineService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Solo status 0 = fallo de red real. 504 es problema de servidor/gateway.
        if (error.status === 0) {
          this.offlineService.reportNetworkFailure();
        }
        return throwError(() => error);
      }),
    );
  }
}
