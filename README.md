# Product API

REST API CRUD cho `Product` bằng Node.js, Express va Mongoose. Du an cung cap Compose cho phat trien, CI test voi MongoDB that, va CD len Docker Hub; deploy tu dong den Docker Engine tai may local can mot GitHub self-hosted runner.

## Chay nhanh local

Yeu cau: Git, Node.js 20+, Docker Desktop da chay va Docker Compose.

1. Tao `.env` tu `.env.example`; voi MongoDB chay tren host, de `MONGODB_URI=mongodb://localhost:27017/productdb`.
2. Cai dependencies: `npm ci`.
3. Chay MongoDB rieng (buoc nay dung Docker Engine):

   ```sh
   docker run -d --name nammongodb \
     -p 27017:27017 \
     -v product_mongo_data:/data/db \
     --health-cmd "mongosh --quiet --eval 'db.adminCommand(\"ping\").ok'" \
     --health-interval 10s --health-timeout 5s --health-retries 5 \
     mongo:7
   ```

4. Khoi dong API: `npm start`; mo `http://localhost:3000/health`.
5. De chay ca API va MongoDB bang Compose, dung `docker compose up --build -d`. Compose su dung cung container name `nammongodb`; neu buoc 3 dang chay, dung no truoc (`docker stop nammongodb`) de tranh trung ten. Du lieu MongoDB duoc giu trong volume `product_mongo_data`.

## API

| Method | Path | Mo ta |
| --- | --- | --- |
| `POST` | `/api/products` | Tao san pham |
| `GET` | `/api/products` | Liet ke san pham |
| `GET` | `/api/products/:pid` | Lay mot san pham |
| `PUT` | `/api/products/:pid` | Thay the thong tin san pham |
| `DELETE` | `/api/products/:pid` | Xoa san pham |
| `GET` | `/health` | 200 khi MongoDB ket noi; nguoc lai 503 |

Vi du tao san pham:

```json
{ "pid": "p-101", "pname": "Notebook", "price": 4.5, "quantity": 8 }
```

`pid` la duy nhat; `pname` bat buoc; `price` la so khong am; `quantity` la so nguyen khong am. API tra 400 cho du lieu khong hop le, 404 neu khong tim thay san pham va 409 neu `pid` bi trung.

## Trinh tu bai tap va danh gia

1. **Lam sach bo nho / tao huong dan:** huong dan nay mo ta tung lenh va cach kiem chung. Danh gia: dat khi nguoi hoc co the chay lai va doi chieu cac ket qua o ben duoi.
2. **Repository GitHub:** `origin` hien dang tro toi `https://github.com/vothimyxuyen/product-api.git`; repository nay da ton tai, nen khong the tao lai cung ten trong cung owner. Danh gia: dat neu day la repository can dung; neu can repository moi, tao trong GitHub truoc va cap nhat `origin`.
3. **Clone bang Git Bash trong VS Code:** mo terminal Git Bash, chuyen den thu muc muon luu, chay `git clone https://github.com/vothimyxuyen/product-api.git`, sau do `code product-api`. Danh gia: dat khi `git remote -v` hien dung URL va source mo trong VS Code. Neu dang lam trong checkout nay thi khong clone de chong long thu muc.
4. **Ket noi Docker Desktop voi VS Code:** khoi dong Docker Desktop, doi den trang thai Running, cai extension Docker cua Microsoft trong VS Code. Danh gia: dat khi `docker version` co ca Client va Server, va extension hien Docker Engine dang chay.
5. **Tao MongoDB `nammongodb`:** chay lenh `docker run` o muc Chay nhanh. Danh gia: `docker ps` hien container `nammongodb` o trang thai healthy; `docker logs nammongodb` khong co loi khoi dong.
6. **CRUD + Mongoose + `.env`:** khai bao `.env`, chay `npm ci`, `npm start`. Danh gia: `/health` tra 200 va cac thao tac CRUD tra dung status code; integration test kiem tra ca CRUD tren MongoDB.
7. **Dockerize:** `docker build -t product-api:local .`. Danh gia: build thanh cong; container API chuyen sang healthy khi MongoDB san sang.
8. **Docker Compose:** dung `docker compose up --build -d`. Danh gia: `docker compose ps` hien MongoDB va API dang chay. Neu da tao MongoDB rieng o buoc 5, dung container do truoc khi chay Compose.
9. **Healthcheck:** MongoDB duoc kiem tra bang `mongosh ping`, API bang `/health` (API tra 503 neu mat ket noi DB). Danh gia: `docker inspect --format='{{.State.Health.Status}}' nammongodb` va `docker compose ps` cho thay healthy.
10. **Basic CI:** `.github/workflows/test-productci.yml` chay unit tests tren push/PR. Danh gia: GitHub Actions job `unit-tests` xanh.
11. **Production CI:** `.github/workflows/test-productci-prod.yml` khoi dong MongoDB service, chay CRUD integration test va build Docker image. Danh gia: ca integration tests va Docker build xanh; test `/health` can MongoDB ket noi.
12. **CD Docker Hub:** tao Docker Hub access token, roi them GitHub Actions secret `DOCKERHUB_TOKEN` va repository variable `DOCKERHUB_USERNAME`. Workflow CD chi publish sau khi production CI thanh cong tren nhanh `main`; image duoc gan tag `latest` va commit SHA. Danh gia: ca hai tag hien tren Docker Hub va healthcheck CI da xanh truoc khi publish.
13. **Compose production:** dien `DOCKERHUB_USERNAME` trong `.env` va chay `docker compose -f docker-compose-prod.yaml up -d --pull always --wait`. Danh gia: image duoc pull tu Docker Hub va API/MongoDB healthy tren Docker Engine local.
14. **Tu dong deploy den may local:** cai GitHub Actions self-hosted runner tren may local co Docker Desktop, dat label `docker`, va dam bao tai khoan runner duoc phep truy cap Docker Engine. Workflow se publish tren GitHub-hosted runner roi chay Compose tren runner local. Danh gia: GitHub job `deploy-local` thanh cong va container local chay dung image theo commit SHA.

## Tests va Docker

```sh
npm test
MONGODB_URI=mongodb://localhost:27017/productdb npm run test:integration
docker compose up --build -d
docker compose ps
```

PowerShell syntax cho integration test:

```powershell
$env:MONGODB_URI = "mongodb://localhost:27017/productdb"
npm run test:integration
```

Khong commit `.env` hoac Docker Hub token. Workflow deploy local se cho o job `deploy-local` neu chua co self-hosted runner voi label `docker`.
