# AR-Program — كراسة مواصفات الباك إند (Backend REST API Specifications)

هذا المستند مخصص لمطور **الباك إند (OpenCode)** لمعرفة كافّة الـ Endpoints والمواصفات المطلوبة لتطوير السيرفر وربطه مع الفرونت إند بسلاسة.

---

## 🚀 1. المتطلبات العامة (General Requirements)

- **رابط الـ API الافتراضي (Default Base URL):** `http://localhost:5000/api` (أو المنفذ الذي يتم تحديده).
- **CORS Header:** يجب أن يتضمن السيرفر ترويسات `Access-Control-Allow-Origin: *` و `Access-Control-Allow-Headers: *`.
- **صيغة البيانات (Content-Type):** `application/json` لكل الطلبات والاستجابات.
- **نقطة فحص الاتصال (Health Check):**
  - `GET /api/health`
  - الاستجابة المتوقعة: `{"status": "ok", "version": "1.0.0"}` مع كود `200 OK`.

---

## 🔑 2. مصادقة المستخدمين (Authentication)

| الميثود | الـ Endpoint | الوصف | الاستجابة |
|---|---|---|---|
| `POST` | `/api/auth/login` | تسجيل الدخول | `{"token": "...", "user": {"id": 1, "username": "admin", "role": "admin"}}` |
| `GET` | `/api/auth/me` | استرجاع بيانات المستخدم الحالي | `{"id": 1, "username": "admin", "name": "مدير النظام"}` |

---

## 📦 3. إدارات النظام والـ Endpoints المطلوبة

جميع مسارات الجداول تتبع النمط القياسي للـ REST API:

- `GET /api/<resource>`: جلب جميع السجلات.
- `GET /api/<resource>/:id`: جلب سجل محدد حسب ID.
- `POST /api/<resource>`: إنشاء سجل جديد.
- `PUT /api/<resource>/:id`: تحديث سجل موجود.
- `DELETE /api/<resource>/:id`: حذف سجل.

### القائمة الكاملة للـ Resources:

| القسم | اسم المسار (Resource Endpoint) | الوصف |
|---|---|---|
| **الإعدادات** | `/api/settings` | بيانات المنشأة والإعدادات العامة |
| | `/api/users` | حسابات المستخدمين |
| | `/api/roles` | الأدوار والصلاحيات |
| **المخزون** | `/api/categories` | تصنيفات المنتجات |
| | `/api/products` | المنتجات والأسعار والتكاليف |
| | `/api/warehouses` | المستودعات |
| | `/api/stock-movements` | حركات الوارد والمنصرف |
| | `/api/offers` | العروض والتخفيضات |
| **إدارة الأعمال** | `/api/customers` | بيانات العملاء |
| | `/api/suppliers` | بيانات الموردين |
| | `/api/invoices` | فواتير المبيعات |
| | `/api/invoice-returns` | مرتجعات المبيعات |
| | `/api/purchases` | فواتير الشراء |
| | `/api/purchase-returns` | مرتجعات المشتريات |
| | `/api/quotations` | عروض الأسعار |
| | `/api/projects` | المشاريع |
| | `/api/tasks` | المهام والأنشطة |
| **المحاسبة** | `/api/accounts` | شجرة الحسابات المالية |
| | `/api/journal-entries` | قيود اليومية |
| | `/api/payments` | سندات القبض والصرف |
| | `/api/expenses` | المصروفات |
| **الموارد البشرية** | `/api/departments` | الأقسام والإدارات |
| | `/api/employees` | الموظفون |
| | `/api/attendance` | الحضور والانصراف |
| | `/api/payroll` | مسير الرواتب |
| | `/api/leave-requests` | طلبات الإجازات |

---

## 📝 4. أمثلة لهياكل البيانات (JSON Schemas)

### المنتج (`Product`):
```json
{
  "id": 1,
  "code": "PRD-001",
  "name": "منتج تجريبي",
  "categoryId": 2,
  "cost": 100.0,
  "price": 150.0,
  "barcode": "6291234567890",
  "minStock": 5
}
```

### فاتورة المبيعات (`Invoice`):
```json
{
  "id": 1,
  "number": "INV-2026-0001",
  "date": 1772928000000,
  "customerId": 3,
  "subtotal": 1000.0,
  "tax": 150.0,
  "discount": 50.0,
  "total": 1100.0,
  "items": [
    { "productId": 1, "qty": 2, "price": 500.0, "total": 1000.0 }
  ]
}
```

---

## 💡 نصائح للتطوير لـ OpenCode:
1. يوصى بإنشاء السيرفر باستخدام **Python (FastAPI / Flask)** أو **Node.js (Express)** أو **C# (.NET)**.
2. تفعيل خيار **CORS** إجباري ليعمل مع سيرفر الفرونت إند المحلي (`http://localhost:8080`).
3. يمكن البدء بقاعدة بيانات **SQLite** لسرعة الإعداد والتطوير المحلي.
