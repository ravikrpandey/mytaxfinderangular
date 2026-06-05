import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { InvoiceCreateRequest, InvoiceService } from '../services/invoice.service';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

export interface InvoiceItem {
  description: string;
  hsnCode: string;
  qty: number;
  rate: number;
  gstPercentage: '0' | '5' | '12' | '18' | '28';
  amount: number;
}

export interface InvoiceForm {
  invoiceNumber: string;
  invoiceDate: string;
  placeOfSupply: string;
  customerName: string;
  customerGSTIN: string;
  customerAddress: string;
  items: InvoiceItem[];
}

export interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

interface ItemErrors {
  description?: string;
  hsnCode?: string;
  qty?: string;
  rate?: string;
  gstPercentage?: string;
}

interface FormErrors {
  invoiceNumber?: string;
  invoiceDate?: string;
  placeOfSupply?: string;
  customerName?: string;
  customerGSTIN?: string;
  customerAddress?: string;
  itemsGeneral?: string;
  items?: ItemErrors[];
}

type FieldErrorKey = keyof Omit<FormErrors, 'items'>;

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-create.component.html',
  styleUrl: './invoice-create.component.scss'
})
export class InvoiceCreateComponent implements OnInit {
  invoiceForm = signal<InvoiceForm>({
    invoiceNumber: '',
    invoiceDate: '',
    placeOfSupply: '',
    customerName: '',
    customerGSTIN: '',
    customerAddress: '',
    items: []
  });

