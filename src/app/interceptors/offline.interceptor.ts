import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OfflineService } from '../services/offline.service';

@Injectable()
export class OfflineInterceptor implements HttpInterceptor {
  constructor(private offlineService: OfflineService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Detect network errors (status 0) or gateway timeout (504)
        if (error.status === 0 || error.status === 504) {
          this.offlineService.showOfflineWarning();
        }
        // Re-throw the error so that calling code can handle it
        return throwError(() => error);
      })
    );
  }
}