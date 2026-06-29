import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProformaInvoiceItem {
  id?: number | string;
  proformaInvoiceId?: number | string;
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

export interface ProformaInvoice {
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
  customerOrder?: string;
  status?: 'DRAFT' | 'OPEN' | 'CONFIRMED' | 'CANCELLED';
  invoiceType?: 'NORMAL' | 'PROFORMA';
  deliveryCharge?: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items?: ProformaInvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProformaInvoiceListResponse {
  data: ProformaInvoice[];
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class ProformaInvoiceService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/client-user/meta-data/proforma-invoice/proforma-invoices`;

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

  create(body: Partial<ProformaInvoice>): Observable<ProformaInvoice> {
    return this.http
      .post<{ data: ProformaInvoice }>(`${this.baseUrl}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as ProformaInvoice)),
        catchError((e) => this.handleError(e))
      );
  }

  getAll(params?: { status?: string }): Observable<ProformaInvoiceListResponse> {
    let url = `${this.baseUrl}`;
    if (params?.status) url += `?status=${params.status}`;
    return this.http.get<ProformaInvoiceListResponse>(url).pipe(
      map((res) => ({
        data: Array.isArray((res as any)?.data) ? (res as any).data : [],
        count: (res as any)?.count ?? 0
      })),
      catchError((e) => this.handleError(e))
    );
  }

  getOne(id: number | string): Observable<ProformaInvoice> {
    return this.http
      .get<{ data: ProformaInvoice }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as ProformaInvoice)),
        catchError((e) => this.handleError(e))
      );
  }

  update(id: number | string, body: Partial<ProformaInvoice>): Observable<ProformaInvoice> {
    return this.http
      .put<{ data: ProformaInvoice }>(`${this.baseUrl}/${id}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as ProformaInvoice)),
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
