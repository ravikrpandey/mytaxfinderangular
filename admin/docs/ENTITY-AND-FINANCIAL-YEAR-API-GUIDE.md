# Entity / Company List & Financial Years – API & Usage Guide

This document describes how **entities (companies)** and **financial years** are listed in the MyTaxFinder Admin app, and the API instructions for the entity/company list. Financial years are computed on the client and do not use an API.

---

## 1. Entity / Company List

### 1.1 Overview

- **What it is:** The list of businesses/companies (entities) that an admin user can switch between in the header.
- **Who sees it:** Only **admin** users. The entity dropdown is shown in the app header when the user is an admin.
- **Where it’s used:** Header dropdown “🏢 [Company Name]” to switch the current working entity. The selected entity is stored in `localStorage` and in `AuthService.currentEntity`.

### 1.2 Entity shape (front-end)

The app expects each entity to match the `Entity` interface (or compatible API response):

| Field          | Type   | Description                          |
|----------------|--------|--------------------------------------|
| `id`           | string | Optional unique id                   |
| `companyName`  | string | Display name of the company          |
| `email`        | string | Company/admin email (used for matching) |
| `identifier`   | string | Business identifier (e.g. from registration) |
| `gstin`        | string | Optional GSTIN                       |
| `state`        | string | Optional state                       |
| `city`         | string | Optional city                        |

Other fields returned by the API are allowed (`[key: string]: any`).

### 1.3 How the list is loaded

1. On app init, `App` runs `loadAdminEntities()` in its constructor.
2. It only runs if the user is logged in, is an admin, and has an `email`.
3. It calls: **`ApiService.getAdminEntities(adminEmail)`**.
4. On success, it calls **`AuthService.setAdminEntities(entities)`** and, if no entity is selected yet, selects the first one: **`AuthService.switchEntity(entities[0])`**.

So the **entity list is the array returned by the “get admin entities” API**, keyed by admin email.

### 1.4 API for entity/company list

**Get all entities (companies) for an admin**

| Item        | Value |
|------------|--------|
| **Method** | `GET` |
| **URL**    | `{businessAccountsApiUrl}?adminEmail={adminEmail}` |
| **Base URL** | `http://localhost:5000/api/v1/client-user/meta-data/business-account/business-accounts` (configurable in `ApiService`) |
| **Query**  | `adminEmail` – email of the logged-in admin (URL-encoded). |

**Headers**

- Include the app’s auth headers (e.g. JWT) via `getAuthHeaders()` so the backend can identify the admin.

**Example request**

```http
GET /api/v1/client-user/meta-data/business-account/business-accounts?adminEmail=admin%40example.com
Authorization: Bearer <token>
```

**Expected response**

- **Status:** `200 OK`
- **Body:** JSON **array** of business-account/entity objects.

Each item should at least provide fields the app uses for the dropdown and for switching entity:

- `companyName` – shown in the dropdown.
- `email` – used to mark the active entity and in the template.
- `identifier` – used as company identifier in the app.

Including `id`, `gstin`, `state`, `city` is recommended so the full `Entity` shape is satisfied and future features (e.g. invoices, reports) can use them.

**Example response (minimal)**

```json
[
  {
    "id": "1",
    "companyName": "ABC Pvt Ltd",
    "email": "company1@example.com",
    "identifier": "ABC-001",
    "gstin": "27AABCU9603R1ZM",
    "state": "Maharashtra",
    "city": "Mumbai"
  },
  {
    "id": "2",
    "companyName": "XYZ Traders",
    "email": "company2@example.com",
    "identifier": "XYZ-002"
  }
]
```

**Error handling**

- On API failure, the app logs and does not set entities. The dropdown will show “No entities available” until a retry or refresh succeeds.

### 1.5 Switching entity

- User selects an entity from the header dropdown.
- App calls **`AuthService.switchEntity(entity)`**, which:
  - Saves the entity in `localStorage` under `currentEntity`.
  - Sets **`AuthService.currentEntity`** to that entity.
- All screens that depend on “current company” should read **`AuthService.getCurrentEntity()`** (and optionally **`AuthService.getSeletedFinancialYear()`** for FY-specific data).

