import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StockTransactionItem {
  id?: number | string;
  stockTransactionId?: number | string;
  productCode: string;
  description: string;
  size?: string;
  finish?: string;
  packaging?: string;
  balance?: number;
  stockQty: number;
  costPrice?: number;
  salePrice?: number;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockTransaction {
  id?: number | string;
  stockNo: string;
  stockType: 'STOCK IN' | 'STOCK OUT' | 'STOCK TAKE';
  transactionBy: string;
  date: string;
  reference?: string;
  referenceType?: string;
  comments?: string;
  status: 'DRAFT' | 'CONFIRM' | 'CANCELLED';
  items?: StockTransactionItem[];
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockTransactionListResponse {
  data: StockTransaction[];
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockTransactionService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/client-user/meta-data/stock-transaction`;

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

  generateStockNo(): Observable<{ stockNo: string }> {
    return this.http
      .get<{ data?: { stockNo: string }; stockNo?: string }>(`${this.baseUrl}/helper/next-number`)
      .pipe(
        map((res) => {
          const out = this.unwrap(res as any);
          return { stockNo: (out as any)?.stockNo ?? (res as any)?.stockNo ?? '' };
        }),
        catchError((e) => this.handleError(e))
      );
  }

  create(body: Partial<StockTransaction>): Observable<StockTransaction> {
    return this.http
      .post<{ data: StockTransaction }>(`${this.baseUrl}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as StockTransaction)),
        catchError((e) => this.handleError(e))
      );
  }

  getAll(params?: { status?: string; stockType?: string; dateFrom?: string; dateTo?: string }): Observable<StockTransactionListResponse> {
    let queryParams: string[] = [];
    if (params?.status) queryParams.push(`status=${params.status}`);
    if (params?.stockType) queryParams.push(`stockType=${params.stockType}`);
    if (params?.dateFrom) queryParams.push(`dateFrom=${params.dateFrom}`);
    if (params?.dateTo) queryParams.push(`dateTo=${params.dateTo}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return this.http.get<StockTransactionListResponse>(`${this.baseUrl}${queryString}`).pipe(
      map((res) => ({
        data: Array.isArray((res as any)?.data) ? (res as any).data : [],
        count: (res as any)?.count ?? (res as any)?.data?.length ?? 0
      })),
      catchError((e) => this.handleError(e))
    );
  }

  getOne(id: number | string): Observable<StockTransaction> {
    return this.http
      .get<{ data: StockTransaction }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as StockTransaction)),
        catchError((e) => this.handleError(e))
      );
  }

  update(id: number | string, body: Partial<StockTransaction>): Observable<StockTransaction> {
    return this.http
      .put<{ data: StockTransaction }>(`${this.baseUrl}/${id}`, body)
      .pipe(
        map((res) => this.unwrap(res) ?? (res as unknown as StockTransaction)),
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
