export interface MasterDataItem {
  id: number;
  name: string;
  code?: string;
}

export interface CrmMasterData {
  customerTypes: MasterDataItem[];
  departments: MasterDataItem[];
  designations: MasterDataItem[];
  addressTypes: MasterDataItem[];
  accountManagers: MasterDataItem[];
  currencies: MasterDataItem[];
  taxCodes: MasterDataItem[];
  priceLists: MasterDataItem[];
  cities: MasterDataItem[];
  statuses: string[];
}

export const CRM_MASTER_DATA: CrmMasterData = {
  customerTypes: [
    { id: 37, name: 'CUSTOMER' },
    { id: 38, name: 'SUPPLIER' },
    { id: 39, name: 'MANUFACTURER' }
  ],
  departments: [
    { id: 1, name: 'SALES', code: 'SAL' },
    { id: 2, name: 'PURCHASE', code: 'PUR' },
    { id: 3, name: 'FINANCE', code: 'FIN' },
    { id: 4, name: 'OPERATIONS', code: 'OPS' },
    { id: 5, name: 'ADMINISTRATION', code: 'ADM' },
    { id: 6, name: 'LOGISTICS', code: 'LOG' }
  ],
  designations: [
    { id: 1, name: 'OWNER' },
    { id: 2, name: 'DIRECTOR' },
    { id: 3, name: 'ACCOUNT MANAGER' },
    { id: 4, name: 'PROCUREMENT EXECUTIVE' },
    { id: 5, name: 'SALES EXECUTIVE' },
    { id: 6, name: 'ACCOUNTANT' },
    { id: 7, name: 'COORDINATOR' }
  ],
  addressTypes: [
    { id: 1, name: 'BILLING' },
    { id: 2, name: 'SHIPPING' },
    { id: 3, name: 'REGISTERED OFFICE' },
    { id: 4, name: 'HEAD OFFICE' },
    { id: 5, name: 'BRANCH OFFICE' },
    { id: 6, name: 'WAREHOUSE' },
    { id: 7, name: 'SITE OFFICE' },
    { id: 8, name: 'CORRESPONDENCE' },
    { id: 9, name: 'COMMUNICATION' },
    { id: 10, name: 'REMITTANCE' },
    { id: 11, name: 'RESIDENTIAL' },
    { id: 12, name: 'OTHER' }
  ],
  accountManagers: [
    { id: 0, name: 'UNASSIGNED' },
    { id: 1, name: 'SYSTEM ADMIN' },
    { id: 2, name: 'SALES MANAGER' },
    { id: 3, name: 'CRM EXECUTIVE' }
  ],
  currencies: [
    { id: 1, name: 'INR', code: 'INR' },
    { id: 2, name: 'USD', code: 'USD' },
    { id: 3, name: 'GBP', code: 'GBP' },
    { id: 4, name: 'EUR', code: 'EUR' }
  ],
  taxCodes: [
    { id: 1, name: 'GST 0%', code: 'GST0' },
    { id: 2, name: 'GST 5%', code: 'GST5' },
    { id: 3, name: 'GST 12%', code: 'GST12' },
    { id: 4, name: 'GST 18%', code: 'GST18' },
    { id: 5, name: 'GST 28%', code: 'GST28' }
  ],
  priceLists: [
    { id: 1, name: 'STANDARD' },
    { id: 2, name: 'WHOLESALE' },
    { id: 3, name: 'DISTRIBUTOR' },
    { id: 4, name: 'RETAIL' }
  ],
  cities: [
    { id: 101, name: 'DELHI' },
    { id: 102, name: 'MUMBAI' },
    { id: 103, name: 'BENGALURU' },
    { id: 104, name: 'HYDERABAD' },
    { id: 105, name: 'CHENNAI' },
    { id: 106, name: 'KOLKATA' }
  ],
  statuses: ['ACTIVE', 'INACTIVE', 'ON_HOLD']
};
