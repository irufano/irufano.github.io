---
title: "Developer Code Testing"
date: "2026-09-06"
description: "Code testing memastikan software bekerja sesuai requirement, perubahan code tidak merusak behavior yang sudah ada, dan risiko bug ditemukan sebelum sampai ke user."
author: "irufano"
tags:
  - Test
  - Unit Test
  - Integration Test
  - E2E Test
  - Security Test
---

## Overview

Code testing memastikan software bekerja sesuai requirement, perubahan code tidak merusak behavior yang sudah ada, dan risiko bug ditemukan sebelum sampai ke user.

Baseline testing developer:

1. **Unit Test** — menguji logic individual.
2. **Integration Test** — menguji interaksi antar component.
3. **E2E Test** — menguji critical business/user flow dari awal sampai akhir.
4. **Security Test** — menguji protection dan security boundary.

> [note]:
> **Unit Test untuk Logic, Integration Test untuk Interaction, E2E Test untuk Business Flow, dan Security Test untuk Protection.**

---

## Mengapa Developer Perlu Code Testing?

Testing bukan hanya tanggung jawab QA. Developer paling memahami perubahan code, business logic, dependency, dan dampak teknis dari perubahan tersebut.

### 1. Menemukan Bug Lebih Awal

```text
Development
    ↓
Automated Test
    ↓
Bug ditemukan
    ↓
Fix sebelum release
```

Bug yang ditemukan saat development umumnya lebih mudah ditelusuri daripada bug yang baru ditemukan setelah deployment.

### 2. Membuat Perubahan Code Lebih Aman

```text
Feature
   ↓
Refactoring
   ↓
Bug Fix
   ↓
New Feature
```

Automated test menjadi safety net untuk mendeteksi ketika perubahan baru merusak behavior lama.

### 3. Mempermudah Refactoring

Test memberikan confidence saat developer melakukan:

- refactoring,
- optimasi,
- mengganti implementation,
- memecah module,
- memperbaiki architecture.

### 4. Mendokumentasikan Expected Behavior

Test dapat menjadi executable documentation.

```text
Given:
User tidak memiliki permission admin

When:
User mengakses admin endpoint

Then:
Request ditolak dengan 403
```

### 5. Mengurangi Manual Testing

```text
Tanpa automated test:
Change → Manual Test → Change → Manual Test

Dengan automated test:
Change → Run Test Suite → Result
```

Manual testing tetap berguna, tetapi bukan satu-satunya mekanisme validasi.

### 6. Mendukung CI/CD

```text
Commit / Pull Request
        ↓
        CI
        ↓
Unit + Integration + Security Checks
        ↓
Optional E2E
        ↓
Pass / Fail
```

---

## Testing Pyramid

Jumlah test tidak perlu sama pada setiap layer.

```text
                     /\
                    /  \
                   /    \
                  / E2E  \
                 /--------\
                /          \
               / Integration\
              /--------------\
             /                \
            /    Unit Tests    \
           /____________________\

             + Security Tests
           across relevant layers
```

Prinsip jumlah:

```text
Unit Test         → Banyak
Integration Test  → Sedang
E2E Test          → Sedikit, fokus critical flows
Security Test     → Risk-based / cross-cutting
```

| Test | Speed | Complexity | Scope |
|---|---|---|---|
| Unit | Sangat cepat | Rendah | Logic individual |
| Integration | Sedang | Sedang | Antar component |
| E2E | Lebih lambat | Tinggi | Sistem/business flow |
| Security | Bervariasi | Bervariasi | Security boundary |

Semakin tinggi pyramid, test biasanya semakin kompleks, lambat, dan mahal untuk dipelihara.

---

## 1. Unit Test — Logic

### Tujuan

Memastikan **logic individual bekerja dengan benar**.

Unit dapat berupa function, method, class, module, calculation, validation, atau business rule.

```text
Input
  ↓
Function / Logic
  ↓
Output
```

Contoh:

```text
calculate_discount(price, member_type)
```

Test:

```text
Regular member → discount 0%
Silver member  → discount 5%
Gold member    → discount 10%
Invalid price  → error
Price = 0      → expected behavior
```

