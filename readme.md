# Exhibition Management System (EMS) Monorepo

ระบบพัฒนาแบบ pnpm workspace และตอนนี้รันทุก service ผ่าน Docker Compose ทั้งหมด ลดปัญหาการติดตั้ง dependency บนเครื่องนักพัฒนา

## เครื่องมือที่ต้องเตรียม

- Docker Desktop (หรือ Docker Engine + Docker Compose v2)
- Node.js 20+ พร้อม Corepack เพื่อเรียกใช้ `pnpm`
- pnpm 9 (มาพร้อม Corepack แล้ว แค่รัน `corepack enable` ครั้งเดียว)

## ตั้งค่า Environment

แก้ไขค่าตามต้องการในไฟล์ `infra/docker/.env` ก่อนสตาร์ท stack โดยเฉพาะ

- `FRONTEND_PORT`, `BACKEND_PORT`, `PMA_PORT`, `DB_PORT`
- ข้อมูล MySQL (`MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`)
- `VITE_API_URL` ที่ frontend ใช้เรียก backend
- ค่าเชื่อมต่อ LINE Official (`LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`) หากต้องการเปิดใช้งาน Line Webhook
- LINE Rich Menu IDs (`LINE_RICH_MENU_STAFF`, `LINE_RICH_MENU_MEMBER`)
- LIFF App IDs (`VITE_LIFF_REGISTRATION`, `VITE_LIFF_EXHIBITION`, `VITE_LIFF_CERTIFICATE`, etc.)

## การเริ่มต้นครั้งแรก

```bash
# เปิดใช้งาน pnpm บนเครื่องเรา (ครั้งเดียว)
corepack enable

# (ทางเลือก) ติดตั้ง dependency บน host หากต้องการรัน lint/test นอก container
pnpm install

# สตาร์ทบริการทั้งหมด (MySQL + phpMyAdmin + Backend + Frontend)
pnpm run docker:up
```

บริการที่เปิดไว้ตามค่าจาก `.env`

- Frontend: http://localhost:3001 (ค่าเริ่มต้นจาก `FRONTEND_PORT`)
- Backend API: http://localhost:3001/api (ค่าเริ่มต้นจาก `BACKEND_PORT`)
- phpMyAdmin: http://localhost:8080 (ค่าเริ่มต้นจาก `PMA_PORT`, ใช้ `MYSQL_USER`/`MYSQL_PASSWORD` ล็อกอิน)
- MySQL: localhost:`DB_PORT` (เช่น 3306)

## เวิร์กโฟลว์ระหว่างพัฒนา

- เปิด stack: `pnpm run docker:up`
- ปิด stack: `pnpm run docker:down`
- ติดตาม log ทุก service: `pnpm run docker:logs` (กด Ctrl+C เพื่อออก)
- เข้า MySQL shell: `pnpm run db:shell`

โค้ดใน `apps/backend` และ `apps/frontend` ถูก mount เข้า container และ reload อัตโนมัติผ่าน nodemon/Vite ที่ตั้งค่า polling ไว้แล้ว

## เพิ่ม/อัปเดต dependency

- รันจาก root ของโปรเจกต์เพื่ออัปเดต lockfile เช่น
  ```bash
  pnpm --filter @ems/backend add zod
  pnpm --filter @ems/frontend add -D tailwindcss
  ```
  (`add` สำหรับ dependency ปกติ, `add -D` สำหรับ devDependency)
- หลังเพิ่มแพ็กเกจ ให้รีสตาร์ท service ที่เกี่ยวข้องเพื่อให้ container ติดตั้งแพ็กเกจใหม่
  ```bash
  pnpm run docker:down
  pnpm run docker:up
  ```
  หรือรัน `docker compose -f infra/docker/docker-compose.yml build backend frontend` เพื่อ rebuild image หากมีการเปลี่ยนแปลงใหญ่

## การจัดการไฟล์ที่อัปโหลด (Uploads)

ระบบเก็บไฟล์ที่อัปโหลดไว้ใน Docker volume (`uploads-data`) เพื่อให้ไฟล์คงอยู่แม้จะ restart container

**โครงสร้างไฟล์:**

```
/app/uploads/                    (ใน container)
├── exhibitions/                 (รูปนิทรรศการ)
└── units/                       (โปสเตอร์และ PDF ของหน่วย)
```

**คำสั่งที่เป็นประโยชน์:**

```bash
# ดูไฟล์ที่อัปโหลดทั้งหมด
make list-uploads

# Backup ไฟล์ uploads ไว้บนเครื่อง (เก็บในโฟลเดอร์ backups/)
make backup-uploads

# ดูไฟล์ใน uploads ด้วย shell
make shell-backend
# จากนั้นรัน: ls -la /app/uploads
```

