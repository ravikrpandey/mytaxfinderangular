import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ReceiptAllocation {
  id?: number | string;
  receiptId?: number | string;
  salesInvoiceId: number | string;
  allocatedAmount: number;
  salesInvoice?: any;
}

export interface Receipt {
  id?: number | string;
  receiptNo: string;
  customerId: number;
  customerName: string;
  receiptDate: string;
  paymentMode: 'CASH' | 'BANK' | 'CHEQUE' | 'ONLINE' | 'OTHER';
  referenceNo?: string;
  amount: number;
  notes?: string;
  allocations?: ReceiptAllocation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ReceiptListResponse {
  data: Receipt[];
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/client-user/meta-data/receipt/receipts`;

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

  generateReceiptNo(): Observable<{ receiptNo: string }> {
    return this.http
      .get<{ data?: { receiptNo: string }; receiptNo?: string }>(`${this.baseUrl}/generate-number`)
      .pipe(
        map((res) => {
          const out = this.unwrap(res as any);
          return { receiptNo: (out as any)?.receiptNo ?? (res as any)?.receiptNo ?? '' };
        }),
        catchError((e) => this.handleError(e))
      );
  }

  create(body: Partial<Receipt>): Observable<Receipt> {
    return this.http
      .post<{ data: Receipt }>(`${this.baseUrl}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as Receipt)),
        catchError((e) => this.handleError(e))
      );
  }

  getAll(params?: { customerId?: number | string }): Observable<ReceiptListResponse> {
    let url = `${this.baseUrl}`;
    if (params?.customerId) url += `?customerId=${params.customerId}`;
    return this.http.get<ReceiptListResponse>(url).pipe(
      map((res) => ({
        data: Array.isArray((res as any)?.data) ? (res as any).data : [],
        count: (res as any)?.count ?? 0,
      })),
      catchError((e) => this.handleError(e))
    );
  }

  getOne(id: number | string): Observable<Receipt> {
    return this.http
      .get<{ data: Receipt }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as Receipt)),
        catchError((e) => this.handleError(e))
      );
  }

  update(id: number | string, body: Partial<Receipt>): Observable<Receipt> {
    return this.http
      .put<{ data: Receipt }>(`${this.baseUrl}/${id}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as Receipt)),
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