### Yang Perlu Diuji

- Happy path
- Edge cases
- Boundary conditions
- Invalid input
- Expected errors
- Important business rules

### Dependency

Unit test idealnya tidak bergantung pada external infrastructure.

```text
Unit Test
   ↓
Business Logic
```

Hindari dependency langsung terhadap production DB, external API, network, atau external storage. Gunakan fake/mock/stub bila diperlukan untuk mengisolasi unit.

### Kapan Dibuat?

Terutama ketika perubahan melibatkan:

- business logic,
- calculation,
- validation,
- transformation,
- decision logic,
- reusable function.

---

## 2. Integration Test — Interaction

### Tujuan

Memastikan **beberapa component bekerja bersama dengan benar**.

```text
API
 ↓
Service
 ↓
Repository
 ↓
Database
```

Contoh:

```text
POST /users
    ↓
Validation
    ↓
User Service
    ↓
User Repository
    ↓
Database
    ↓
Response
```

Test dapat memastikan:

```text
✓ valid user berhasil disimpan
✓ duplicate email ditolak
✓ database constraint bekerja
✓ transaction bekerja
✓ response sesuai data yang tersimpan
```

### Database

Jika database termasuk integration boundary yang diuji, gunakan **real test database**, bukan production database.

```text
Production DB              ❌
Isolated Test DB           ✅
Same DB engine as prod     ✅ Recommended
Mock DB                    ⚠️ Bukan full DB integration
```

Idealnya:

```text
Start Test
    ↓
Create Test DB / Container
    ↓
Run Migration
    ↓
Seed Minimal Data
    ↓
Run Integration Tests
    ↓
Cleanup
```

> **Automated tests tidak boleh dijalankan terhadap production database.**

### Kapan Dibuat?

Ketika terdapat interaksi seperti:

- API ↔ Service
- Service ↔ Repository
- Repository ↔ Database
- Module ↔ Module
- Message queue
- Cache
- External service
- Infrastructure boundary

---

## 3. E2E Test — Business Flow

### Tujuan

E2E (End-to-End) memastikan **critical business/user flow bekerja dari awal sampai akhir**.

### Frontend E2E

```text
Browser
   ↓
Frontend
   ↓
Backend
   ↓
Test Database
```

Contoh:

```text
Open Login
    ↓
Enter Credentials
    ↓
Login
    ↓
Dashboard
    ↓
Create Test
    ↓
Submit
    ↓
View Result
```

### Full E2E

Untuk critical flow, idealnya:

```text
Real Frontend
     ↓
Real Backend
     ↓
Real Test Database
```

Gunakan environment terisolasi, bukan production.

### Mock API

Mock API berguna untuk frontend-specific scenarios:

- loading state,
- empty state,
- error response,
- rare edge cases.

```text
Browser
   ↓
Frontend
   ↓
Mock API
```

Tetapi mocked browser test tidak membuktikan FE + BE + DB benar-benar bekerja bersama.

```text
Mocked Browser Test
→ FE-specific behavior

Full E2E
→ Critical end-to-end flow
```

### Backend E2E — Optional

Backend dapat memiliki API-level E2E:

```text
POST /login
    ↓
POST /tests
    ↓
POST /answers
    ↓
POST /submit
    ↓
GET /result
```

Namun **Backend E2E bersifat optional** apabila integration test sudah cukup memvalidasi backend flow.

### Kapan Dibuat?

Prioritaskan untuk critical business flow seperti:

- Login
- Registration
- Checkout
- Payment
- Submit assessment
- Critical transaction
- Core workflow aplikasi

E2E sebaiknya **sedikit tetapi bernilai tinggi**.

---

## 4. Security Test — Protection

### Tujuan

Memastikan aplikasi aman ketika menerima request, input, atau aktivitas yang tidak seharusnya.

Security testing adalah **cross-cutting concern** dan dapat dilakukan pada unit, integration, API, maupun E2E level.

### Area Penting

- Authentication
- Authorization
- Input validation
- SQL injection
- XSS
- IDOR
- Privilege escalation
- Sensitive data exposure
- File upload
- Session/token handling
- Protected endpoints

