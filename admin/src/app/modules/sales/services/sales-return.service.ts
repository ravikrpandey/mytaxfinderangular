import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SalesReturnItem {
  id?: number | string;
  salesReturnId?: number | string;
  productCode?: string;
  description: string;
  size?: string;
  finish?: string;
  packaging?: string;
  weight?: number;
  orderQty?: number;
  invoiceQty?: number;
  returnQty: number;
  salesPrice: number;
  discount: number;
  netPrice?: number;
}

export interface SalesReturn {
  id?: number | string;
  returnNo: string;
  customerName: string;
  customerId?: number | null;
  contactName?: string;
  contactPhone?: string;
  phone2?: string;
  phone3?: string;
  billingAddress?: string;
  deliveryAddress?: string;
  returnDate: string;
  customerRef?: string;
  salesInvoice?: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'CANCELLED';
  deliveryCharge: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  comments?: string;
  items?: SalesReturnItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesReturnListResponse {
  data: SalesReturn[];
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class SalesReturnService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/client-user/meta-data/sales-return/sales-returns`;

  constructor(private readonly http: HttpClient) {}

  private handleError(err: unknown): Observable<never> {
    let message = 'An unexpected error occurred';
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body && typeof body === 'object') {
        if (typeof body.message === 'string') message = body.message;
        else if (typeof body.error === 'string') message = body.error;
      } else {
        message = err.message || `Request failed with status ${err.status}`;
      }
    } else if (err instanceof Error) {
      message = err.message;
    }
    return throwError(() => new Error(message));
  }

  private unwrap<T>(res: { data?: T } | T): T {
    return (res && typeof res === 'object' && 'data' in res ? (res as { data: T }).data : res) as T;
  }

  generateReturnNo(): Observable<{ returnNo: string }> {
    return this.http
      .get<{ data?: { returnNo: string }; returnNo?: string }>(`${this.baseUrl}/generate-number`)
      .pipe(
        map((res) => {
          const out = this.unwrap(res as any);
          return { returnNo: (out as any)?.returnNo ?? (res as any)?.returnNo ?? '' };
        }),
        catchError((e) => this.handleError(e))
      );
  }

  create(body: Partial<SalesReturn>): Observable<SalesReturn> {
    return this.http
      .post<{ data: SalesReturn }>(`${this.baseUrl}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as SalesReturn)),
        catchError((e) => this.handleError(e))
      );
  }

  getAll(params?: { status?: string }): Observable<SalesReturnListResponse> {
    let url = `${this.baseUrl}`;
    if (params?.status) url += `?status=${params.status}`;
    return this.http.get<SalesReturnListResponse>(url).pipe(
      map((res) => ({
        data: Array.isArray((res as any)?.data) ? (res as any).data : [],
        count: (res as any)?.count ?? 0,
      })),
      catchError((e) => this.handleError(e))
    );
  }

  getOne(id: number | string): Observable<SalesReturn> {
    return this.http
      .get<{ data: SalesReturn }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as SalesReturn)),
        catchError((e) => this.handleError(e))
      );
  }

  update(id: number | string, body: Partial<SalesReturn>): Observable<SalesReturn> {
    return this.http
      .put<{ data: SalesReturn }>(`${this.baseUrl}/${id}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as SalesReturn)),
        catchError((e) => this.handleError(e))
      );
  }

  remove(id: number | string): Observable<void> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined),
      catchError((e) => this.handleError(e))
    );
  }

  getPreviewPdf(body: Partial<SalesReturn>): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/preview`, body, {
      responseType: 'blob',
    }).pipe(
      catchError((e) => this.handleError(e))
    );
  }

  getStoredPdf(id: number | string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, {
      responseType: 'blob',
    }).pipe(
      catchError((e) => this.handleError(e))
    );
  }

  getAlreadyReturnedQty(invoiceNo: string): Observable<{ [productCode: string]: number }> {
    return this.http
      .get<{ success: boolean; data: { [productCode: string]: number } }>(`${this.baseUrl}/already-returned/${invoiceNo}`)
      .pipe(
        map((res) => res.data || {}),
        catchError((e) => this.handleError(e))
      );
  }
}
