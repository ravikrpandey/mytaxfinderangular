import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SalesOrderItem {
  id?: number | string;
  salesOrderId?: number | string;
  productCode?: string;
  description: string;
  size?: string;
  finish?: string;
  packaging?: string;
  boxQty?: number;
  outerQty?: number;
  palletQty?: number;
  weight?: number;
  qty: number;
  salePrice: number;
  totalPrice: number;
}

export interface SalesOrder {
  id?: number | string;
  orderNo: string;
  customerName: string;
  customerId?: number | null;
  contactName?: string;
  contactPhone?: string;
  phone2?: string;
  phone3?: string;
  billingAddress?: string;
  deliveryAddress?: string;
  orderDate: string;
  dueDate?: string | null;
  customerOrder?: string;
  quotation?: string;
  status?: 'DRAFT' | 'OPEN' | 'CONFIRMED' | 'CANCELLED';
  orderType?: 'NORMAL' | 'PROFORMA';
  deliveryCharge?: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items?: SalesOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesOrderListResponse {
  data: SalesOrder[];
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class SalesOrderService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/client-user/meta-data/sales-order/sales-orders`;

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

  generateOrderNo(): Observable<{ orderNo: string }> {
    return this.http
      .get<{ data?: { orderNo: string }; orderNo?: string }>(`${this.baseUrl}/generate-number`)
      .pipe(
        map((res) => {
          const out = this.unwrap(res as any);
          return { orderNo: (out as any)?.orderNo ?? (res as any)?.orderNo ?? '' };
        }),
        catchError((e) => this.handleError(e))
      );
  }

  create(body: Partial<SalesOrder>): Observable<SalesOrder> {
    return this.http
      .post<{ data: SalesOrder }>(`${this.baseUrl}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as SalesOrder)),
        catchError((e) => this.handleError(e))
      );
  }

  getAll(params?: { status?: string }): Observable<SalesOrderListResponse> {
    let url = `${this.baseUrl}`;
    if (params?.status) url += `?status=${params.status}`;
    return this.http.get<SalesOrderListResponse>(url).pipe(
      map((res) => ({
        data: Array.isArray((res as any)?.data) ? (res as any).data : [],
        count: (res as any)?.count ?? 0
      })),
      catchError((e) => this.handleError(e))
    );
  }

  getOne(id: number | string): Observable<SalesOrder> {
    return this.http
      .get<{ data: SalesOrder }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as SalesOrder)),
        catchError((e) => this.handleError(e))
      );
  }

  update(id: number | string, body: Partial<SalesOrder>): Observable<SalesOrder> {
    return this.http
      .put<{ data: SalesOrder }>(`${this.baseUrl}/${id}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as SalesOrder)),
        catchError((e) => this.handleError(e))
      );
  }

  remove(id: number | string): Observable<void> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined),
      catchError((e) => this.handleError(e))
    );
  }

  getPreviewPdf(body: Partial<SalesOrder>): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/preview-pdf`, body, {
      responseType: 'blob'
    }).pipe(
      catchError((e) => this.handleError(e))
    );
  }

  getStoredPdf(id: number | string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, {
      responseType: 'blob'
    }).pipe(
      catchError((e) => this.handleError(e))
    );
  }
}