### Contoh Authorization

```text
User A
   ↓
GET /users/B/private-data
   ↓
403 Forbidden
```

Jangan hanya menguji successful access:

```text
Admin → Admin Endpoint → 200
```

Uji juga denial behavior:

```text
Normal User     → Admin Endpoint → 403
Unauthenticated → Admin Endpoint → 401
```

### Kapan Dibuat?

Sangat penting ketika perubahan melibatkan:

- Authentication
- Authorization
- User input
- Database query
- File upload
- Sensitive data
- Payment
- Admin functionality
- Privileged operation

Security testing dilakukan berdasarkan **risk**.

---

## Perbandingan

| | Unit | Integration | E2E | Security |
|---|---|---|---|---|
| Fokus | Logic | Interaction | Business Flow | Protection |
| Scope | Kecil | Beberapa component | Sistem | Security boundary |
| Jumlah | Banyak | Sedang | Sedikit | Risk-based |
| Speed | Cepat | Sedang | Lebih lambat | Bervariasi |
| Real DB | Tidak | Test DB jika DB diuji | Test DB untuk full E2E | Tergantung |
| FE | Ya | Ya | Ya | Ya |
| BE | Ya | Ya | Optional E2E | Ya |

---

## Contoh Testing Satu Feature

Misalnya developer membuat:

```text
POST /orders
```

### Unit Test

```text
✓ calculate order total
✓ discount calculation
✓ invalid quantity
✓ stock validation logic
```

### Integration Test

```text
POST /orders
    ↓
Order Service
    ↓
Repository
    ↓
Test Database
```

Verify:

```text
✓ order tersimpan
✓ order items tersimpan
✓ transaction rollback jika gagal
```

### E2E Test

```text
Login
  ↓
Select Product
  ↓
Create Order
  ↓
Checkout
  ↓
Order Confirmation
```

### Security Test

```text
✓ unauthenticated user tidak dapat create order
✓ user tidak dapat membaca order user lain
✓ malicious input ditolak
✓ sensitive data tidak terekspos
```

---

## Apakah Semua Feature Harus Memiliki Semua Test?

**Tidak.**

Pilih berdasarkan:

```text
Change
  ↓
Impact
  ↓
Risk
  ↓
Relevant Testing
```

Pure calculation:

```text
Unit        ✅
Integration ❌
E2E         ❌
Security    ❌
```

Endpoint yang menyimpan data:

```text
Unit        ✅ jika ada business logic
Integration ✅
E2E         tergantung criticality
Security    ✅ jika ada security boundary
```

Critical frontend flow:

```text
Unit        ✅ sesuai kebutuhan
Integration ✅ sesuai kebutuhan
E2E         ✅
Security    ✅ jika relevan
```

---

## Testing Saat Development

Test dapat dibuat bersama feature baru maupun ditambahkan pada existing code.

### New Feature

```text
Understand Requirement
       ↓
Implement
       ↓
Create Relevant Tests
       ↓
Run
       ↓
Fix
       ↓
Review
```

### Existing Feature / Test Backfill

```text
Understand Existing Behavior
       ↓
Inspect Existing Tests
       ↓
Identify Coverage Gap
       ↓
Add Relevant Tests
       ↓
Verify
```

### Bug Fix

```text
Bug
 ↓
Reproduce with Test
 ↓
Test Fails
 ↓
Fix Code
 ↓
Test Passes
 ↓
Run Affected Existing Tests
```

---

## Developer Testing Standard

```text
Unit Test
→ Default untuk business logic

Integration Test
→ Default untuk interaction/boundary

E2E Test
→ Critical frontend/business flow
→ Backend E2E optional

Security Test
→ Security-sensitive changes
→ Risk-based
```

### Final Principle

> **Unit Test untuk Logic.**  
> **Integration Test untuk Interaction.**  
> **E2E Test untuk Business Flow.**  
> **Security Test untuk Protection.**

Tujuan testing bukan mengejar jumlah test atau coverage setinggi mungkin, tetapi memberikan **confidence bahwa software bekerja dengan benar, aman untuk diubah, dan critical behavior tetap terjaga**.