---

## 2. Financial Years List

### 2.1 Overview

- **What it is:** A list of financial years (e.g. `2020-2021`, `2021-2022`, …) used for filtering or scoping data.
- **Who sees it:** Only **admin** users. The financial year dropdown is in the header next to the entity dropdown.
- **Source:** **Client-side only.** There is **no API** for the list; it is computed in **`AuthService.getFinancialYears()`**.

### 2.2 How the list is computed

- **Method:** `AuthService.getFinancialYears()`.
- **Rule:** From **current calendar year − 5** to **current calendar year + 1**, each year is turned into a financial-year string **`YYYY-(YYYY+1)`** (e.g. `2024-2025`).
- **Convention:** Indian financial year (April–March): a year string like `2024-2025` means April 2024 to March 2025.

So the list is a **fixed window** of 7 years (e.g. for 2025: from `2020-2021` to `2026-2027`).

### 2.3 Current / default financial year

- **Method:** `AuthService.getCurrentFinancialYear()`.
- **Logic:**
  - If current month ≥ April (month ≥ 4): current FY = `currentYear-(currentYear+1)`.
  - Else: current FY = `(currentYear-1)-currentYear`.
- **Default selection:** If the user has not chosen a year, **`AuthService`** initialises the selected financial year from `localStorage`; if missing, it uses **`getCurrentFinancialYear()`** as the default.

### 2.4 Storing selected financial year

- **Method:** `AuthService.setFinancialYear(year)`.
- **Storage:** `localStorage` under `selectedFinancialYear`.
- **Reading:** `AuthService.getSeletedFinancialYear()` (note: typo “Seleted” in method name).

So the **list** of financial years is not from the backend; only the **selected** value is persisted locally. Any API that needs to filter by financial year should receive the value from **`getSeletedFinancialYear()`** (e.g. as a query or body parameter) in the format **`YYYY-YYYY`**.

---

## 3. API summary table

| Purpose                      | Method | Endpoint / source | Notes |
|-----------------------------|--------|--------------------|--------|
| **Entity/company list**     | `GET`  | `{businessAccountsApiUrl}?adminEmail={email}` | Query param: `adminEmail`. Returns array of entities. |
| **Financial years list**    | –      | Client-only (`AuthService.getFinancialYears()`) | No API. Format: `YYYY-YYYY`. 7 years window. |

---

## 4. Backend implementation notes (entity list API)

For the **entity list** API, the backend should:

1. **Authenticate** the request (e.g. JWT) and resolve the admin user (e.g. by email or user id).
2. **Resolve “entities for this admin”** (e.g. all business accounts linked to that admin’s email, or to a tenant/organisation the admin belongs to).
3. Return a **JSON array** of objects that include at least:
   - `companyName`
   - `email`
   - `identifier`
   and preferably `id`, `gstin`, `state`, `city` for full compatibility.
4. Use the same base URL as in the app (or configure the app’s `businessAccountsApiUrl` to match your base path).

Financial years require **no backend list endpoint**; the app only needs to accept the selected year (e.g. `2024-2025`) in any APIs that are filtered by financial year.

---

## 5. References in code

| Concern | File | Symbol / usage |
|--------|------|-----------------|
| Entity interface | `src/app/services/auth.service.ts` | `Entity` |
| Entity list API | `src/app/services/api.service.ts` | `getAdminEntities(adminEmail)` |
| Business account base URL | `src/app/services/api.service.ts` | `businessAccountsApiUrl` |
| Load entities on app init | `src/app/app.ts` | `loadAdminEntities()` |
| Entity dropdown / switch | `src/app/app.html` | `authService.adminEntities()`, `switchEntity(entity)` |
| Financial years list | `src/app/services/auth.service.ts` | `getFinancialYears()` |
| Current / default FY | `src/app/services/auth.service.ts` | `getCurrentFinancialYear()`, `getSeletedFinancialYear()`, `setFinancialYear(year)` |
| FY dropdown in UI | `src/app/app.html` | `financialYears`, `changeFinancialYear(year)` |
