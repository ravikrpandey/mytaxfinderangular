import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PurchaseReturnItem {
  id?: number | string;
  purchaseReturnId?: number | string;
  productCode?: string;
  description: string;
  size?: string;
  finish?: string;
  packaging?: string;
  invoiceQty?: number;
  qty: number;
  rate: number;
  discount?: number;
  netPrice: number;
  totalPrice: number;
  comment?: string;
}

export interface PurchaseReturn {
  id?: number | string;
  returnNo: string;
  vendorName: string;
  contactName?: string;
  contactPhone?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  returnDate: string;
  supplierReference?: string;
  purchaseInvoice?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status?: 'draft' | 'sent' | 'approved' | 'cancelled';
  comments?: string;
  items?: PurchaseReturnItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseReturnListResponse {
  data: PurchaseReturn[];
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseReturnService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/client-user/meta-data/purchase-return/purchase-returns`;

  constructor(private readonly http: HttpClient) {}

  private handleError(err: unknown): Observable<never> {
    const message = this.getErrorMessage(err);
    return throwError(() => new Error(message));
  }

  private getErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body && typeof body === 'object') {
        if (typeof body.message === 'string') return body.message;
        if (typeof body.error === 'string') return body.error;
        if (Array.isArray(body.errors)) return body.errors.join('; ') || err.message;
      }
      return err.message || `Request failed with status ${err.status}`;
    }
    if (err instanceof Error) return err.message;
    return 'An unexpected error occurred';
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

  create(body: Partial<PurchaseReturn>): Observable<PurchaseReturn> {
    return this.http
      .post<{ data: PurchaseReturn }>(`${this.baseUrl}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as PurchaseReturn)),
        catchError((e) => this.handleError(e))
      );
  }

  getAll(params?: { status?: string }): Observable<PurchaseReturnListResponse> {
    let url = `${this.baseUrl}`;
    if (params?.status) {
      url += `?status=${params.status}`;
    }
    return this.http.get<PurchaseReturnListResponse>(url).pipe(
      map((res) => ({
        data: Array.isArray((res as any)?.data) ? (res as any).data : [],
        count: (res as any)?.count ?? (res as any)?.data?.length ?? 0
      })),
      catchError((e) => this.handleError(e))
    );
  }

  getOne(id: number | string): Observable<PurchaseReturn> {
    return this.http
      .get<{ data: PurchaseReturn }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as PurchaseReturn)),
        catchError((e) => this.handleError(e))
      );
  }

  update(id: number | string, body: Partial<PurchaseReturn>): Observable<PurchaseReturn> {
    return this.http
      .put<{ data: PurchaseReturn }>(`${this.baseUrl}/${id}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as PurchaseReturn)),
        catchError((e) => this.handleError(e))
      );
  }

  remove(id: number | string): Observable<void> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined),
      catchError((e) => this.handleError(e))
    );
  }
}
