import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PurchaseOrder {
  id?: number | string;
  invoiceId?: string;
  uploadInvoiceId?: string;
  veryfiRawResponse?: any;
  orderNumber?: string;
  poNumber?: string;
  supplierName?: string;
  vendorName?: string;
  vendorGSTIN?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  contactName?: string;
  contactPhone?: string;
  supplierReference?: string;
  orderDate?: string;
  status?: PurchaseOrderStatus;
  currency?: string;
  exchangeRate?: number;
  comments?: string;
  notes?: string;
  totalAmount?: number;
  subtotal?: number | string;
  taxAmount?: number | string;
  tax?: number | string;
  items?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'rejected';

/** Vendor info (Veryfi-style) */
export interface PurchaseOrderVendor {
  name?: string;
  address?: string;
  rawAddress?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  vendorId?: string;
}

/** Line item (Veryfi-style) */
export interface PurchaseOrderLineItem {
  description: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
}

/** Draft for review screen */
export interface PurchaseOrderDraft {
  invoiceId?: string;
  id?: number | string;
  orderNumber?: string;
  invoiceDate?: string;
  status?: PurchaseOrderStatus;
  vendor?: PurchaseOrderVendor;
  lineItems?: PurchaseOrderLineItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: string;
  [key: string]: unknown;
}

/** Payload to confirm draft */
export interface ConfirmPurchaseOrderPayload {
  lineItems: { description: string; quantity: number; unitPrice: number; amount: number }[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface PurchaseOrderListResponse {
  data: PurchaseOrder[];
  count?: number;
}

/** Payload for update status */
export interface UpdateStatusPayload {
  status: PurchaseOrderStatus;
}

/** Response from /api/invoices/upload */
export interface InvoiceUploadResponse {
  invoiceId: string;
  processingStatus?: string;
  veryfiDocumentId?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  /** Base URL for purchase order APIs */
  private readonly baseUrl = `${environment.apiUrl}/api/v1/client-user/meta-data/purchase-order/purchase-orders`;
  private readonly draftUrl = `${environment.apiUrl}/api/purchase-orders/`;

  /** Upload endpoint for raw invoice files (Veryfi OCR entrypoint) */
  private readonly invoiceUploadUrl = `${environment.apiUrl}/api/invoices/upload`;

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

  // ─── Number & lookup ─────────────────────────────────────────────────────
  /** GET /purchase-orders/generate-number */
  generatePoNumber(): Observable<{ poNumber: string }> {
    return this.http
      .get<{ data?: { poNumber: string }; poNumber?: string }>(`${this.baseUrl}/generate-number`)
      .pipe(
        map((res) => {
          const out = this.unwrap(res as any);
          return { poNumber: (out as any)?.poNumber ?? (res as any)?.poNumber ?? '' };
        }),
        catchError((e) => this.handleError(e))
      );
  }

  /** GET /purchase-orders/number/:poNumber */
  getByNumber(poNumber: string): Observable<PurchaseOrder> {
    return this.http
      .get<{ data: PurchaseOrder }>(`${this.baseUrl}/number/${encodeURIComponent(poNumber)}`)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as PurchaseOrder)),
        catchError((e) => this.handleError(e))
      );
  }

  // ─── Invoice upload & draft ──────────────────────────────────────────────
  /**
   * POST /api/invoices/upload – upload raw invoice and trigger Veryfi OCR.
   * Returns { invoiceId, processingStatus, veryfiDocumentId }.
   */
  uploadInvoice(file: File): Observable<InvoiceUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<InvoiceUploadResponse>(this.invoiceUploadUrl, formData)
      .pipe(catchError((e) => this.handleError(e)));
  }

  /**
   * GET draft/:invoiceId
   * Backend: router.get('/draft/:invoiceId', controller.getDraftByInvoiceId)
   */
  getPurchaseOrderDraft(invoiceId: string): Observable<PurchaseOrderDraft> {
    return this.http
      .get<{ data: PurchaseOrderDraft }>(`${this.draftUrl}draft/${encodeURIComponent(invoiceId)}`)
      .pipe(
        map((res) => this.normalizeDraft(this.unwrap(res) ?? (res as unknown as PurchaseOrderDraft), invoiceId)),
        catchError((e) => this.handleError(e))
      );
  }

  /**
   * POST confirm/:invoiceId
   * Backend: router.post('/confirm/:invoiceId', controller.confirmByInvoiceId)
   */
  confirmPurchaseOrder(invoiceId: string, payload: ConfirmPurchaseOrderPayload): Observable<PurchaseOrder> {
    return this.http
      .post<{ data: PurchaseOrder }>(`${this.draftUrl}confirm/${encodeURIComponent(invoiceId)}`, payload)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as PurchaseOrder)),
        catchError((e) => this.handleError(e))
      );
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────
  /** POST /purchase-orders */
  create(body: Partial<PurchaseOrder>): Observable<PurchaseOrder> {
    return this.http
      .post<{ data: PurchaseOrder }>(`${this.baseUrl}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as PurchaseOrder)),
        catchError((e) => this.handleError(e))
      );
  }

  /** GET /purchase-orders */
  getAll(params?: { page?: number; limit?: number; status?: PurchaseOrderStatus }): Observable<PurchaseOrderListResponse> {
    let url = `${this.baseUrl}`;
    if (params) {
      const search = new URLSearchParams();
      if (params.page != null) search.set('page', String(params.page));
      if (params.limit != null) search.set('limit', String(params.limit));
      if (params.status) search.set('status', params.status);
      const q = search.toString();
      if (q) url += `?${q}`;
    }
    return this.http.get<PurchaseOrderListResponse>(url).pipe(
      map((res) => ({
        data: Array.isArray((res as any)?.data) ? (res as any).data : [],
        count: (res as any)?.count ?? (res as any)?.data?.length ?? 0
      })),
      catchError((e) => this.handleError(e))
    );
  }

  /** GET /purchase-orders/:id */
  getOne(id: number | string): Observable<PurchaseOrder> {
    return this.http
      .get<{ data: PurchaseOrder }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as PurchaseOrder)),
        catchError((e) => this.handleError(e))
      );
  }

  /** PUT /purchase-orders/:id */
  update(id: number | string, body: Partial<PurchaseOrder>): Observable<PurchaseOrder> {
    return this.http
      .put<{ data: PurchaseOrder }>(`${this.baseUrl}/${id}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as PurchaseOrder)),
        catchError((e) => this.handleError(e))
      );
  }

  /** PATCH /purchase-orders/:id/status */
  updateStatus(id: number | string, payload: UpdateStatusPayload): Observable<PurchaseOrder> {
    return this.http
      .patch<{ data: PurchaseOrder }>(`${this.baseUrl}/${id}/status`, payload)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as PurchaseOrder)),
        catchError((e) => this.handleError(e))
      );
  }

  /** DELETE /purchase-orders/:id */
  remove(id: number | string): Observable<void> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined),
      catchError((e) => this.handleError(e))
    );
  }

  // ─── Legacy aliases ──────────────────────────────────────────────────────
  /** @deprecated Use getAll instead. */
  getList(params?: { page?: number; limit?: number; status?: PurchaseOrderStatus }): Observable<PurchaseOrderListResponse> {
    return this.getAll(params);
  }

  /** @deprecated Use getPurchaseOrderDraft instead. */
  getDraftByInvoiceId(invoiceId: string): Observable<PurchaseOrderDraft> {
    return this.getPurchaseOrderDraft(invoiceId);
  }

  private normalizeDraft(raw: PurchaseOrderDraft, invoiceId: string): PurchaseOrderDraft {
    const vendor: PurchaseOrderVendor = raw?.vendor ?? {};
    // Prefer normalized vendor fields from the PurchaseOrder itself
    if (!vendor.name && (raw as any)?.vendorName) vendor.name = (raw as any).vendorName as string;
    if (!vendor.rawAddress && (raw as any)?.vendorAddress) vendor.rawAddress = (raw as any).vendorAddress as string;
    // Fallbacks for older shapes
    if (!vendor.name && (raw as any)?.supplierName) vendor.name = (raw as any).supplierName as string;
    if (!vendor.rawAddress && (raw as any)?.supplierAddress) vendor.rawAddress = (raw as any).supplierAddress as string;

    // Normalize line items from multiple possible shapes:
    // - draft.lineItems (already normalized)
    // - raw.items (PurchaseOrder.items from backend)
    // - raw.line_items (Veryfi-style array)
    let lineItems: PurchaseOrderLineItem[] = Array.isArray(raw?.lineItems) ? [...raw.lineItems] : [];

    // New backend shape: items[]
    if (lineItems.length === 0 && Array.isArray((raw as any)?.items)) {
      lineItems = (raw as any).items.map((item: any) => ({
        description: item?.description ?? item?.name ?? '',
        hsnCode: item?.hsnCode ?? item?.hsn ?? undefined,
        quantity: Number(item?.qty ?? item?.quantity) || 0,
        unitPrice: Number(item?.rate ?? item?.unitPrice) || 0,
        amount: Number(item?.amount) || 0
      }));
    }

    // Fallback: Veryfi raw line_items[]
    if (lineItems.length === 0 && Array.isArray((raw as any)?.line_items)) {
      lineItems = (raw as any).line_items.map((item: any) => ({
        description: item?.description ?? item?.name ?? '',
        hsnCode: item?.hsn ?? undefined,
        quantity: Number(item?.quantity) || 0,
        unitPrice: Number(item?.unit_price ?? item?.rate) || 0,
        amount: Number(item?.amount) || 0
      }));
    }
    lineItems = lineItems.map((item) => ({
      ...item,
      amount: item.amount ?? item.quantity * item.unitPrice
    }));

    const subtotal = raw?.subtotal ?? lineItems.reduce((s, i) => s + (i.amount ?? 0), 0);
    const tax = raw?.tax ?? 0;
    const total = raw?.total ?? subtotal + tax;

    return {
      ...raw,
      invoiceId: raw?.invoiceId ?? invoiceId ?? undefined,
      vendor,
      lineItems,
      subtotal,
      tax,
      total: raw?.total ?? total
    };
  }
}
