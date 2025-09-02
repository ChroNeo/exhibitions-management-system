*** ติดตั้งครั้งแรกหลังโคลน ***
```bash
      # ติดตั้ง dependency ของทั้ง monorepo
      pnpm install

      # สตาร์ท DB (MySQL + phpMyAdmin)
      pnpm run docker:up
```
*** การรันตอนพัฒนา ***
```bash
      # รัน frontend + backend พร้อมกัน
      pnpm run dev

      # รันเฉพาะ frontend
      pnpm --filter @ems/frontend dev

      # รันเฉพาะ backend
      pnpm --filter @ems/backend dev

      # หยุด Docker (DB)
      pnpm run docker:down
```
*** Frontend (React + Vite) ***
```bash
      # เข้าโฟลเดอร์ frontend
      cd apps/frontend

      # เพิ่ม dependency
      pnpm --filter @ems/frontend add axios

      # เพิ่ม devDependency
      pnpm --filter @ems/frontend add -D tailwindcss
```
*** Backend (Fastify v5 + @fastify/cors) ***
```bash
# เข้าโฟลเดอร์ backend
      cd apps/backend

      # เพิ่ม dependency
      pnpm --filter @ems/backend add zod

      # เพิ่ม devDependency
      pnpm --filter @ems/backend add -D nodemon
```