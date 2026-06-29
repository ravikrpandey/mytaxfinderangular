import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CRM_MASTER_DATA } from '../master-data-admin/master-data.constants';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

interface CustomerTypeOption {
  id: number;
  list_name: string;
}

interface ContactFormRow {
  contact_name: string;
  dept_id: string;
  designation_id: string;
  contact_email: string;
  telephone_no: string;
  mobile_no: string;
}

interface AddressFormRow {
  address_type: string;
  address_name: string;
  address: string;
  city_id: string;
  postal_code: string;
  contact_person: string;
  address_email: string;
  address_phone: string;
  address_mobile: string;
  is_default: boolean;
  _remarks: string;
}

interface AccountFormRow {
  nominal_code: string;
  tax_code: string;
  currency_id: string;
  price_list: string;
  credit_limit: string;
  settlement_due_days: string;
  settlement_discount_percent: string;
  payment_due: string;
  rebate_duration: string;
  is_account_hold: boolean;
  buying_group: string;
  activity_description: string;
  from_month: string;
  to_month: string;
}

interface OrganisationPayload {
  customer_id: number;
  customer_name: string;
  customer_code: string;
  customer_type_id: number | null;
  tax_registeration_number: string;
  phone_number: string;
  details_email: string;
  website: string;
  balance: number;
  account_manager: string;
  account_open_date: string;
  remarks: string;
  contact_name: string | null;
  dept_id: number | null;
  designation_id: number | null;
  contact_email: string | null;
  telephone_no: string | null;
  mobile_no: string | null;
  address_type: string | null;
  address_name: string | null;
  address: string | null;
  city_id: number | null;
  postal_code: string | null;
  contact_person: string | null;
  address_email: string | null;
  address_phone: string | null;
  address_mobile: string | null;
  is_default: boolean;
  _remarks: string | null;
  nominal_code: string | null;
  tax_code: string | null;
  currency_id: number | null;
  price_list: string | null;
  credit_limit: number | null;
  settlement_due_days: number | null;
  settlement_discount_percent: number | null;
  payment_due: number | null;
  rebate_duration: number | null;
  is_account_hold: boolean;
  buying_group: string | null;
  activity_description: string | null;
  from_month: number | null;
  to_month: number | null;
  status: 'ACTIVE';
  entity_id: number;
  financial_year_id: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  customerType: {
    id: number;
    list_name: string;
  } | null;
  contacts: Array<{
    contact_name: string | null;
    dept_id: number | null;
    designation_id: number | null;
    contact_email: string | null;
    telephone_no: string | null;
    mobile_no: string | null;
  }>;
  addresses: Array<{
    address_type: string | null;
    address_name: string | null;
    address: string | null;
    city_id: number | null;
    postal_code: string | null;
    contact_person: string | null;
    address_email: string | null;
    address_phone: string | null;
    address_mobile: string | null;
    is_default: boolean;
    _remarks: string | null;
  }>;
  accounts: Array<{
    nominal_code: string | null;
    tax_code: string | null;
    currency_id: number | null;
    price_list: string | null;
    credit_limit: number | null;
    settlement_due_days: number | null;
    settlement_discount_percent: number | null;
    payment_due: number | null;
    rebate_duration: number | null;
    is_account_hold: boolean;
    buying_group: string | null;
    activity_description: string | null;
    from_month: number | null;
    to_month: number | null;
  }>;
  customer_type_ids: number[];
  customer_type_names: string;
}

@Component({
  selector: 'app-organisation-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organisation-create.component.html',
  styleUrl: './organisation-create.component.scss'
})
export class OrganisationCreateComponent implements OnInit {
  customerTypeOptions: CustomerTypeOption[] = CRM_MASTER_DATA.customerTypes.map((type) => ({
    id: type.id,
    list_name: type.name
  }));

  addressTypeOptions: string[] = [];
  departmentOptions: Array<{ id: number; label: string }> = [];
  designationOptions: Array<{ id: number; label: string }> = [];
  cityOptions: Array<{ id: number; label: string; parent_id?: number }> = [];

  currencyOptions = CRM_MASTER_DATA.currencies;
  taxCodeOptions = CRM_MASTER_DATA.taxCodes;
  priceListOptions = CRM_MASTER_DATA.priceLists;

  model = {
    code: '',
    name: '',
    taxNo: '',
    phone: '',
    email: '',
    website: '',
    balance: 0,
    accountOpenDate: new Date().toISOString().split('T')[0],
    remarks: ''
  };

