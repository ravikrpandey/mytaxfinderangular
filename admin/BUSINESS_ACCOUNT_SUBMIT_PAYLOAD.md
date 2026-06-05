# Business Account Submit Payload (Frontend → Backend)

This document captures the payload currently produced by the `business-account` submit flow so it can be implemented in a Node.js backend.

## Source

- Form UI: `src/app/modules/business-account/business-account.component.html`
- Submit logic: `src/app/modules/business-account/business-account.component.ts` (`save()`)

## Payload Shape

```ts
interface BusinessAccountSubmitPayload {
  hasGstin: 'yes' | 'no';
  gstin: string;
  companyName: string;
  fullName: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  pincode: string;
  city: string;
  state: string;

  // extra fields included at submit time
  identifier: string;
  createdAt: string; // ISO datetime
}
```

## Field Rules From Frontend

| Field | Type | Required by frontend validation | Notes |
|---|---|---|---|
| `hasGstin` | `'yes' \| 'no'` | No (defaults to `'yes'`) | Radio selection. |
| `gstin` | `string` | No | GST input is disabled when `hasGstin = 'no'`. |
| `companyName` | `string` | Yes | Must be non-empty. |
| `fullName` | `string` | Yes | Must be non-empty. |
| `email` | `string` | No | May be pre-filled from `identifier` query param if it contains `@`. |
| `addressLine1` | `string` | Yes | Must be non-empty. |
| `addressLine2` | `string` | No | Optional. |
| `pincode` | `string` | Yes | Must be non-empty (no format check on frontend). |
| `city` | `string` | Yes | Must be non-empty. |
| `state` | `string` | Yes | Must be non-empty; selected from frontend list. |
| `identifier` | `string` | No | Comes from URL query param `identifier`; may be empty. |
| `createdAt` | `string` | Yes (set automatically) | Added in submit flow as `new Date().toISOString()`. |

## Example JSON Body

```json
{
  "hasGstin": "yes",
  "gstin": "29ABCDE1234F1Z5",
  "companyName": "Acme Traders Pvt Ltd",
  "fullName": "Ravi Patel",
  "email": "ravi@example.com",
  "addressLine1": "12, MG Road",
  "addressLine2": "Near City Mall",
  "pincode": "380015",
  "city": "Ahmedabad",
  "state": "Gujarat",
  "identifier": "ravi@example.com",
  "createdAt": "2026-02-22T10:45:12.000Z"
}
```

## Backend Recommendation (Node.js)

Even though frontend adds `createdAt`, backend should treat `createdAt` as server-owned and overwrite it.

Suggested endpoint:

- `POST /api/business-accounts`

Suggested server-side validation:

- Require: `companyName`, `fullName`, `addressLine1`, `pincode`, `city`, `state`
- Enforce enum: `hasGstin` in `['yes', 'no']`
- If `hasGstin = 'yes'`, optionally validate GSTIN format
- If `hasGstin = 'no'`, ignore/clear `gstin`
- Generate `createdAt` on server

## Optional Zod Schema (Node.js)

```ts
import { z } from 'zod';

export const businessAccountSchema = z.object({
  hasGstin: z.enum(['yes', 'no']).default('yes'),
  gstin: z.string().optional().default(''),
  companyName: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')).default(''),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional().default(''),
  pincode: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  identifier: z.string().optional().default('')
});
```

> Notes:
> - `createdAt` should be set by backend (`new Date().toISOString()`).
> - Add stricter regex checks for GSTIN/pincode if needed.
