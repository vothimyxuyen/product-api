# E-commerce MVP REST API

Backend MVP theo database diagram: Node.js 20+, Express, Prisma ORM va PostgreSQL 16. API co dang ky/dang nhap JWT, phan quyen CUSTOMER/ADMIN, quan ly san pham, tao don hang tru stock trong transaction, va theo doi shipment. Password duoc bam bang bcrypt; khong tra password hash ra API.

## Lam theo tung buoc va tu danh gia

Moi buoc co lenh kiem tra va tieu chi danh gia. Chi chuyen sang buoc ke tiep khi ket qua dat.

### 1. Chuan bi cau hinh

Mo terminal tai thu muc du an, sao chep file mau:

```powershell
Copy-Item .env.example .env
```

Mo `.env`, thay `JWT_SECRET` bang chuoi ngau nhien dai it nhat 32 ky tu. Vi du tao chuoi:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Co the dung chuoi tren cho `JWT_SECRET`. Doi `POSTGRES_PASSWORD` thanh mat khau rieng va dat `DATABASE_URL` khop voi user, password, ten database. De URL ket noi PostgreSQL trong Compose hop le, dung mat khau chi gom chu cai, chu so, `_` hoac `-`. `.env` da duoc ignore boi Git, khong commit file nay hay secret.

**Kiem tra va danh gia:** xac nhan `.env` co `DATABASE_URL`, `JWT_SECRET`, `POSTGRES_PASSWORD`; JWT secret dai it nhat 32 ky tu. Khong in/chia se gia tri secret trong log hoac screenshot.

### 2. Cai dependencies va tao Prisma Client

Can Node.js 20 tro len. Cai dependencies va tao Prisma Client theo schema:

```powershell
npm ci
npx prisma generate
```

**Kiem tra va danh gia:** ca hai lenh ket thuc voi exit code 0. Neu `npm ci` that bai, kiem tra Node version va ket noi npm registry truoc; khong bo qua loi.

### 3. Khoi dong PostgreSQL bang Docker Compose

Docker Desktop can dang chay. Compose dung volume de giu database qua cac lan restart:

```powershell
docker compose up -d postgres
docker compose ps
```

**Kiem tra va danh gia:** service `postgres` co trang thai `healthy`. Neu host port 5432 dang bi chiem, doi `POSTGRES_HOST_PORT` trong `.env` (vi du 5433); `DATABASE_URL` cho chay API tren host van dung `localhost:<port>` va phai doi port cho trung khop.

### 4. Tao bang va du lieu ban dau

Chay migration de tao cac bang tu schema va nap roles CUSTOMER/ADMIN cung membership Basic:

```powershell
npm run db:migrate
npm run db:seed
```

**Kiem tra va danh gia:** migration va seed deu thanh cong. Seed co the chay lai an toan. Cac bang Role, User, Membership, Product, Order, OrderDetail, Shipment va foreign keys phai khop voi hinh.

### 5. Tao tai khoan CUSTOMER va chay API

```powershell
npm start
```

Trong terminal khac, dang ky tai khoan (PowerShell):

```powershell
$body = @{ username = "customer1"; fullname = "Customer One"; password = "change-this-password" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/register -ContentType "application/json" -Body $body
```

**Kiem tra va danh gia:** dang ky tra 201 va JSON co `user` va `token`, khong co password. Ten tai khoan trung tra 409; password ngan hon 8 ky tu tra 400.

De tao tai khoan quan tri cho demo, dang ky tai khoan truoc, sau do chay SQL tren database tin cay (thay username):

```sql
UPDATE "User" SET "roleid" = (SELECT "roleid" FROM "Role" WHERE "rolename" = 'ADMIN')
WHERE "username" = 'admin1';
```

Dang nhap lai de lay JWT moi co quyen ADMIN. Khong co tai khoan/mat khau admin mac dinh trong ung dung.

**Kiem tra va danh gia:** dang nhap dung tra token; sai username/password tra 401. JWT secret chi duoc doc tu `.env`, va API yeu cau `Authorization: Bearer <token>` cho moi route `/api` ngoai register/login.

### 6. Thu API san pham va dat hang

API routes:

| Method | Path | Quyen | Mo ta |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Tao CUSTOMER va cap JWT |
| `POST` | `/api/auth/login` | Public | Dang nhap va cap JWT |
| `GET` | `/api/products` | CUSTOMER/ADMIN | Liet ke san pham |
| `GET` | `/api/products/:pid` | CUSTOMER/ADMIN | Xem san pham |
| `POST` | `/api/products` | ADMIN | Tao san pham |
| `PUT` | `/api/products/:pid` | ADMIN | Cap nhat san pham |
| `DELETE` | `/api/products/:pid` | ADMIN | Xoa san pham chua duoc dat |
| `POST` | `/api/orders` | CUSTOMER/ADMIN | Tao don hang va tru ton kho |
| `GET` | `/api/orders` | CUSTOMER/ADMIN | Liet ke don cua minh; ADMIN xem tat ca |
| `GET` | `/api/orders/:oid` | Chu don/ADMIN | Xem chi tiet don |
| `POST` | `/api/orders/:oid/shipments` | ADMIN | Them cap nhat giao hang |
| `GET` | `/health` | Public | Kiem tra ket noi database |

Vi du JSON tao san pham: `{ "pname": "Notebook", "price": 4.50, "quantity": 8 }`.
Vi du JSON dat hang: `{ "items": [{ "pid": 1, "qty": 2 }] }`.
API luu don, chi tiet gia tai thoi diem mua va tru stock trong mot transaction; ton kho thieu tra 409 va khong tao don mot phan.

**Kiem tra va danh gia:** khong token tra 401; CUSTOMER goi API quan tri tra 403; input khong hop le tra 400; khong tim thay resource tra 404. Sau khi tao don thanh cong, kiem tra qty va unit price duoc luu dung.

### 7. Kiem tra health

```powershell
Invoke-RestMethod http://localhost:3000/health
```

**Kiem tra va danh gia:** database ket noi tra HTTP 200 voi `status: ok`, `database: connected`. Khi database khong truy cap duoc, endpoint tra 503; Docker Compose su dung ket qua nay lam healthcheck cho API.

### 8. Chay test va build Docker

```powershell
npm test
npm run test:integration
docker compose up --build -d --wait
docker compose ps
```

**Kiem tra va danh gia:** unit va integration tests xanh; integration tests can PostgreSQL da migrate/seed va dung `DATABASE_URL`, `JWT_SECRET`. Hai service Compose phai `healthy`. Dung `docker compose logs api` neu can xem loi; khong dua secrets vao log.

Dung stack:

```powershell
docker compose down
```

Du lieu van nam trong volume. Chi xoa volume khi chu dong muon xoa database.

## Pham vi va cac quy tac MVP

- Password duoc bam bcrypt; JWT co thoi han cau hinh bang `JWT_EXPIRES_IN` (mac dinh 1 gio).
- Dang ky chi tao CUSTOMER; chi ADMIN duoc tao/sua/xoa san pham va them shipment. Tao ADMIN qua SQL chi danh cho bootstrap demo co kiem soat.
- Customer chi doc va xem don hang cua minh. Membership bat dau o Basic, score mac dinh 0; chua dinh nghia quy tac cong diem/doi hang.
- Shipment cho phep nhieu ban ghi tren mot order, phu hop quan he 0..* trong diagram.
- Khong co thanh toan, gio hang dai han, refresh token, email, pagination hay workflow fulfillment day du.
