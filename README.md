# ระบบบริหารจัดการเงินรายได้บุคลากร (Payroll System)

คณะแพทยศาสตร์ มหาวิทยาลัยธรรมศาสตร์

ระบบนำเข้า → ตรวจสอบ → ยืนยัน → แสดงผล/ส่งธนาคาร สำหรับข้อมูลรายได้และรายการหักของบุคลากร
ออกแบบตามเอกสาร [Payroll-Flow-UseCaseDesign.html](Documents/Payroll-Flow-UseCaseDesign.html)
([ดูออนไลน์](https://htmlpreview.github.io/?https://github.com/sanookdev/system_payroll/blob/main/Documents/Payroll-Flow-UseCaseDesign.html))

## Tech Stack

| ส่วน | เทคโนโลยี |
| --- | --- |
| Frontend | Vue 3 + Vuetify 3 + Vite + Pinia + Vue Router |
| Backend | Express.js (ES Modules) + JWT + Multer + SheetJS (xlsx) |
| Database | **MySQL 8** (รันผ่าน Docker Compose) เข้าถึงผ่าน `mysql2/promise` + repository layer |
| Auth | JWT ภายใน + adapter เชื่อม PMIS / `api_authen_of_med` (โหมด mock/api) |

## โครงสร้างโปรเจ็ค

```
system_payroll/
├── docker-compose.yml       # MySQL 8 + Adminer
├── backend/                 # Express API
│   └── src/
│       ├── config/          # ค่าคงที่ + สิทธิ์/สถานะ/หมวด
│       ├── db/              # pool (mysql2), schema.sql, seedData, init (สร้าง+seed)
│       ├── repositories/    # user, employee, batch, record, report, meta
│       ├── middleware/      # requireAuth, requireRole, errorHandler
│       ├── services/        # pmis (auth adapter), excel (parse/export)
│       ├── controllers/     # auth, batches, payroll, export, users, meta
│       └── routes/          # รวม endpoint ทั้งหมด
└── frontend/                # Vue 3 + Vuetify SPA
    └── src/
        ├── layouts/         # DefaultLayout (เมนูตาม role)
        ├── views/           # หน้าจอแต่ละ use case
        ├── stores/          # auth, ui (Pinia)
        ├── services/        # axios client
        └── router/          # เส้นทาง + guard ตามสิทธิ์
```

## การติดตั้งและรัน

ต้องมี **Docker** + **Node.js 18+** (ใช้ `fetch` และ ES Modules)

### 1) ฐานข้อมูล MySQL (Docker)

```bash
# จากโฟลเดอร์ system_payroll
docker compose up -d
```

ได้ 2 container:
- `payroll_mysql` — MySQL 8 (host port **3316** → 3306) สร้าง schema อัตโนมัติจาก `backend/src/db/schema.sql`
- `payroll_adminer` — เครื่องมือดู DB ผ่านเว็บที่ http://localhost:8081
  (Server: `mysql`, User: `payroll`, Password: `payroll123`, Database: `payroll`)

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env      # Windows PowerShell: copy .env.example .env
npm run dev               # http://localhost:4000
```

> ครั้งแรกที่รัน backend จะ **สร้างตาราง + seed ข้อมูลตัวอย่างอัตโนมัติ**
> หากต้องการล้างและ seed ใหม่: `npm run seed`

### 3) Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173 (proxy /api -> :4000)
```

เปิดเบราว์เซอร์ที่ http://localhost:5173

> **ลำดับการรัน:** `docker compose up -d` → backend → frontend
> (backend มี retry รอ MySQL พร้อมอยู่แล้ว หากเพิ่ง `up` container)

## บัญชีทดสอบ (รหัสผ่าน: `password123`)

| Username | สิทธิ์ | ใช้ทำอะไร |
| --- | --- | --- |
| `superadmin` | Super Admin | เข้าถึงทุกส่วน + จัดการบัญชีผู้ใช้ |
| `treasury` | Admin คลังและพัสดุ | ตรวจสอบ/แก้ไข/ยืนยัน/export ส่งธนาคาร |
| `source_hr` | Admin หน่วยงานต้นทาง | นำเข้า (upload) ข้อมูล |
| `source_social` | Admin หน่วยงานต้นทาง | นำเข้า (upload) ข้อมูล |
| `user` | บุคลากร | ดูรายได้/รายการหักของตน + พิมพ์เอกสาร |
| `user2` | บุคลากร | ดูรายได้/รายการหักของตน |

## Flow หลักของระบบ

1. **หน่วยงานต้นทาง** upload ไฟล์ excel → ระบบบันทึกเป็นชุดข้อมูลสถานะ *รอตรวจสอบ*
2. **คลังและพัสดุ** ค้นหา + ตรวจสอบ → ถ้าผิด: แก้ไขบางรายการ หรือยกเลิกทั้งชุดให้ upload ใหม่ (loop)
3. ถ้าถูกต้อง → กดยืนยัน (บางรายการ/ทั้งชุด) → สถานะ *ยืนยันแล้ว*
4. ข้อมูลที่ยืนยันแล้วไป 3 ปลายทาง: **Export ส่งธนาคาร** · **User เห็นข้อมูล + พิมพ์เอกสาร** · **Admin ดูภาพรวม**

> กติกาสำคัญ (ข้อ 4.2): หน้า User แสดง **เฉพาะข้อมูลที่ยืนยันแล้ว** เท่านั้น

## การเชื่อมต่อ PMIS / API Authen (ข้อ 1)

ระบบไม่เก็บรหัสผ่านเอง — ยืนยันตัวตนผ่าน API กลางของคณะฯ 2 ชั้น (`application-key` + `JWT`)
- โหมด `mock` (ค่าเริ่มต้น): ตรวจกับบัญชีในระบบ ทำให้รันได้โดยไม่ต้องอยู่ใน intranet
- โหมด `api`: เรียก `POST /api/employee/login` จริง — โครงพร้อมเติมใน `backend/src/services/pmis.service.js`

ตั้งค่าใน `.env` ที่ตัวแปร `AUTH_MODE`, `PMIS_BASE_URL`, `PMIS_APPLICATION_KEY`

## Requirement ↔ ที่อยู่ใน code

| ข้อ | ความต้องการ | Endpoint / View |
| --- | --- | --- |
| 1.1 | Login + ดึงข้อมูล PMIS | `POST /api/auth/login`, `pmis.service.js` |
| 2.1–2.5 | นำเข้า excel (รายได้/หัก/งบ/บัญชี) | `POST /api/batches/upload`, `UploadView.vue` |
| 3.1 | ตรวจสอบ + ค้นหา (ประเภท/เดือน/หน่วยงาน) | `GET /api/batches`, `BatchesView.vue` |
| 3.2 | แก้ไขบางรายการ / ยกเลิกทั้งชุด | `PATCH /api/batches/records/:id`, `POST /:id/cancel` |
| 3.3 | ยืนยัน (บางรายการ/ทั้งหมด) | `POST /api/batches/:id/confirm` |
| 3.4 | Export excel ส่งธนาคาร | `GET /api/export/bank/:batchId` |
| 4.1 | Profile บุคลากร | `GET /api/auth/me`, `ProfileView.vue` |
| 4.2–4.3 | ดูรายได้/หักของตน (ยืนยันแล้ว) + ย้อนหลัง | `GET /api/me/payslip`, `PayslipView.vue` |
| 4.4 | พิมพ์เอกสารยืนยันรายได้ (เดือน/ทั้งปี) | `GET /api/me/income-certificate`, `IncomeCertificateView.vue` |
| 4.5 | ภาพรวม admin/superadmin | `GET /api/overview`, `OverviewView.vue` |
| 5.1 | แบ่งสิทธิ์ + จัดการบัญชี | `GET/POST/PATCH/DELETE /api/users`, `UsersView.vue` |

## ฐานข้อมูล (MySQL)

- Schema อยู่ที่ [backend/src/db/schema.sql](backend/src/db/schema.sql) — ตาราง: `employees`, `users`,
  `income_types`, `deduction_types`, `departments`, `batches`, `records` (FK `records.batch_id → batches`)
- โค้ดเข้าถึง DB ผ่าน **repository layer** (`backend/src/repositories/*`) จุดเดียว — controller ไม่เขียน SQL ตรง
- ปรับ connection ได้ที่ `.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
- ดูข้อมูลผ่าน Adminer: http://localhost:8081 หรือ CLI:
  ```bash
  docker exec -it payroll_mysql mysql -upayroll -ppayroll123 payroll
  ```

## หมายเหตุการนำไปใช้จริง (production)

- ตั้ง `JWT_SECRET`, `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD` ใหม่ และเปิด `AUTH_MODE=api` เชื่อม PMIS จริง
- ใช้ managed MySQL หรือ container ที่มี backup/replication (ปรับ `docker-compose.yml`)
- เพิ่ม HTTPS / rate limit / audit log ตามนโยบายความปลอดภัยของคณะฯ
- schema เดิมของระบบจริง (อ้างอิง) อยู่ที่ `database.sql`
