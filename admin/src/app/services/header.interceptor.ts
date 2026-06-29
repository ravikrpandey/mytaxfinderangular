import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const entityId = localStorage.getItem('entityId') || '1';
    const financialYearId = localStorage.getItem('financialYearId') || '22';

    const modifiedReq = req.clone({
      setHeaders: {
        'entity-id': entityId,
        'financial-year-id': financialYearId
      }
    });

    return next.handle(modifiedReq);
  }
}
