import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PaymentAllocation {
  id?: number | string;
  paymentId?: number | string;
  purchaseOrderId: number | string;
  allocatedAmount: number;
  purchaseOrder?: any;
}

export interface Payment {
  id?: number | string;
  paymentNo: string;
  paymentType: 'invoice_payment' | 'direct_expense';
  vendorId?: number;
  vendorName?: string;
  expenseCategory?: string;
  paymentDate: string;
  paymentMode: 'CASH' | 'BANK' | 'CHEQUE' | 'ONLINE' | 'OTHER';
  referenceNo?: string;
  amount: number;
  notes?: string;
  allocations?: PaymentAllocation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentListResponse {
  data: Payment[];
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/client-user/meta-data/payment/payments`;

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

  generatePaymentNo(): Observable<{ paymentNo: string }> {
    return this.http
      .get<{ data?: { paymentNo: string }; paymentNo?: string }>(`${this.baseUrl}/generate-number`)
      .pipe(
        map((res) => {
          const out = this.unwrap(res as any);
          return { paymentNo: (out as any)?.paymentNo ?? (res as any)?.paymentNo ?? '' };
        }),
        catchError((e) => this.handleError(e))
      );
  }

  create(body: Partial<Payment>): Observable<Payment> {
    return this.http
      .post<{ data: Payment }>(`${this.baseUrl}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as Payment)),
        catchError((e) => this.handleError(e))
      );
  }

  getAll(params?: { vendorId?: number | string; paymentType?: 'invoice_payment' | 'direct_expense' }): Observable<PaymentListResponse> {
    let url = `${this.baseUrl}`;
    const searchParams = new URLSearchParams();
    if (params?.vendorId) searchParams.set('vendorId', String(params.vendorId));
    if (params?.paymentType) searchParams.set('paymentType', params.paymentType);
    const query = searchParams.toString();
    if (query) url += `?${query}`;

    return this.http.get<PaymentListResponse>(url).pipe(
      map((res) => ({
        data: Array.isArray((res as any)?.data) ? (res as any).data : [],
        count: (res as any)?.count ?? 0,
      })),
      catchError((e) => this.handleError(e))
    );
  }

  getOne(id: number | string): Observable<Payment> {
    return this.http
      .get<{ data: Payment }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as Payment)),
        catchError((e) => this.handleError(e))
      );
  }

  update(id: number | string, body: Partial<Payment>): Observable<Payment> {
    return this.http
      .put<{ data: Payment }>(`${this.baseUrl}/${id}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as Payment)),
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
