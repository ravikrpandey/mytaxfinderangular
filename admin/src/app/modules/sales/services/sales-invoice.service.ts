import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SalesInvoiceItem {
  id?: number | string;
  salesInvoiceId?: number | string;
  productCode?: string;
  description: string;
  size?: string;
  finish?: string;
  packaging?: string;
  weight?: number;
  orderQty?: number;
  invoiceQty: number;
  salesPrice: number;
  discount: number;
  netPrice?: number;
}

export interface SalesInvoice {
  id?: number | string;
  invoiceNo: string;
  customerName: string;
  customerId?: number | null;
  contactName?: string;
  contactPhone?: string;
  phone2?: string;
  phone3?: string;
  billingAddress?: string;
  deliveryAddress?: string;
  invoiceDate: string;
  dueDate?: string | null;
  pickingNo?: string;
  pickedBy?: string;
  orderDate?: string | null;
  orderNo?: string;
  customerOrder?: string;
  shipVia?: string;
  shipReference?: string;
  shipDate?: string | null;
  fob?: string;
  shippingTerms?: string;
  status: 'UNPAID' | 'PAID' | 'DRAFT' | 'CANCELLED';
  accountPosting: boolean;
  ediPosting: boolean;
  deliveryCharge: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items?: SalesInvoiceItem[];
  paidAmount?: number;
  outstandingAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesInvoiceListResponse {
  data: SalesInvoice[];
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class SalesInvoiceService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/client-user/meta-data/sales-invoice/invoices`;

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

  generateInvoiceNo(): Observable<{ invoiceNo: string }> {
    return this.http
      .get<{ data?: { invoiceNo: string }; invoiceNo?: string }>(`${this.baseUrl}/generate-number`)
      .pipe(
        map((res) => {
          const out = this.unwrap(res as any);
          return { invoiceNo: (out as any)?.invoiceNo ?? (res as any)?.invoiceNo ?? '' };
        }),
        catchError((e) => this.handleError(e))
      );
  }

  create(body: Partial<SalesInvoice>): Observable<SalesInvoice> {
    return this.http
      .post<{ data: SalesInvoice }>(`${this.baseUrl}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as SalesInvoice)),
        catchError((e) => this.handleError(e))
      );
  }

  getAll(params?: { status?: string; customerId?: string | number }): Observable<SalesInvoiceListResponse> {
    let url = `${this.baseUrl}`;
    const queryParams: string[] = [];
    if (params?.status) queryParams.push(`status=${params.status}`);
    if (params?.customerId) queryParams.push(`customerId=${params.customerId}`);
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    return this.http.get<SalesInvoiceListResponse>(url).pipe(
      map((res) => ({
        data: Array.isArray((res as any)?.data) ? (res as any).data : [],
        count: (res as any)?.count ?? 0,
      })),
      catchError((e) => this.handleError(e))
    );
  }

  getOne(id: number | string): Observable<SalesInvoice> {
    return this.http
      .get<{ data: SalesInvoice }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as SalesInvoice)),
        catchError((e) => this.handleError(e))
      );
  }

  update(id: number | string, body: Partial<SalesInvoice>): Observable<SalesInvoice> {
    return this.http
      .put<{ data: SalesInvoice }>(`${this.baseUrl}/${id}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as SalesInvoice)),
        catchError((e) => this.handleError(e))
      );
  }

  remove(id: number | string): Observable<void> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined),
      catchError((e) => this.handleError(e))
    );
  }

  getPreviewPdf(body: Partial<SalesInvoice>): Observable<Blob> {
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
}