  states = [
    { code: '01', name: 'Jammu and Kashmir' },
    { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },
    { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },
    { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },
    { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' },
    { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' },
    { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },
    { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
    { code: '27', name: 'Maharashtra' },
    { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' },
    { code: '31', name: 'Lakshadweep' },
    { code: '32', name: 'Kerala' },
    { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' },
    { code: '35', name: 'Andaman and Nicobar Islands' },
    { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh' }
  ];

  gstRates = ['0', '5', '12', '18', '28'] as const;

  taxableAmount = signal(0);
  cgst = signal(0);
  sgst = signal(0);
  igst = signal(0);
  totalAmount = signal(0);
  freight = signal(0);
  showPreview = signal(false);
  isSaving = signal(false);
  saveError = signal('');
  editingInvoiceId = signal<number | null>(null);
  viewMode = signal(false);
  previewOnLoad = signal(false);
  formErrors = signal<FormErrors>({ items: [] });
  loggedInUserStateCode = signal('');

  companyDetails = signal<CompanyDetails>({
    name: 'ROCK ROLLERS INNOVATION',
    address: '1/1915 05/7, Ram Nagar',
    city: 'Shahdara, Delhi',
    state: 'Delhi',
    pincode: '110032',
    gstin: '07CCVPP60733HZZ',
    email: 'rdb.rockrollers@gmail.com',
    phone: '+91-7217809247, +91-9560757207',
    bankName: 'Punjab National Bank',
    accountNumber: '03250021007313119',
    ifscCode: 'PUNB0323500'
  });

  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private invoiceService: InvoiceService,
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadLoggedInUserStateCode();
    this.loadLoggedInUserCompanyDetails();

    // Set today's date (used for new invoices)
    const today = new Date();
    this.updateField('invoiceDate', today.toISOString().split('T')[0]);

    // Check if editing existing invoice
    this.route.queryParams.subscribe(params => {
      const mode = params['mode'];
      this.viewMode.set(mode === 'view');
      const preview = params['preview'];
      this.previewOnLoad.set(preview === '1' || preview === 'true');

      if (params['id']) {
        this.loadInvoice(Number(params['id']));
        return;
      }

      // Use backend to generate invoice number for new invoices
      this.invoiceService.generateInvoiceNumber().subscribe({
        next: (response) => {
          this.updateField('invoiceNumber', response.invoiceNumber);
        },
        error: () => {
          // Fallback to client-side generation
          const fallbackDate = new Date();
          const year = fallbackDate.getFullYear();
          const count = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
          this.updateField('invoiceNumber', `INV-${year}-${count}`);
        }
      });
    });
  }

  loadInvoice(id: number): void {
    this.editingInvoiceId.set(id);
    this.invoiceService.getInvoiceById(id).subscribe({
      next: (invoice) => {
        this.invoiceForm.set({
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          placeOfSupply: invoice.placeOfSupply,
          customerName: invoice.customerName,
          customerGSTIN: invoice.customerGSTIN,
          customerAddress: invoice.customerAddress,
          items: invoice.items
        });
        this.taxableAmount.set(invoice.taxableAmount);
        this.cgst.set(invoice.cgst);
        this.sgst.set(invoice.sgst);
        this.igst.set(invoice.igst);
        this.totalAmount.set(invoice.totalAmount);
        this.freight.set(invoice.freight);

        if (this.previewOnLoad()) {
          this.showPreview.set(true);
        }
      },
      error: (err) => {
        console.error('Failed to load invoice:', err);
        this.saveError.set('Failed to load invoice data');
      }
    });
  }

  updateField(field: keyof InvoiceForm, value: any): void {
    this.invoiceForm.update(form => ({
      ...form,
      [field]: value
    }));
    if (field !== 'items') {
      this.clearFieldError(field);
    }
  }

  addItem(): void {
    const newItem: InvoiceItem = {
      description: '',
      hsnCode: '',
      qty: 0,
      rate: 0,
      gstPercentage: '18',
      amount: 0
    };
    
    this.invoiceForm.update(form => ({
      ...form,
      items: [...form.items, newItem]
    }));
    this.clearFieldError('itemsGeneral');
    this.formErrors.update(current => ({
      ...current,
      items: [...(current.items ?? []), {}]
    }));
  }

  removeItem(index: number): void {
    this.invoiceForm.update(form => ({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    }));
    this.formErrors.update(current => ({
      ...current,
      items: (current.items ?? []).filter((_, i) => i !== index)
    }));
    this.calculateTotals();
  }

  updateItem(index: number, field: keyof InvoiceItem, value: any): void {
    this.invoiceForm.update(form => {
      const updatedItems = [...form.items];
      const nextValue = field === 'hsnCode'
        ? String(value ?? '').replace(/\D/g, '')
        : value;
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: nextValue
      };
      
      // Calculate amount for this item
      if (field === 'qty' || field === 'rate') {
        updatedItems[index].amount = updatedItems[index].qty * updatedItems[index].rate;
      }
      
      return {
        ...form,
        items: updatedItems
      };
    });

    if (field !== 'amount') {
      this.clearItemError(index, field as keyof ItemErrors);
    }
    
    this.calculateTotals();
  }

  onNumericKeydown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End'
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onNumericPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';
    if (!/^\d+$/.test(pastedText)) {
      event.preventDefault();
    }
  }

  getFieldError(field: FieldErrorKey): string {
    return this.formErrors()[field] || '';
  }

  hasFieldError(field: FieldErrorKey): boolean {
    return !!this.getFieldError(field);
  }

  getItemError(index: number, field: keyof ItemErrors): string {
    const items = this.formErrors().items ?? [];
    return items[index]?.[field] || '';
  }

  hasItemError(index: number, field: keyof ItemErrors): boolean {
    return !!this.getItemError(index, field);
  }

  private setFieldError(field: FieldErrorKey, message: string): void {
    this.formErrors.update(current => ({
      ...current,
      [field]: message
    }));
  }

  private clearFieldError(field: FieldErrorKey): void {
    this.formErrors.update(current => ({
      ...current,
      [field]: undefined
    }));
  }

  private setItemError(index: number, field: keyof ItemErrors, message: string): void {
    this.formErrors.update(current => {
      const items = [...(current.items ?? [])];
      while (items.length <= index) {
        items.push({});
      }
      items[index] = {
        ...items[index],
        [field]: message
      };
      return {
        ...current,
        items
      };
    });
  }

  private clearItemError(index: number, field: keyof ItemErrors): void {
    this.formErrors.update(current => {
      const items = [...(current.items ?? [])];
      if (!items[index]) {
        return current;
      }
      items[index] = {
        ...items[index],
        [field]: undefined
      };
      return {
        ...current,
        items
      };
    });
  }

  private loadLoggedInUserStateCode(): void {
    const identifier = this.authService.currentUser()?.email?.trim();

    if (!identifier) {
      this.setFallbackSellerStateCode();
      return;
    }

    this.apiService.checkBusinessAccountExists(identifier, 'email').subscribe({
      next: (response) => {
        const stateName = response.data?.state?.trim() ?? '';
        if (stateName) {
          const stateCode = this.getStateCodeFromName(stateName);
          if (stateCode) {
            this.loggedInUserStateCode.set(stateCode);
            this.calculateTotals();
            return;
          }
        }

        this.setFallbackSellerStateCode();
      },
      error: () => {
        this.setFallbackSellerStateCode();
      }
    });
  }

  private setFallbackSellerStateCode(): void {
    const fallbackStateCode = this.getStateCodeFromName(this.companyDetails().state);
    this.loggedInUserStateCode.set(fallbackStateCode);
    this.calculateTotals();
  }

  private loadLoggedInUserCompanyDetails(): void {
    const userEmail = this.authService.currentUser()?.email?.trim();

    if (!userEmail) {
      return;
    }

    this.apiService.checkBusinessAccountExists(userEmail, 'email').subscribe({
      next: (response) => {
        if (response.exists && response.data) {
          const data = response.data;
          this.companyDetails.set({
            name: data.companyName || this.companyDetails().name,
            address: `${data.addressLine1}${data.addressLine2 ? ', ' + data.addressLine2 : ''}`,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            gstin: data.gstin || this.companyDetails().gstin,
            email: data.email || this.companyDetails().email,
            phone: this.companyDetails().phone,
            bankName: this.companyDetails().bankName,
            accountNumber: this.companyDetails().accountNumber,
            ifscCode: this.companyDetails().ifscCode
          });
        }
      },
      error: () => {
        // Fallback to default company details on API error
      }
    });
  }

  private getStateCodeFromName(stateName: string): string {
    const normalizedStateName = stateName.trim().toLowerCase();
    const state = this.states.find(item => item.name.toLowerCase() === normalizedStateName);
    return state?.code ?? '';
  }

  private getPlaceOfSupplyCode(): string {
    return this.invoiceForm().placeOfSupply.split(' - ')[0]?.trim() ?? '';
  }

  private getCustomerGstinStateCode(): string {
    const gstin = this.invoiceForm().customerGSTIN.trim().toUpperCase();
    return gstin.length >= 2 ? gstin.substring(0, 2) : '';
  }

  calculateTotals(): void {
    const items = this.invoiceForm().items;
    const taxable = items.reduce((sum, item) => sum + item.amount, 0);
    this.taxableAmount.set(taxable);

    const placeCode = this.getPlaceOfSupplyCode();
    const loggedInStateCode = this.loggedInUserStateCode();
    const gstinStateCode = this.getCustomerGstinStateCode();

    // Prefer logged-in user's state vs invoice place of supply comparison.
    // Fallback to customer GSTIN state comparison only when user state is unavailable.
    const isInterState = placeCode && loggedInStateCode
      ? placeCode !== loggedInStateCode
      : placeCode && gstinStateCode
        ? placeCode !== gstinStateCode
        : false;

    const totalTax = items.reduce((sum, item) => {
      return sum + (item.amount * Number(item.gstPercentage) / 100);
    }, 0);

    if (isInterState) {
      this.igst.set(totalTax);
      this.cgst.set(0);
      this.sgst.set(0);
    } else {
      const halfTax = totalTax / 2;
      this.cgst.set(halfTax);
      this.sgst.set(halfTax);
      this.igst.set(0);
    }

    this.totalAmount.set(taxable + totalTax);
  }

  preview(): void {
    if (!this.validateForm()) {
      return;
    }
    this.showPreview.set(true);
  }

  closePreview(): void {
    this.showPreview.set(false);
  }

  printInvoice(): void {
    window.print();
  }

  saveInvoice(): void {
    if (this.viewMode()) {
      return;
    }

    if (!this.validateForm()) {
      return;
    }
    
    this.isSaving.set(true);
    this.saveError.set('');

    const payload: InvoiceCreateRequest = {
      ...this.invoiceForm(),
      taxableAmount: this.taxableAmount(),
      cgst: this.cgst(),
      sgst: this.sgst(),
      igst: this.igst(),
      totalAmount: this.totalAmount(),
      freight: this.freight()
    };

    const invoiceId = this.editingInvoiceId();
    const request$ = invoiceId
      ? this.invoiceService.updateInvoice(invoiceId, payload)
      : this.invoiceService.createInvoice(payload);

    request$.subscribe({
      next: (response) => {
        this.isSaving.set(false);
        console.log('Invoice saved successfully:', response);
        this.toastService.success(invoiceId ? 'Invoice updated successfully!' : 'Invoice saved successfully!');
        this.router.navigate(['/invoices']);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Failed to save invoice:', err);
        
        // Extract detailed error message
        let errorMessage = 'Failed to save invoice. Please try again.';
        
        if (err.error?.error) {
          errorMessage = err.error.error;
          
          // If there are validation details, show the first few
          if (err.error.details && Array.isArray(err.error.details) && err.error.details.length > 0) {
            const firstError = err.error.details[0];
            errorMessage = `${firstError.field}: ${firstError.message}`;
          }
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        this.saveError.set(errorMessage);
        this.toastService.error(errorMessage, 5000);
      }
    });
  }

  print(): void {
    if (!this.validateForm()) {
      return;
    }
    this.showPreview.set(true);
    setTimeout(() => {
      window.print();
    }, 100);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getAmountInWords(): string {
    return this.numberToWords(Math.round(this.totalAmount())) + ' Rupees Only';
  }

  numberToWords(num: number): string {
    if (num === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    const convertHundreds = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '');
    };
    
    if (num < 1000) return convertHundreds(num);
    if (num < 100000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      return convertHundreds(thousands) + ' Thousand' + (remainder !== 0 ? ' ' + convertHundreds(remainder) : '');
    }
    if (num < 10000000) {
      const lakhs = Math.floor(num / 100000);
      let remainder = num % 100000;
      let result = convertHundreds(lakhs) + ' Lakh';
      if (remainder >= 1000) {
        const thousands = Math.floor(remainder / 1000);
        result += ' ' + convertHundreds(thousands) + ' Thousand';
        remainder = remainder % 1000;
      }
      if (remainder !== 0) result += ' ' + convertHundreds(remainder);
      return result;
    }
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    let result = convertHundreds(crores) + ' Crore';
    if (remainder >= 100000) {
      const lakhs = Math.floor(remainder / 100000);
      result += ' ' + convertHundreds(lakhs) + ' Lakh';
      const rem = remainder % 100000;
      if (rem >= 1000) {
        const thousands = Math.floor(rem / 1000);
        result += ' ' + convertHundreds(thousands) + ' Thousand';
      }
      if (rem % 1000 !== 0) result += ' ' + convertHundreds(rem % 1000);
    } else if (remainder !== 0) {
      result += ' ' + this.numberToWords(remainder);
    }
    return result;
  }

  validateForm(): boolean {
    const form = this.invoiceForm();

    const errors: FormErrors = { items: [] };
    let hasError = false;

    if (!form.invoiceNumber) {
      errors.invoiceNumber = 'Invoice number is required.';
      hasError = true;
    }
    if (!form.invoiceDate) {
      errors.invoiceDate = 'Invoice date is required.';
      hasError = true;
    }
    if (!form.placeOfSupply) {
      errors.placeOfSupply = 'Place of supply is required.';
      hasError = true;
    }

    if (!form.customerName) {
      errors.customerName = 'Customer name is required.';
      hasError = true;
    }

    const gstin = form.customerGSTIN.trim().toUpperCase();
    if (gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstin)) {
        errors.customerGSTIN = 'Invalid GSTIN format.';
        hasError = true;
      }
    }

    if (form.items.length === 0) {
      errors.itemsGeneral = 'Add at least one item.';
      hasError = true;
    }

    form.items.forEach((item, index) => {
      const itemErrors: ItemErrors = {};
      if (!item.description) {
        itemErrors.description = 'Description is required.';
      }
      if (!item.hsnCode) {
        itemErrors.hsnCode = 'HSN/SAC is required.';
      } else if (!/^\d+$/.test(item.hsnCode)) {
        itemErrors.hsnCode = 'HSN/SAC must contain numbers only.';
      }
      if (item.qty <= 0) {
        itemErrors.qty = 'Qty must be greater than 0.';
      }
      if (item.rate <= 0) {
        itemErrors.rate = 'Rate must be greater than 0.';
      }
      if (!item.gstPercentage) {
        itemErrors.gstPercentage = 'GST % is required.';
      }

      if (Object.keys(itemErrors).length > 0) {
        (errors.items as ItemErrors[])[index] = itemErrors;
        hasError = true;
      }
    });

    this.formErrors.set(errors);

    if (hasError) {
      this.toastService.error('Please fix the highlighted fields.');
      return false;
    }

    return true;
  }

  navigateToList(): void {
    this.router.navigate(['/invoices']);
  }

  navigateToWelcome(): void {
    this.router.navigate(['/welcome']);
  }

  getEmptyRows(): number[] {
    const itemCount = this.invoiceForm().items.length;
    const minRows = 5;
    const emptyRowsNeeded = Math.max(0, minRows - itemCount);
    return Array(emptyRowsNeeded).fill(0);
  }

  getGstRate(): number {
    const items = this.invoiceForm().items;
    if (items.length > 0) {
      return Number(items[0].gstPercentage);
    }
    return 18;
  }
}
