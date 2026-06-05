# Invoice Create Payload (Frontend → Backend)

This document captures the payload structure for invoice creation from the Angular frontend.

## Source

- Form UI: `src/app/modules/invoice/invoice-create/invoice-create.component.html`
- Submit logic: `src/app/modules/invoice/invoice-create/invoice-create.component.ts` (`saveInvoice()`)

## Payload Shape

```ts
interface InvoiceCreatePayload {
  // Invoice Details
  invoiceNumber: string;
  invoiceDate: string; // ISO date format or YYYY-MM-DD
  placeOfSupply: string; // Format: "07 - Delhi" (state code + name)
  
  // Customer Details
  customerName: string;
  customerGSTIN: string;
  customerAddress: string;
  
  // Line Items
  items: InvoiceItem[];
  
  // Calculated Totals
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  freight: number;
}

interface InvoiceItem {
  description: string;
  hsnCode: string;
  qty: number;
  rate: number;
  gstPercentage: '0' | '5' | '12' | '18' | '28'; // String enum, not number
  amount: number; // Calculated: qty * rate
}
```

## Field Rules From Frontend

### Invoice Details
| Field | Type | Required | Notes |
|---|---|---|---|
| `invoiceNumber` | `string` | Yes | Auto-generated format: `INV-{YEAR}-{3-digit-count}` |
| `invoiceDate` | `string` | Yes | Date in YYYY-MM-DD format (from date input) |
| `placeOfSupply` | `string` | Yes | Selected from state dropdown, format: "01 - Jammu and Kashmir" |

### Customer Details
| Field | Type | Required | Notes |
|---|---|---|---|
| `customerName` | `string` | Yes | Customer business/individual name |
| `customerGSTIN` | `string` | Yes | 15-character GSTIN format: `07CCVPP60733HZZ` (must match regex pattern) |
| `customerAddress` | `string` | No | Full billing address |

### Line Items (Array)
| Field | Type | Required | Notes |
|---|---|---|---|
| `description` | `string` | Yes | Item/service description |
| `hsnCode` | `string` | Yes | HSN/SAC code |
| `qty` | `number` | Yes | Quantity (must be > 0) |
| `rate` | `number` | Yes | Rate per unit (must be > 0) |
| `gstPercentage` | `'0' \| '5' \| '12' \| '18' \| '28'` | Yes | GST rate as string enum (backend validation requires string, not number) |
| `amount` | `number` | Yes (calculated) | Calculated as `qty * rate` |

### Calculated Totals
| Field | Type | Required | Notes |
|---|---|---|---|
| `taxableAmount` | `number` | Yes (calculated) | Sum of all item amounts |
| `cgst` | `number` | Yes (calculated) | Central GST (intra-state only) |
| `sgst` | `number` | Yes (calculated) | State GST (intra-state only) |
| `igst` | `number` | Yes (calculated) | Integrated GST (inter-state only) |
| `totalAmount` | `number` | Yes (calculated) | `taxableAmount + cgst + sgst + igst` |
| `freight` | `number` | No | Additional freight charges (default: 0) |

## Tax Calculation Logic

### Inter-State Transaction
- When `placeOfSupply` state code ≠ `customerGSTIN` first 2 digits
- **IGST** = Sum of (item.amount × item.gstPercentage / 100) for all items
- **CGST** = 0
- **SGST** = 0

### Intra-State Transaction
- When `placeOfSupply` state code = `customerGSTIN` first 2 digits
- Total GST = Sum of (item.amount × item.gstPercentage / 100) for all items
- **CGST** = Total GST / 2
- **SGST** = Total GST / 2
- **IGST** = 0

## Example JSON Body

```json
{
  "invoiceNumber": "INV-2026-847",
  "invoiceDate": "2026-02-22",
  "placeOfSupply": "07 - Delhi",
  "customerName": "ABC Enterprises",
  "customerGSTIN": "07ABCDE1234F1Z5",
  "customerAddress": "123, Connaught Place, New Delhi - 110001",
  "items": [
    {
      "description": "Web Development Services",
      "hsnCode": "998314",
      "qty": 1,
      "rate": 50000,
      "gstPercentage": "18",
      "amount": 50000
    },
    {
      "description": "Hosting & Maintenance",
      "hsnCode": "998315",
      "qty": 12,
      "rate": 2000,
      "gstPercentage": "18",
      "amount": 24000
    }
  ],
  "taxableAmount": 74000,
  "cgst": 6660,
  "sgst": 6660,
  "igst": 0,
  "totalAmount": 87320,
  "freight": 0
}
```