  selectedCustomerTypeIds: number[] = [37];
  contacts: ContactFormRow[] = [this.createEmptyContact()];
  addresses: AddressFormRow[] = [this.createEmptyAddress()];
  accounts: AccountFormRow[] = [this.createEmptyAccount()];
  payloadPreview: OrganisationPayload | null = null;

  isEditMode = false;
  isPreviewMode = false;
  organisationId: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadMasterData();

    // Determine edit or preview mode from path and parameters
    const idParam = this.route.snapshot.paramMap.get('id');
    const url = this.router.url;

    if (idParam) {
      this.organisationId = parseInt(idParam, 10);
      if (url.includes('/preview/')) {
        this.isPreviewMode = true;
      } else {
        this.isEditMode = true;
      }
      this.loadOrganisationData(this.organisationId);
    } else {
      this.model.code = this.generateRandomCode();
    }
  }

  loadOrganisationData(id: number): void {
    this.apiService.getOrganisationById(id).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const org = res.data;
          this.model = {
            code: org.customer_code,
            name: org.customer_name,
            taxNo: org.tax_registeration_number || '',
            phone: org.phone_number || '',
            email: org.details_email || '',
            website: org.website || '',
            balance: Number(org.balance) || 0,
            accountOpenDate: org.account_open_date ? org.account_open_date.split('T')[0] : new Date().toISOString().split('T')[0],
            remarks: org.remarks || ''
          };

          if (org.customer_type_ids && org.customer_type_ids.length > 0) {
            this.selectedCustomerTypeIds = org.customer_type_ids;
          } else if (org.customer_type_id) {
            this.selectedCustomerTypeIds = [org.customer_type_id];
          }

          if (org.contacts && org.contacts.length > 0) {
            this.contacts = org.contacts.map((c: any) => ({
              contact_name: c.contact_name || '',
              dept_id: c.dept_id ? String(c.dept_id) : '',
              designation_id: c.designation_id ? String(c.designation_id) : '',
              contact_email: c.contact_email || '',
              telephone_no: c.telephone_no || '',
              mobile_no: c.mobile_no || ''
            }));
          }

          if (org.addresses && org.addresses.length > 0) {
            this.addresses = org.addresses.map((a: any) => ({
              address_type: a.address_type || 'POSTAL ADDRESS',
              address_name: a.address_name || '',
              address: a.address || '',
              city_id: a.city_id ? String(a.city_id) : '',
              postal_code: a.postal_code || '',
              contact_person: a.contact_person || '',
              address_email: a.address_email || '',
              address_phone: a.address_phone || '',
              address_mobile: a.address_mobile || '',
              is_default: !!a.is_default,
              _remarks: a._remarks || ''
            }));
          }

          if (org.accounts && org.accounts.length > 0) {
            this.accounts = org.accounts.map((acc: any) => ({
              nominal_code: acc.nominal_code || '',
              tax_code: acc.tax_code ? String(acc.tax_code) : '',
              currency_id: acc.currency_id ? String(acc.currency_id) : '',
              price_list: acc.price_list || '',
              credit_limit: acc.credit_limit || '',
              settlement_due_days: acc.settlement_due_days || '',
              settlement_discount_percent: acc.settlement_discount_percent || '',
              payment_due: acc.payment_due || '',
              rebate_duration: acc.rebate_duration || '',
              is_account_hold: !!acc.is_account_hold,
              buying_group: acc.buying_group || '',
              activity_description: acc.activity_description || '',
              from_month: acc.from_month || '',
              to_month: acc.to_month || ''
            }));
          }
        }
      },
      error: (err) => {
        console.error('Failed to load organisation data:', err);
        this.toastService.error('Failed to load Organisation data from backend.');
      }
    });
  }

  generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ORG-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  loadMasterData(): void {
    this.apiService.getMasterDataBulkByKeys('department,designation,city,address_type').subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const deptData = res.data.find((item: any) => item.master_type_key === 'department');
          if (deptData) {
            this.departmentOptions = deptData.data;
          }

          const desData = res.data.find((item: any) => item.master_type_key === 'designation');
          if (desData) {
            this.designationOptions = desData.data;
          }

          const cityData = res.data.find((item: any) => item.master_type_key === 'city');
          if (cityData) {
            this.cityOptions = cityData.data;
          }

          const addressTypeData = res.data.find((item: any) => item.master_type_key === 'address_type');
          if (addressTypeData) {
            this.addressTypeOptions = addressTypeData.data.map((item: any) => item.label.toUpperCase());
          }
        }
      },
      error: (err) => {
        console.error('Failed to load master data from API, using static fallbacks', err);
        this.departmentOptions = CRM_MASTER_DATA.departments.map((d) => ({ id: d.id, label: d.name }));
        this.designationOptions = CRM_MASTER_DATA.designations.map((d) => ({ id: d.id, label: d.name }));
        this.cityOptions = CRM_MASTER_DATA.cities.map((c) => ({ id: c.id, label: c.name }));
        this.addressTypeOptions = CRM_MASTER_DATA.addressTypes.map((a) => a.name);
      }
    });
  }

  backToListing(): void {
    this.router.navigate(['/crm/organisation']);
  }

  isCustomerTypeSelected(typeId: number): boolean {
    return this.selectedCustomerTypeIds.includes(typeId);
  }

  toggleCustomerType(typeId: number, checked: boolean): void {
    if (checked) {
      if (!this.selectedCustomerTypeIds.includes(typeId)) {
        this.selectedCustomerTypeIds = [...this.selectedCustomerTypeIds, typeId];
      }
      return;
    }

    this.selectedCustomerTypeIds = this.selectedCustomerTypeIds.filter((id) => id !== typeId);

    if (this.selectedCustomerTypeIds.length === 0) {
      this.selectedCustomerTypeIds = [37];
    }
  }

  createEmptyContact(): ContactFormRow {
    return {
      contact_name: '',
      dept_id: '',
      designation_id: '',
      contact_email: '',
      telephone_no: '',
      mobile_no: ''
    };
  }

  createEmptyAddress(): AddressFormRow {
    return {
      address_type: '',
      address_name: '',
      address: '',
      city_id: '',
      postal_code: '',
      contact_person: '',
      address_email: '',
      address_phone: '',
      address_mobile: '',
      is_default: false,
      _remarks: ''
    };
  }

  createEmptyAccount(): AccountFormRow {
    return {
      nominal_code: '',
      tax_code: '',
      currency_id: '',
      price_list: '',
      credit_limit: '',
      settlement_due_days: '',
      settlement_discount_percent: '',
      payment_due: '',
      rebate_duration: '',
      is_account_hold: false,
      buying_group: '',
      activity_description: '',
      from_month: '',
      to_month: ''
    };
  }

  addContact(): void {
    this.contacts = [...this.contacts, this.createEmptyContact()];
  }

  removeContact(index: number): void {
    this.contacts = this.contacts.filter((_, i) => i !== index);
    if (this.contacts.length === 0) {
      this.contacts = [this.createEmptyContact()];
    }
  }

  addAddress(): void {
    this.addresses = [...this.addresses, this.createEmptyAddress()];
  }

  removeAddress(index: number): void {
    this.addresses = this.addresses.filter((_, i) => i !== index);
    if (this.addresses.length === 0) {
      this.addresses = [this.createEmptyAddress()];
    }
  }

  addAccount(): void {
    this.accounts = [...this.accounts, this.createEmptyAccount()];
  }

  removeAccount(index: number): void {
    this.accounts = this.accounts.filter((_, i) => i !== index);
    if (this.accounts.length === 0) {
      this.accounts = [this.createEmptyAccount()];
    }
  }

  private parseNullableNumber(value: string): number | null {
    if (value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toNullableString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private buildPayload(): OrganisationPayload {
    const now = new Date().toISOString();
    const selectedTypes = this.customerTypeOptions.filter((type) =>
      this.selectedCustomerTypeIds.includes(type.id)
    );
    const primaryType = selectedTypes[0] ?? null;
    const contacts = this.contacts
      .map((row) => ({
        contact_name: this.toNullableString(row.contact_name),
        dept_id: this.parseNullableNumber(row.dept_id),
        designation_id: this.parseNullableNumber(row.designation_id),
        contact_email: this.toNullableString(row.contact_email),
        telephone_no: this.toNullableString(row.telephone_no),
        mobile_no: this.toNullableString(row.mobile_no)
      }))
      .filter((row) => Object.values(row).some((value) => value !== null));

    const addresses = this.addresses
      .map((row) => ({
        address_type: this.toNullableString(row.address_type),
        address_name: this.toNullableString(row.address_name),
        address: this.toNullableString(row.address),
        city_id: this.parseNullableNumber(row.city_id),
        postal_code: this.toNullableString(row.postal_code),
        contact_person: this.toNullableString(row.contact_person),
        address_email: this.toNullableString(row.address_email),
        address_phone: this.toNullableString(row.address_phone),
        address_mobile: this.toNullableString(row.address_mobile),
        is_default: row.is_default,
        _remarks: this.toNullableString(row._remarks)
      }))
      .filter((row) =>
        Object.entries(row).some(([key, value]) => {
          if (key === 'is_default') {
            return value === true;
          }
          return value !== null;
        })
      );

    const accounts = this.accounts
      .map((row) => ({
        nominal_code: this.toNullableString(row.nominal_code),
        tax_code: this.toNullableString(row.tax_code),
        currency_id: this.parseNullableNumber(row.currency_id),
        price_list: this.toNullableString(row.price_list),
        credit_limit: this.parseNullableNumber(row.credit_limit),
        settlement_due_days: this.parseNullableNumber(row.settlement_due_days),
        settlement_discount_percent: this.parseNullableNumber(row.settlement_discount_percent),
        payment_due: this.parseNullableNumber(row.payment_due),
        rebate_duration: this.parseNullableNumber(row.rebate_duration),
        is_account_hold: row.is_account_hold,
        buying_group: this.toNullableString(row.buying_group),
        activity_description: this.toNullableString(row.activity_description),
        from_month: this.parseNullableNumber(row.from_month),
        to_month: this.parseNullableNumber(row.to_month)
      }))
      .filter((row) =>
        Object.entries(row).some(([key, value]) => {
          if (key === 'is_account_hold') {
            return value === true;
          }
          return value !== null;
        })
      );

    const primaryContact = contacts[0] ?? null;
    const primaryAddress = addresses[0] ?? null;
    const primaryAccount = accounts[0] ?? null;

    return {
      customer_id: 0,
      customer_name: this.model.name.trim(),
      customer_code: this.model.code.trim(),
      customer_type_id: primaryType?.id ?? null,
      tax_registeration_number: this.model.taxNo.trim(),
      phone_number: this.model.phone.trim(),
      details_email: this.model.email.trim(),
      website: this.model.website.trim(),
      balance: Number(this.model.balance) || 0,
      account_manager: '0',
      account_open_date: new Date(this.model.accountOpenDate).toISOString(),
      remarks: this.model.remarks,
      contact_name: primaryContact?.contact_name ?? null,
      dept_id: primaryContact?.dept_id ?? null,
      designation_id: primaryContact?.designation_id ?? null,
      contact_email: primaryContact?.contact_email ?? null,
      telephone_no: primaryContact?.telephone_no ?? null,
      mobile_no: primaryContact?.mobile_no ?? null,
      address_type: primaryAddress?.address_type ?? null,
      address_name: primaryAddress?.address_name ?? null,
      address: primaryAddress?.address ?? null,
      city_id: primaryAddress?.city_id ?? null,
      postal_code: primaryAddress?.postal_code ?? null,
      contact_person: primaryAddress?.contact_person ?? null,
      address_email: primaryAddress?.address_email ?? null,
      address_phone: primaryAddress?.address_phone ?? null,
      address_mobile: primaryAddress?.address_mobile ?? null,
      is_default: primaryAddress?.is_default ?? false,
      _remarks: primaryAddress?._remarks ?? null,
      nominal_code: primaryAccount?.nominal_code ?? null,
      tax_code: primaryAccount?.tax_code ?? null,
      currency_id: primaryAccount?.currency_id ?? null,
      price_list: primaryAccount?.price_list ?? null,
      credit_limit: primaryAccount?.credit_limit ?? null,
      settlement_due_days: primaryAccount?.settlement_due_days ?? null,
      settlement_discount_percent: primaryAccount?.settlement_discount_percent ?? null,
      payment_due: primaryAccount?.payment_due ?? null,
      rebate_duration: primaryAccount?.rebate_duration ?? null,
      is_account_hold: primaryAccount?.is_account_hold ?? false,
      buying_group: primaryAccount?.buying_group ?? null,
      activity_description: primaryAccount?.activity_description ?? null,
      from_month: primaryAccount?.from_month ?? null,
      to_month: primaryAccount?.to_month ?? null,
      status: 'ACTIVE',
      entity_id: 1,
      financial_year_id: 22,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      createdBy: 1,
      updatedBy: 1,
      customerType: primaryType
        ? {
            id: primaryType.id,
            list_name: primaryType.list_name
          }
        : null,
      contacts,
      addresses,
      accounts,
      customer_type_ids: selectedTypes.map((type) => type.id),
      customer_type_names: selectedTypes.map((type) => type.list_name).join(', ')
    };
  }

  formSubmitted = false;

  isValidEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  }

  isValidPhone(phone: string): boolean {
    const re = /^[0-9]+$/;
    return re.test(phone);
  }

  validateDynamicRows(): boolean {
    // Validate Contacts
    for (let i = 0; i < this.contacts.length; i++) {
      const c = this.contacts[i];
      if (!c.contact_name?.trim()) {
        this.toastService.warning(`Contact #${i + 1}: Contact Name is required.`);
        return false;
      }
      if (c.contact_email && !this.isValidEmail(c.contact_email)) {
        this.toastService.warning(`Contact #${i + 1}: Please enter a valid email.`);
        return false;
      }
      if (c.mobile_no && !this.isValidPhone(c.mobile_no)) {
        this.toastService.warning(`Contact #${i + 1}: Please enter a valid mobile number.`);
        return false;
      }
    }

    // Validate Addresses
    for (let i = 0; i < this.addresses.length; i++) {
      const a = this.addresses[i];
      if (!a.address_type) {
        this.toastService.warning(`Address #${i + 1}: Address Type is required.`);
        return false;
      }
      if (!a.address_name?.trim()) {
        this.toastService.warning(`Address #${i + 1}: Address Name is required.`);
        return false;
      }
      if (!a.address?.trim()) {
        this.toastService.warning(`Address #${i + 1}: Address is required.`);
        return false;
      }
      if (!a.city_id) {
        this.toastService.warning(`Address #${i + 1}: City is required.`);
        return false;
      }
      if (!a.postal_code?.trim()) {
        this.toastService.warning(`Address #${i + 1}: Postal Code is required.`);
        return false;
      }
      const digitsOnly = /^[0-9]+$/;
      if (!digitsOnly.test(a.postal_code)) {
        this.toastService.warning(`Address #${i + 1}: Postal Code must contain only digits.`);
        return false;
      }

      if (a.address_email && !this.isValidEmail(a.address_email)) {
        this.toastService.warning(`Address #${i + 1}: Please enter a valid email.`);
        return false;
      }
      if (a.address_mobile && !this.isValidPhone(a.address_mobile)) {
        this.toastService.warning(`Address #${i + 1}: Please enter a valid mobile number.`);
        return false;
      }
    }

    // Validate Accounts
    for (let i = 0; i < this.accounts.length; i++) {
      const acc = this.accounts[i];
      if (!acc.nominal_code?.trim()) {
        this.toastService.warning(`Account #${i + 1}: Nominal Code is required.`);
        return false;
      }
      if (!acc.tax_code) {
        this.toastService.warning(`Account #${i + 1}: Tax Code is required.`);
        return false;
      }
      if (!acc.currency_id) {
        this.toastService.warning(`Account #${i + 1}: Currency is required.`);
        return false;
      }
      if (!acc.price_list) {
        this.toastService.warning(`Account #${i + 1}: Price List is required.`);
        return false;
      }
      if (acc.credit_limit !== '' && Number(acc.credit_limit) < 0) {
        this.toastService.warning(`Account #${i + 1}: Credit Limit must be 0 or greater.`);
        return false;
      }
    }

    return true;
  }

  save(form?: any): void {
    this.formSubmitted = true;

    if (this.selectedCustomerTypeIds.length === 0) {
      this.toastService.warning('Please select at least one Customer Type.');
      return;
    }

    if (form && form.invalid) {
      this.toastService.warning('Please fill in all required fields correctly.');
      return;
    }

    if (!this.validateDynamicRows()) {
      return;
    }

    const payload = this.buildPayload();
    this.payloadPreview = payload;
    console.log('CRM Organisation Save Payload:', payload);

    if (this.isEditMode && this.organisationId) {
      this.apiService.updateOrganisation(this.organisationId, payload).subscribe({
        next: (res) => {
          this.toastService.success('Organisation updated successfully');
          this.backToListing();
        },
        error: (err) => {
          console.error('Failed to update organisation:', err);
          this.toastService.error('Failed to update Organisation: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.apiService.createOrganisation(payload).subscribe({
        next: (res) => {
          this.toastService.success('Organisation created successfully');
          this.backToListing();
        },
        error: (err) => {
          console.error('Failed to save organisation:', err);
          this.toastService.error('Failed to save Organisation: ' + (err.error?.message || err.message));
        }
      });
    }
  }
}
