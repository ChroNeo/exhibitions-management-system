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

## เคล็ดลับ & Troubleshooting
- เปลี่ยนค่าภายใน `.env` แล้วให้รัน `pnpm run docker:down` ตามด้วย `pnpm run docker:up` เพื่อให้ค่าใหม่มีผล
- ต้องการ rebuild image หลังเพิ่ม dependency: `docker compose -f infra/docker/docker-compose.yml build backend frontend`
- รีเซ็ตฐานข้อมูล (ข้อมูลหายหมด): `docker compose -f infra/docker/docker-compose.yml down -v`