**หมายเหตุ:**

- ไฟล์ uploads จะถูกเก็บไว้ใน Docker volume ชื่อ `uploads-data`
- เมื่อ restart container ไฟล์จะยังคงอยู่
- การรัน `make clean` จะลบ volume รวมทั้งไฟล์ uploads ด้วย (ควร backup ก่อน!)
- Database เก็บ path ของไฟล์เป็น relative path เช่น `uploads/exhibitions/EXP1761332723861.png`

## Production Deployment (Docker)

สำหรับการ deploy ขึ้น production server (Ubuntu/Debian) ด้วย Docker

### ขั้นตอนโดยย่อ

```bash
# 1. SSH เข้า server แล้ว clone repository
git clone <repo-url> exhibitions-management-system
cd exhibitions-management-system

# 2. ติดตั้ง Docker (ครั้งแรกเท่านั้น)
chmod +x deploy.sh
./deploy.sh setup
# ออกจาก SSH แล้วเข้าใหม่เพื่อให้ docker group มีผล

# 3. สร้างไฟล์ .env.production จาก template
cp infra/docker/.env.production.example infra/docker/.env.production
nano infra/docker/.env.production   # แก้ค่าทั้งหมด

# 4. Deploy!
./deploy.sh deploy
```

### ค่าที่ต้องแก้ใน `.env.production`

- **`MYSQL_ROOT_PASSWORD`**, **`MYSQL_PASSWORD`** — ตั้งรหัสผ่านที่แข็งแกร่ง
- **`JWT_SECRET`**, **`QR_TOKEN_SECRET`** — สร้างด้วย `openssl rand -hex 32`
- **`ALLOWED_ORIGINS`** — URL ของ server เช่น `http://203.0.113.50`
- **`VITE_API_URL`** — เช่น `http://203.0.113.50/api/v1`
- **`VITE_BASE`** — เช่น `http://203.0.113.50`
- ค่า LINE และ LIFF ตามการตั้งค่าของ LINE Official Account

### คำสั่งที่ใช้บ่อย

| คำสั่ง                           | รายละเอียด                           |
| -------------------------------- | ------------------------------------ |
| `./deploy.sh deploy`             | Build และเริ่ม production containers |
| `./deploy.sh update`             | ดึงโค้ดล่าสุดแล้ว redeploy           |
| `./deploy.sh stop`               | หยุด containers ทั้งหมด              |
| `./deploy.sh status`             | ดูสถานะ containers                   |
| `./deploy.sh logs`               | ดู logs                              |
| `./deploy.sh backup`             | Backup database และ uploads          |
| `./deploy.sh restore <file.sql>` | Restore database จาก backup          |
| `make prod-rebuild`              | Rebuild แล้ว restart ทั้งหมด         |

### สถาปัตยกรรม Production

```
                  ┌─────────┐
  Client ──:80──▶ │  Nginx  │ (reverse proxy)
                  └────┬────┘
                 ┌─────┴─────┐
                 ▼           ▼
           ┌──────────┐ ┌──────────┐
           │ Frontend │ │ Backend  │
           │ (Nginx)  │ │ (Node)   │
           └──────────┘ └────┬─────┘
                             ▼
                       ┌──────────┐
                       │  MySQL   │
                       └──────────┘
```

- **Nginx reverse proxy** — รับ traffic บน port 80, route `/api/`, `/line/`, `/uploads/` ไปที่ backend, ที่เหลือไป frontend
- **Frontend** — Vite build → static files served ด้วย Nginx
- **Backend** — TypeScript compiled → Node.js production
- **MySQL** — พร้อม health check และ auto-restart

### การเพิ่ม SSL/HTTPS (ภายหลัง)

เมื่อได้ domain name แล้ว สามารถเพิ่ม Let's Encrypt SSL ได้โดย:

1. เพิ่ม certbot service ใน `docker-compose.prod.yml`
2. อัปเดต nginx config เพื่อรองรับ HTTPS
3. เปลี่ยน `ALLOWED_ORIGINS`, `VITE_API_URL`, `VITE_BASE` เป็น `https://`

## เคล็ดลับ & Troubleshooting

- เปลี่ยนค่าภายใน `.env` แล้วให้รัน `pnpm run docker:down` ตามด้วย `pnpm run docker:up` เพื่อให้ค่าใหม่มีผล
- ต้องการ rebuild image หลังเพิ่ม dependency: `docker compose -f infra/docker/docker-compose.yml build backend frontend`
- รีเซ็ตฐานข้อมูล (ข้อมูลหายหมด): `docker compose -f infra/docker/docker-compose.yml down -v`
- Backup ไฟล์ uploads ก่อนรัน `make clean`: ใช้ `make backup-uploads`