## Example Inter-State Invoice

```json
{
  "invoiceNumber": "INV-2026-848",
  "invoiceDate": "2026-02-22",
  "placeOfSupply": "27 - Maharashtra",
  "customerName": "XYZ Solutions Pvt Ltd",
  "customerGSTIN": "07XYZAB5678C1D2",
  "customerAddress": "456, Andheri West, Mumbai - 400053",
  "items": [
    {
      "description": "Software License",
      "hsnCode": "998313",
      "qty": 5,
      "rate": 10000,
      "gstPercentage": "18",
      "amount": 50000
    }
  ],
  "taxableAmount": 50000,
  "cgst": 0,
  "sgst": 0,
  "igst": 9000,
  "totalAmount": 59000,
  "freight": 0
}
```

## Backend Recommendation (Node.js)

Suggested endpoint:

- `POST /api/v1/invoices` or `POST /api/v1/invoices/create`

### Server-Side Validation

1. **Required Fields**: Validate all marked required fields are present
2. **Invoice Number**: Ensure uniqueness
3. **GSTIN Format**: Validate 15-character alphanumeric format (regex: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`)
4. **Place of Supply**: Validate against known state codes (01-37)
5. **Items Array**: Must have at least 1 item
6. **GST Percentage**: **IMPORTANT** - Must be a string enum ('0', '5', '12', '18', '28'), not a number
7. **Amounts**: Recalculate on server to prevent tampering
   - Verify `amount = qty × rate` for each item
   - Verify `taxableAmount = sum of all item amounts`
   - Verify tax calculations based on inter/intra state logic
   - Verify `totalAmount = taxableAmount + taxes`

### Optional Zod Schema (Node.js)

```ts
import { z } from 'zod';

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  hsnCode: z.string().min(1),
  qty: z.number().positive(),
  rate: z.number().positive(),
  gstPercentage: z.enum(['0', '5', '12', '18', '28']),
  amount: z.number()
});

export const invoiceCreateSchema = z.object({
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  placeOfSupply: z.string().min(1),
  customerName: z.string().min(1),
  customerGSTIN: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
  customerAddress: z.string().optional().default(''),
  items: z.array(invoiceItemSchema).min(1),
  taxableAmount: z.number(),
  cgst: z.number(),
  sgst: z.number(),
  igst: z.number(),
  totalAmount: z.number(),
  freight: z.number().optional().default(0)
}).refine(data => {
  // Verify item amounts
  const itemsValid = data.items.every(item => 
    Math.abs(item.amount - (item.qty * item.rate)) < 0.01
  );
  // Verify taxable amount
  const taxableValid = Math.abs(
    data.taxableAmount - data.items.reduce((sum, item) => sum + item.amount, 0)
  ) < 0.01;
  
  return itemsValid && taxableValid;
}, {
  message: "Calculated amounts don't match"
});
```

## State Codes Reference

```
01 - Jammu and Kashmir
02 - Himachal Pradesh
03 - Punjab
04 - Chandigarh
05 - Uttarakhand
06 - Haryana
07 - Delhi
08 - Rajasthan
09 - Uttar Pradesh
10 - Bihar
11 - Sikkim
12 - Arunachal Pradesh
13 - Nagaland
14 - Manipur
15 - Mizoram
16 - Tripura
17 - Meghalaya
18 - Assam
19 - West Bengal
20 - Jharkhand
21 - Odisha
22 - Chhattisgarh
23 - Madhya Pradesh
24 - Gujarat
26 - Dadra and Nagar Haveli and Daman and Diu
27 - Maharashtra
29 - Karnataka
30 - Goa
31 - Lakshadweep
32 - Kerala
33 - Tamil Nadu
34 - Puducherry
35 - Andaman and Nicobar Islands
36 - Telangana
37 - Andhra Pradesh
```

## Additional Data Not in Payload (Available on Frontend)

The frontend also has company details hardcoded that should likely be fetched from backend:

```ts
interface CompanyDetails {
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
```

**Recommendation**: Create a separate endpoint to fetch authenticated user's company details rather than hardcoding in frontend.
