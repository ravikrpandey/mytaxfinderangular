import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  role: string;
  message: string;
  token?: string;
  user?: any;
  [key: string]: any;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface CreateUserResponse {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  message?: string;
  [key: string]: any;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface UpdateUserResponse {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  message?: string;
  [key: string]: any;
}

export interface DeleteUserResponse {
  message?: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  subCategory?: string;
  supplier?: string;
  supplierName?: string;
  unitPrice: number;
  stockLevel: number;
  minStockThreshold: number;
  // Extended fields
  partNumber?: string;
  currency?: string;
  exRate?: number;
  purchasePrice?: number;
  additionalPer?: number;
  landedPrice?: number;
  salePrice?: number;
  discount?: number;
  netPrice?: number;
  unit?: string;
  size?: string;
  finish?: string;
  packaging?: string;
  hsnCode?: string;
  aisle?: string;
  bay?: string;
  weight?: number;
  reOrderLevel?: number;
  reOrderQty?: number;
  isStockItem?: boolean;
  balance?: number;
  boxQty?: number;
  barcode?: string;
  outerBarcode?: string;
  outerQty?: number;
  palletBarcode?: string;
  palletQty?: number;
  location?: string;
  location2?: string;
  location3?: string;
  location4?: string;
  remarks?: string;
  isActive?: boolean;
  published?: boolean;
  fullDescription?: string;
  imagePath?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  category?: string;
  subCategory?: string;
  supplier?: string;
  unitPrice?: number;
  minStockThreshold?: number;
  // Extended fields
  partNumber?: string;
  currency?: string;
  exRate?: number;
  purchasePrice?: number;
  additionalPer?: number;
  landedPrice?: number;
  salePrice?: number;
  discount?: number;
  netPrice?: number;
  unit?: string;
  size?: string;
  finish?: string;
  packaging?: string;
  hsnCode?: string;
  aisle?: string;
  bay?: string;
  weight?: number;
  reOrderLevel?: number;
  reOrderQty?: number;
  isStockItem?: boolean;
  balance?: number;
  boxQty?: number;
  barcode?: string;
  outerBarcode?: string;
  outerQty?: number;
  palletBarcode?: string;
  palletQty?: number;
  location?: string;
  location2?: string;
  location3?: string;
  location4?: string;
  remarks?: string;
  isActive?: boolean;
  published?: boolean;
  fullDescription?: string;
  imagePath?: string;
  images?: string[];
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface UpdateStockRequest {
  quantity: number;
  type: 'in' | 'out';
  notes?: string;
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: 'purchase' | 'sale';
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  userId: string;
  userName: string;
  date: string;
  notes?: string;
}

export interface CreateTransactionRequest {
  productId: string;
  type: 'purchase' | 'sale';
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  totalSales: number;
  totalPurchases: number;
  netProfit: number;
  totalTransactions: number;
  recentCases?: any[];
  recentServices?: any[];
  completedReturns?: number;
  activeGST?: number;
}

export interface SalesStats {
  totalSales: number;
  transactionCount: number;
  averageSaleAmount: number;
}

export interface PurchaseStats {
  totalPurchases: number;
  transactionCount: number;
  averagePurchaseAmount: number;
}

export interface AlertSettings {
  enabled: boolean;
  emailAlerts: boolean;
  smsAlerts: boolean;
}

export interface BusinessAccountSubmitRequest {
  hasGstin: 'yes' | 'no';
  gstin: string;
  companyName: string;
  companyCode: string;
  phoneNumber?: string;
  website?: string;
  fullName: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  pincode: string;
  city: string;
  state: string;
  identifier: string;
  createdAt: string;
}

export interface RoleMenuChildAccess {
  path: string;
  label: string;
  canView?: boolean;
  canEdit?: boolean;
  canCreate?: boolean;
}

export interface RoleMenuAccessEntry extends RoleMenuChildAccess {
  children?: {
    [key: string]: RoleMenuChildAccess;
  };
}

export interface RoleMenuAccess {
  [key: string]: RoleMenuAccessEntry;
}

export interface BusinessAccountCheckResponse {
  exists: boolean;
  message: string;
  data?: {
    id: number;
    hasGstin: string;
    gstin: string;
    companyName: string;
    fullName: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    pincode: string;
    city: string;
    state: string;
    identifier: string;
    role?: string;
    role_menu_access?: RoleMenuAccess;
    createdAt: string;
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private businessAccountsApiUrl = 'http://localhost:5000/api/v1/client-user/meta-data/business-account/business-accounts';

  constructor(private http: HttpClient) {}


  /**
   * Get authorization headers with JWT token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Using auth token for API call');
    } else {
      console.warn('⚠️ No auth token found - API call may fail');
    }
    
    return new HttpHeaders(headers);
  }

  /**
   * Get authorization headers without setting Content-Type (used for FormData uploads)
   */
  private getAuthHeadersWithoutContentType(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  /**
   * Login API call
   * @param username - User's username or email
   * @param password - User's password
   * @returns Observable with login response
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = {
      email,
      password
    };

    const url = `${this.apiUrl}/login`;
    console.log('📡 API Call: POST', url, { email, password: '***' });

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<LoginResponse>(url, loginData, { headers });
  }

  submitBusinessAccount(payload: BusinessAccountSubmitRequest): Observable<any> {
    console.log('📡 API Call: POST', this.businessAccountsApiUrl, payload);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(this.businessAccountsApiUrl, payload, { headers });
  }

  checkBusinessAccountExists(value: string, key: 'identifier' | 'email' = 'identifier'): Observable<BusinessAccountCheckResponse> {
    const url = `${this.businessAccountsApiUrl}/check-exists?${key}=${encodeURIComponent(value)}`;
    console.log('📡 API Call: GET', url);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<BusinessAccountCheckResponse>(url, { headers });
  }


  /**
   * Create User API call
   * @param username - User's username
   * @param email - User's email
   * @param password - User's password
   * @param role - User's role (e.g., 'user', 'admin')
   * @returns Observable with create user response
   */
  createUser(username: string, email: string, password: string, role: string = 'user'): Observable<CreateUserResponse> {
    const userData: CreateUserRequest = {
      username,
      email,
      password,
      role
    };

    return this.http.post<CreateUserResponse>(`${this.apiUrl}/users`, userData, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Update User API call
   * @param username - User's username (identifier)
   * @param userData - User data to update (username, email, password, role)
   * @returns Observable with update user response
   */
  updateUser(username: string, userData: UpdateUserRequest): Observable<UpdateUserResponse> {
    return this.http.put<UpdateUserResponse>(`${this.apiUrl}/users/${username}`, userData, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Delete User API call
   * @param username - User's username (identifier)
   * @returns Observable with delete user response
   */
  deleteUser(username: string): Observable<DeleteUserResponse> {
    return this.http.delete<DeleteUserResponse>(`${this.apiUrl}/users/${username}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // ==================== PRODUCT APIs ====================

  /**
   * Get all products
   */
  getProducts(search?: string, category?: string, lowStock?: boolean): Observable<Product[]> {
    let params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (lowStock !== undefined) params.append('lowStock', lowStock.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.apiUrl}/api/products?${queryString}` : `${this.apiUrl}/api/products`;
    
    console.log('📡 API Call: GET', url);
    
    return this.http.get<Product[]>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Get product by ID
   */
  getProductById(id: string): Observable<Product> {
    const url = `${this.apiUrl}/api/products/${id}`;
    console.log('📡 API Call: GET', url);
    return this.http.get<Product>(url, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Get product by SKU
   */
  getProductBySku(sku: string): Observable<Product> {
    const url = `${this.apiUrl}/api/products/sku/${sku}`;
    console.log('📡 API Call: GET', url);
    return this.http.get<Product>(url, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Upload single product image
   */
  uploadProductImage(file: File): Observable<{ filePath: string }> {
    const url = `${this.apiUrl}/api/products/upload-image`;
    const formData = new FormData();
    formData.append('image', file);
    console.log('📡 API Call: POST', url);
    return this.http.post<{ filePath: string }>(url, formData, {
      headers: this.getAuthHeadersWithoutContentType()
    });
  }

  /**
   * Upload multiple product images
   */
  uploadProductImages(files: FileList | File[]): Observable<{ filePaths: string[] }> {
    const url = `${this.apiUrl}/api/products/upload-images`;
    const formData = new FormData();
    if (files instanceof FileList) {
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }
    } else {
      files.forEach(file => {
        formData.append('images', file);
      });
    }
    console.log('📡 API Call: POST', url);
    return this.http.post<{ filePaths: string[] }>(url, formData, {
      headers: this.getAuthHeadersWithoutContentType()
    });
  }

  /**
   * Create product
   */
  createProduct(product: CreateProductRequest): Observable<Product> {
    const url = `${this.apiUrl}/api/products`;
    console.log('📡 API Call: POST', url, product);
    return this.http.post<Product>(url, product, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Update product
   */
  updateProduct(id: string, updates: UpdateProductRequest): Observable<Product> {
    const url = `${this.apiUrl}/api/products/${id}`;
    console.log('📡 API Call: PUT', url, updates);
    return this.http.put<Product>(url, updates, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Delete product
   */
  deleteProduct(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/api/products/${id}`;
    console.log('📡 API Call: DELETE', url);
    return this.http.delete<{ message: string }>(url, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Update stock level
   */
  updateStockLevel(id: string, stockData: UpdateStockRequest): Observable<Product> {
    const url = `${this.apiUrl}/api/products/${id}/stock`;
    console.log('📡 API Call: POST', url, stockData);
    return this.http.post<Product>(url, stockData, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Get low stock products
   */
  getLowStockProducts(): Observable<Product[]> {
    const url = `${this.apiUrl}/products/low-stock`;
    console.log('📡 API Call: GET', url);
    return this.http.get<Product[]>(url, { 
      headers: this.getAuthHeaders() 
    });
  }

  // ==================== TRANSACTION APIs ====================

  /**
   * Get all transactions
   */
  getTransactions(params?: {
    type?: 'purchase' | 'sale' | 'all';
    startDate?: string;
    endDate?: string;
    productId?: string;
    userId?: string;
    search?: string;
  }): Observable<Transaction[]> {
    let queryParams = new URLSearchParams();
    if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `${this.apiUrl}/transactions?${queryString}` : `${this.apiUrl}/transactions`;
    
    console.log('📡 API Call: GET', url);
    
    return this.http.get<Transaction[]>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Get transaction by ID
   */
  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/transactions/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Create transaction
   */
  createTransaction(transaction: CreateTransactionRequest): Observable<Transaction> {
    const url = `${this.apiUrl}/transactions`;
    console.log('📡 API Call: POST', url, transaction);
    return this.http.post<Transaction>(url, transaction, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Delete transaction
   */
  deleteTransaction(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/transactions/${id}`;
    console.log('📡 API Call: DELETE', url);
    return this.http.delete<{ message: string }>(url, { 
      headers: this.getAuthHeaders() 
    });
  }

  // ==================== STATISTICS/DASHBOARD APIs ====================

  /**
   * Get dashboard statistics
   */
  getDashboardStats(startDate?: string, endDate?: string): Observable<DashboardStats> {
    let params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const url = queryString ? `${this.apiUrl}/dashboard/stats?${queryString}` : `${this.apiUrl}/dashboard/stats`;
    
    console.log('📡 API Call: GET', url);
    
    return this.http.get<DashboardStats>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Get sales statistics
   */
  getSalesStats(startDate?: string, endDate?: string): Observable<SalesStats> {
    let params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const url = queryString ? `${this.apiUrl}/transactions/stats/sales?${queryString}` : `${this.apiUrl}/transactions/stats/sales`;
    
    return this.http.get<SalesStats>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Get purchase statistics
   */
  getPurchaseStats(startDate?: string, endDate?: string): Observable<PurchaseStats> {
    let params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const url = queryString ? `${this.apiUrl}/transactions/stats/purchases?${queryString}` : `${this.apiUrl}/transactions/stats/purchases`;
    
    return this.http.get<PurchaseStats>(url, { headers: this.getAuthHeaders() });
  }

  // ==================== ALERT SETTINGS APIs ====================

  /**
   * Get alert settings
   */
  getAlertSettings(): Observable<AlertSettings> {
    const url = `${this.apiUrl}/alerts/settings`;
    console.log('📡 API Call: GET', url);
    return this.http.get<AlertSettings>(url, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Update alert settings
   */
  updateAlertSettings(settings: AlertSettings): Observable<AlertSettings> {
    const url = `${this.apiUrl}/alerts/settings`;
    console.log('📡 API Call: PUT', url, settings);
    return this.http.put<AlertSettings>(url, settings, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Get low stock alerts (from API)
   */
  getLowStockAlerts(): Observable<Product[]> {
    const url = `${this.apiUrl}/alerts/low-stock`;
    console.log('📡 API Call: GET', url);
    return this.http.get<Product[]>(url, { 
      headers: this.getAuthHeaders() 
    });
  }

  // ==================== ENTITY/COMPANY APIs ====================

  /**
   * Get all entities (companies) for the admin user
   */
  getAdminEntities(adminEmail: string): Observable<any[]> {
    const url = `${this.businessAccountsApiUrl}?adminEmail=${encodeURIComponent(adminEmail)}`;
    console.log('📡 API Call: GET', url);
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Get business account by company identifier or email
   */
  getBusinessAccount(value: string, key: 'identifier' | 'email' = 'identifier'): Observable<BusinessAccountCheckResponse> {
    const url = `${this.businessAccountsApiUrl}/check-exists?${key}=${encodeURIComponent(value)}`;
    console.log('📡 API Call: GET', url);
    return this.http.get<BusinessAccountCheckResponse>(url, { headers: this.getAuthHeaders() });
  }

  // ==================== MASTER DATA APIs ====================

  /**
   * Get master data by type ID (e.g. 2 for states, 3 for cities)
   */
  getMasterDataByTypeId(typeId: number): Observable<any> {
    const url = `${this.apiUrl}/api/master-data/${typeId}`;
    console.log('📡 API Call: GET', url);
    return this.http.get<any>(url, { headers: this.getAuthHeaders() });
  }
  /**
   * Get master data bulk by type keys (e.g. 'state,city,department,designation')
   */
  getMasterDataBulkByKeys(keys: string): Observable<any> {
    const url = `${this.apiUrl}/api/master-data/bulk?keys=${encodeURIComponent(keys)}`;
    console.log('📡 API Call: GET', url);
    return this.http.get<any>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Get all master data types
   */
  getAllMasterData(): Observable<any> {
    const url = `${this.apiUrl}/api/master-data`;
    console.log('📡 API Call: GET', url);
    return this.http.get<any>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Create a new master data type
   */
  createMasterData(payload: any): Observable<any> {
    const url = `${this.apiUrl}/api/master-data`;
    console.log('📡 API Call: POST', url, payload);
    return this.http.post<any>(url, payload, { headers: this.getAuthHeaders() });
  }

  /**
   * Update master data by ID
   */
  updateMasterData(id: number, payload: any): Observable<any> {
    const url = `${this.apiUrl}/api/master-data/${id}`;
    console.log('📡 API Call: PUT', url, payload);
    return this.http.put<any>(url, payload, { headers: this.getAuthHeaders() });
  }

  /**
   * Soft delete master data by ID
   */
  deleteMasterData(id: number): Observable<any> {
    const url = `${this.apiUrl}/api/master-data/${id}`;
    console.log('📡 API Call: DELETE', url);
    return this.http.delete<any>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Create CRM organisation record
   */
  createOrganisation(payload: any): Observable<any> {
    const url = `${this.apiUrl}/api/organisation`;
    console.log('📡 API Call: POST', url, payload);
    return this.http.post<any>(url, payload, { headers: this.getAuthHeaders() });
  }

  /**
   * Get all CRM organisation records
   */
  getOrganisations(): Observable<any> {
    const url = `${this.apiUrl}/api/organisation`;
    console.log('📡 API Call: GET', url);
    return this.http.get<any>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Get a single CRM organisation record by ID
   */
  getOrganisationById(id: number): Observable<any> {
    const url = `${this.apiUrl}/api/organisation/${id}`;
    console.log('📡 API Call: GET', url);
    return this.http.get<any>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Update a CRM organisation record by ID
   */
  updateOrganisation(id: number, payload: any): Observable<any> {
    const url = `${this.apiUrl}/api/organisation/${id}`;
    console.log('📡 API Call: PUT', url, payload);
    return this.http.put<any>(url, payload, { headers: this.getAuthHeaders() });
  }

  /**
   * Delete a CRM organisation record by ID
   */
  deleteOrganisation(id: number): Observable<any> {
    const url = `${this.apiUrl}/api/organisation/${id}`;
    console.log('📡 API Call: DELETE', url);
    return this.http.delete<any>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Import CRM Organisations from Excel/CSV file
   */
  importOrganisations(file: File): Observable<any> {
    const url = `${this.apiUrl}/api/organisation/import`;
    console.log('📡 API Call: POST (File Upload)', url, file.name);
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(url, formData, { headers: this.getAuthHeadersWithoutContentType() });
  }

  /**
   * Import Products from Excel/CSV file
   */
  importProducts(file: File): Observable<any> {
    const url = `${this.apiUrl}/api/products/import`;
    console.log('📡 API Call: POST (File Upload)', url, file.name);
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(url, formData, { headers: this.getAuthHeadersWithoutContentType() });
  }
}

