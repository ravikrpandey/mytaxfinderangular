import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface InvoiceItem {
  description: string;
  hsnCode: string;
  qty: number;
  rate: number;
  gstPercentage: '0' | '5' | '12' | '18' | '28';
  amount: number;
}

export interface InvoiceCreateRequest {
  invoiceNumber: string;
  invoiceDate: string;
  placeOfSupply: string;
  customerName: string;
  customerGSTIN: string;
  customerAddress: string;
  items: InvoiceItem[];
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  freight: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  invoiceDate: string;
  placeOfSupply: string;
  customerName: string;
  customerGSTIN: string;
  customerAddress: string;
  items: InvoiceItem[];
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  freight: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface InvoiceListResponse {
  data: any[];
  count: number;
}

interface InvoiceResponse {
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private invoicesApiUrl = `${environment.apiUrl}/api/v1/client-user/meta-data/invoice/invoices`;

  constructor(private http: HttpClient) {}

  private normalizeInvoice(raw: any): Invoice {
    const items = Array.isArray(raw?.items) ? raw.items : [];

    return {
      id: raw?.id ?? undefined,
      invoiceNumber: raw?.invoiceNumber ?? '',
      invoiceDate: raw?.invoiceDate ?? '',
      placeOfSupply: raw?.placeOfSupply ?? '',
      customerName: raw?.customerName ?? '',
      customerGSTIN: raw?.customerGSTIN ?? '',
      customerAddress: raw?.customerAddress ?? '',
      items: items.map((item: any) => ({
        description: item?.description ?? '',
        hsnCode: item?.hsnCode ?? '',
        qty: Number(item?.qty ?? 0),
        rate: Number(item?.rate ?? 0),
        gstPercentage: (item?.gstPercentage ?? '0') as InvoiceItem['gstPercentage'],
        amount: Number(item?.amount ?? 0)
      })),
      taxableAmount: Number(raw?.taxableAmount ?? 0),
      cgst: Number(raw?.cgst ?? 0),
      sgst: Number(raw?.sgst ?? 0),
      igst: Number(raw?.igst ?? 0),
      totalAmount: Number(raw?.totalAmount ?? 0),
      freight: Number(raw?.freight ?? 0),
      status: raw?.status ?? undefined,
      createdAt: raw?.createdAt ?? undefined,
      updatedAt: raw?.updatedAt ?? undefined
    };
  }

  private unwrapInvoice(response: Invoice | InvoiceResponse): Invoice {
    const raw = (response as InvoiceResponse)?.data ?? response;
    return this.normalizeInvoice(raw);
  }

  /**
   * Create new invoice
   */
  createInvoice(invoice: InvoiceCreateRequest): Observable<Invoice> {
    console.log('📡 API Call: POST', this.invoicesApiUrl, invoice);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<Invoice | InvoiceResponse>(this.invoicesApiUrl, invoice, { headers }).pipe(
      map(response => this.unwrapInvoice(response))
    );
  }

  /**
   * Get all invoices
   */
  getInvoices(): Observable<Invoice[]> {
    console.log('📡 API Call: GET', this.invoicesApiUrl);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<InvoiceListResponse | Invoice[]>(this.invoicesApiUrl, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map(item => this.normalizeInvoice(item));
        }

        if (response && Array.isArray(response.data)) {
          return response.data.map(item => this.normalizeInvoice(item));
        }

        return [];
      })
    );
  }

  /**
   * Get invoice by ID
   */
  getInvoiceById(id: number): Observable<Invoice> {
    const url = `${this.invoicesApiUrl}/${id}`;
    console.log('📡 API Call: GET', url);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<Invoice | InvoiceResponse>(url, { headers }).pipe(
      map(response => this.unwrapInvoice(response))
    );
  }

  /**
   * Get invoice by invoice number
   */
  getInvoiceByNumber(invoiceNumber: string): Observable<Invoice> {
    const url = `${this.invoicesApiUrl}/number/${encodeURIComponent(invoiceNumber)}`;
    console.log('📡 API Call: GET', url);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<Invoice | InvoiceResponse>(url, { headers }).pipe(
      map(response => this.unwrapInvoice(response))
    );
  }

  /**
   * Generate new invoice number
   */
  generateInvoiceNumber(): Observable<{ invoiceNumber: string }> {
    const url = `${this.invoicesApiUrl}/generate-number`;
    console.log('📡 API Call: GET', url);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<{ invoiceNumber: string }>(url, { headers });
  }

  /**
   * Get invoices by date range
   */
  getInvoicesByDateRange(startDate: string, endDate: string): Observable<Invoice[]> {
    const url = `${this.invoicesApiUrl}/by-date?startDate=${startDate}&endDate=${endDate}`;
    console.log('📡 API Call: GET', url);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<Invoice[]>(url, { headers });
  }

  /**
   * Get invoices by customer GSTIN
   */
  getInvoicesByCustomer(customerGSTIN: string): Observable<Invoice[]> {
    const url = `${this.invoicesApiUrl}/by-customer/${encodeURIComponent(customerGSTIN)}`;
    console.log('📡 API Call: GET', url);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<Invoice[]>(url, { headers });
  }

  /**
   * Update invoice
   */
  updateInvoice(id: number, invoice: Partial<InvoiceCreateRequest>): Observable<Invoice> {
    const url = `${this.invoicesApiUrl}/${id}`;
    console.log('📡 API Call: PUT', url, invoice);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<Invoice | InvoiceResponse>(url, invoice, { headers }).pipe(
      map(response => this.unwrapInvoice(response))
    );
  }

  /**
   * Update invoice status
   */
  updateInvoiceStatus(id: number, status: string): Observable<Invoice> {
    const url = `${this.invoicesApiUrl}/${id}/status`;
    console.log('📡 API Call: PATCH', url, { status });

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.patch<Invoice | InvoiceResponse>(url, { status }, { headers }).pipe(
      map(response => this.unwrapInvoice(response))
    );
  }

  /**
   * Delete invoice
   */
  deleteInvoice(id: number): Observable<any> {
    const url = `${this.invoicesApiUrl}/${id}`;
    console.log('📡 API Call: DELETE', url);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.delete<any>(url, { headers });
  }
}
