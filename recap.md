# API Business Logic Recap

> เอกสารนี้อธิบาย Business Logic และ Data Flow ของแต่ละ API Endpoint เพื่อให้นักพัฒนาคนอื่นเข้าใจการทำงานของระบบได้อย่างรวดเร็ว

---

## 1. Ticket (QR-Code System)

**Files:**
- `apps/backend/src/controller/ticket-controller.ts`
- `apps/backend/src/queries/ticket-query.ts`

---

### 1.1 Visitor `GET /api/v1/ticket/` — Auth LIFF

**Dataflow:**
ผู้เข้าชม (Visitor) ที่ล็อกอินผ่าน LINE LIFF เรียกดูรายการนิทรรศการทั้งหมดที่ตนเองลงทะเบียนไว้ ระบบจะดึงข้อมูลจาก View `v_my_event_surveys` โดยกรองตาม `user_id` ของผู้ใช้

**Step-by-Step Logic:**
**รับ `user_id` จาก LIFF Token** → **Query ตาราง `v_my_event_surveys` ด้วย `user_id`** → **ส่งรายการนิทรรศการที่ลงทะเบียนทั้งหมดกลับไป (เรียงตาม `start_date` จากใหม่ไปเก่า)**

---

### 1.2 Visitor `GET /api/v1/ticket/qr-token` — Auth LIFF

**Dataflow:**
Visitor ร้องขอ QR Token สำหรับนิทรรศการที่ระบุ ระบบจะตรวจสอบว่าผู้ใช้ลงทะเบียนในนิทรรศการนั้นจริงหรือไม่ จากนั้นจะสร้าง JWT Token ที่มี `uid` (user_id) และ `eid` (exhibition_id) ฝังอยู่ โดยมีอายุ 5 นาที เพื่อนำไปแสดงเป็น QR Code ให้ Staff สแกน

**Step-by-Step Logic:**
**รับ `exhibition_id` จาก query string** → **เช็คว่า `exhibition_id` อยู่ในรายการที่ผู้ใช้ลงทะเบียนไว้หรือไม่ (จาก `req.lineUser.exhibitions`)** → **ถ้าไม่พบ → โยน 403 ACCESS_DENIED** → **ดึง `JWT_SECRET` จาก env** → **สร้าง JWT Token ด้วย payload `{ uid, eid }` หมดอายุใน 300 วินาที (5 นาที)** → **ส่ง `qr_token` และ `expires_in` กลับไป**

---

### 1.3 Visitor `GET /api/v1/ticket/check-in-status` — Auth LIFF

**Dataflow:**
Visitor ตรวจสอบสถานะการเช็คอินของตัวเองในนิทรรศการที่ระบุ ระบบจะค้นหา record ล่าสุดจากตาราง `units_checkins` แล้วส่งสถานะกลับไป

**Step-by-Step Logic:**
**รับ `exhibition_id` จาก query string** → **Query ตาราง `units_checkins` ด้วย `user_id` + `exhibition_id` (เอาล่าสุด 1 รายการ)** → **ถ้าไม่พบ record → โยน 404 REGISTRATION_NOT_FOUND** → **เช็คว่า `checkin_at` เป็น null หรือไม่ (ถ้าไม่ null = เช็คอินแล้ว)** → **ส่ง `checked_in`, `checkin_at`, `unit_id` กลับไป**

---

### 1.4 Visitor `GET /api/v1/ticket/checked-in-units` — Auth LIFF

**Dataflow:**
Visitor ดึงรายการจุด (Unit) ทั้งหมดที่ตนเองเช็คอินแล้วในนิทรรศการนั้น พร้อมสถานะว่าทำแบบสอบถามของแต่ละ Unit แล้วหรือยัง

**Step-by-Step Logic:**
**รับ `exhibition_id` จาก query string** → **Query ตาราง `units_checkins` JOIN `units` ด้วย `user_id` + `exhibition_id` (เฉพาะที่ `checkin_at IS NOT NULL`)** → **สำหรับแต่ละ Unit ที่เช็คอินแล้ว ดึง Sub-query นับจำนวน `survey_submissions` เพื่อดูว่าทำแบบสอบถามแล้วหรือยัง** → **ส่งรายการ `unit_id`, `unit_name`, `checkin_at`, `survey_completed` กลับไป (เรียงตามเวลาเช็คอินจากใหม่ไปเก่า)**

---

### 1.5 Visitor `GET /api/v1/ticket/current-exhibition` — Auth LIFF

**Dataflow:**
Visitor ดึง Exhibition ID ปัจจุบันที่ผูกกับบัญชี LINE ของตนเอง โดยเรียกใช้ฟังก์ชัน `getCurrentExhibitionByLineId` จากโมดูล `line-query`

**Step-by-Step Logic:**
**รับ `line_user_id` จาก LIFF Token** → **เรียก `getCurrentExhibitionByLineId(line_user_id)`** → **ส่ง `current_exhibition_id` กลับไป (อาจเป็น null ได้)**

---

### 1.6 Staff `POST /api/v1/ticket/verify` — Auth LIFF

**Dataflow:**
Staff สแกน QR Code ของ Visitor เพื่อบันทึกการเช็คอิน QR Code ประกอบด้วย JWT Token ที่ encode `uid` (visitor user_id) และ `eid` (exhibition_id) ไว้ ระบบจะ decode token แล้วตรวจสอบความถูกต้องหลายขั้นตอนก่อนบันทึกผลลง DB

**Step-by-Step Logic:**
**รับ `token` จาก request body** → **Decode JWT Token ด้วย `JWT_SECRET` (ถ้า token ไม่ถูกต้องหรือหมดอายุ → โยน 400 INVALID_QR_TOKEN)** → **แกะ `uid` (visitorId) และ `eid` (exhibitionId) ออกจาก payload** → **หาว่า Staff คนนี้คุม Unit ไหน (Query `unit_staffs` ด้วย `staff_user_id`) ถ้าไม่พบ → โยน 403 NO_UNIT_ASSIGNED** → **เช็คว่า Unit นี้อยู่ในงานนิทรรศการเดียวกับตั๋วไหม (Query `units` ด้วย `unit_id` แล้วเทียบ `exhibition_id`) ถ้าไม่ตรง → โยน 400 WRONG_EXHIBITION** → **เช็คว่า Visitor ลงทะเบียนมาไหม (Query `registrations` JOIN `normal_users`) ถ้าไม่พบ → โยน 404 USER_NOT_FOUND** → **เช็คว่าเคยสแกนที่ Unit นี้หรือยัง (Query `units_checkins` ด้วย `user_id` + `unit_id`) ถ้าเคยแล้ว → ส่ง 409 พร้อมข้อความ "สแกนซ้ำ!"** → **บันทึกการเช็คอิน INSERT INTO `units_checkins` (exhibition_id, user_id, unit_id, checkin_at = NOW())** → **ส่งผลสำเร็จพร้อมข้อมูล visitor (full_name, picture_url, checkin_at) กลับไป**

---

## 2. Survey

**Files:**
- `apps/backend/src/controller/survey-controller.ts`
- `apps/backend/src/queries/survey-query.ts`

---

### 2.1 Organizer `GET /api/v1/survey/questions-template` — Auth Organizer

**Dataflow:**
Organizer ดึงรายการคำถามทั้งหมดจากคลังคำถาม (Template Bank) สามารถกรองตาม `category` ได้

**Step-by-Step Logic:**
**รับ `category` จาก query string (optional)** → **Query ตาราง `questions_template`** → **ถ้ามี `category` ให้เพิ่ม WHERE clause กรอง** → **ส่งรายการ `qt_id`, `content`, `category` กลับไป (เรียงตาม `qt_id`)**

---

### 2.2 Organizer `POST /api/v1/survey/questions-template` — Auth Organizer

**Dataflow:**
Organizer สร้างคำถามใหม่ลงในคลังคำถาม สามารถสร้างได้หลายคำถามพร้อมกันใน request เดียว

**Step-by-Step Logic:**
**รับ array ของ `questions` (แต่ละตัวมี `content` และ `category`)** → **Validate ว่ามีอย่างน้อย 1 คำถาม** → **Bulk INSERT เข้า `questions_template`** → **ดึง record ที่เพิ่งสร้างจาก DB ด้วย insertId** → **ส่งรายการคำถามที่สร้างใหม่กลับไป (201)**

---

### 2.3 Organizer `PUT /api/v1/survey/questions-template/:id` — Auth Organizer

**Dataflow:**
Organizer แก้ไขคำถามในคลังคำถาม โดยระบุ `qt_id` ผ่าน URL param

**Step-by-Step Logic:**
**รับ `id` จาก URL param และ `content`, `category` จาก body** → **UPDATE ตาราง `questions_template` ด้วย `qt_id`** → **ดึง record ที่อัปเดตจาก DB** → **ถ้าไม่พบ → โยน 404 NOT_FOUND** → **ส่งคำถามที่อัปเดตกลับไป**

---

### 2.4 Organizer `DELETE /api/v1/survey/questions-template/:id` — Auth Organizer

**Dataflow:**
Organizer ลบคำถามจากคลังคำถาม (Hard Delete)

**Step-by-Step Logic:**
**รับ `id` จาก URL param** → **DELETE จาก `questions_template` ด้วย `qt_id`** → **ถ้า `affectedRows === 0` → โยน 404 NOT_FOUND** → **ส่ง 204 No Content กลับไป**

---

### 2.5 Public `GET /api/v1/survey/questions` — No Auth

**Dataflow:**
ดึงรายการคำถามของนิทรรศการที่ระบุ โดย JOIN ผ่าน `set_question_mapping` → `questions_template` → `question_sets` → `exhibitions` สามารถกรองตาม type (EXHIBITION หรือ UNIT) ได้

**Step-by-Step Logic:**
**รับ `exhibition_id` และ `type` (optional) จาก query string** → **Validate `exhibition_id`** → **Query JOIN ตาราง `set_question_mapping`, `questions_template`, `question_sets`, `exhibitions`** → **JOIN condition: ถ้า type = EXHIBITION ใช้ `e.exhibition_set_id` / ถ้า type = UNIT ใช้ `e.unit_set_id`** → **ส่งรายการคำถามพร้อมข้อมูล set (qt_id, set_id, content, sort_order, set_name, set_type, is_master) กลับไป**

---

### 2.6 Public `GET /api/v1/survey/master-questions` — No Auth

**Dataflow:**
ดึง Master Question Sets ตาม type (EXHIBITION หรือ UNIT) พร้อมคำถามทั้งหมดในแต่ละ set

**Step-by-Step Logic:**
**รับ `type` จาก query string** → **Query ตาราง `question_sets` JOIN `set_question_mapping` JOIN `questions_template` (เฉพาะ `is_master = 1`)** → **Group คำถามตาม `set_id` ใน application layer (Map)** → **ส่ง array ของ set พร้อม questions กลับไป**

---

### 2.7 Organizer `POST /api/v1/survey/questions` — Auth Organizer

**Dataflow:**
Organizer สร้าง Question Set ใหม่สำหรับนิทรรศการ โดย map `qt_id` จากคลังคำถามเข้ากับนิทรรศการ ทำงานใน Transaction เดียว

**Step-by-Step Logic:**
**รับ `exhibition_id`, `type`, `questions` (array ของ `{ qt_id, sort_order }`) จาก body** → **BEGIN TRANSACTION** → **Validate ว่านิทรรศการมีอยู่จริง (Query `exhibitions`)** → **เช็คว่านิทรรศการนี้มี question set ประเภทนี้อยู่แล้วหรือไม่ (ดู `exhibition_set_id` หรือ `unit_set_id`) ถ้ามีแล้ว → โยน 409 DUPLICATE** → **Validate ว่ามีอย่างน้อย 1 คำถาม** → **สร้าง Question Set ใหม่ใน `question_sets` (is_master = 0)** → **Bulk INSERT mapping ลง `set_question_mapping`** → **UPDATE ตาราง `exhibitions` ให้ชี้ไปยัง set_id ใหม่ (exhibition_set_id หรือ unit_set_id)** → **COMMIT** → **ดึง result กลับมา** → **ส่ง Question Set พร้อม questions กลับไป (201)**

---

### 2.8 Organizer `PUT /api/v1/survey/questions` — Auth Organizer

**Dataflow:**
Organizer อัปเดต Question Set ของนิทรรศการ โดยลบ mapping เก่าทั้งหมดแล้วแทนที่ด้วย mapping ใหม่ ทำงานใน Transaction เดียว

**Step-by-Step Logic:**
**รับ `exhibition_id`, `type`, `questions` จาก body** → **BEGIN TRANSACTION** → **Validate นิทรรศการมีอยู่จริง + ดึง `set_id` ปัจจุบัน** → **ถ้าไม่มี set_id → โยน 404 NOT_FOUND** → **Validate ว่ามีอย่างน้อย 1 คำถาม** → **DELETE mapping เก่าทั้งหมดจาก `set_question_mapping` ด้วย `set_id`** → **Bulk INSERT mapping ใหม่** → **COMMIT** → **ดึง result กลับมา** → **ส่ง Question Set พร้อม questions ที่อัปเดตแล้วกลับไป**

---

### 2.9 Visitor `GET /api/v1/survey/check-completed` — Auth LIFF

**Dataflow:**
Visitor ตรวจสอบว่าตัวเองทำแบบสอบถามของนิทรรศการหรือ Unit ที่ระบุแล้วหรือยัง

**Step-by-Step Logic:**
**รับ `exhibition_id` และ `unit_id` (optional) จาก query string** → **Validate user_id, exhibition_id, unit_id** → **ถ้าไม่มี `unit_id` → Query นับ `survey_submissions` ที่ `unit_id IS NULL` (แบบสอบถามระดับนิทรรศการ)** → **ถ้ามี `unit_id` → Query นับ `survey_submissions` ที่ตรงกับ `unit_id` นั้น** → **ส่ง `is_completed: true/false` กลับไป**

---

### 2.10 Visitor `POST /api/v1/survey/submit` — Auth LIFF

**Dataflow:**
Visitor ส่งคำตอบแบบสอบถาม ระบบจะตรวจสอบการลงทะเบียน ป้องกันการส่งซ้ำ หา set_id ที่ถูกต้อง แล้วบันทึกทั้ง submission และ answers ใน Transaction เดียว

**Step-by-Step Logic:**
**รับ `exhibition_id`, `unit_id` (optional), `comment`, `answers` (array ของ `{ qt_id, score }`) จาก body** → **BEGIN TRANSACTION** → **เช็คว่า Visitor ลงทะเบียนในนิทรรศการนี้หรือไม่ (Query `registrations`) ถ้าไม่ → โยน 403 NOT_REGISTERED** → **เช็คว่าเคยส่งแบบสอบถามนี้แล้วหรือยัง (Query `survey_submissions`) ถ้าเคยแล้ว → โยน 409 DUPLICATE_SUBMISSION** → **หา `set_id` จากนิทรรศการ: ถ้าไม่มี `unit_id` ใช้ `exhibition_set_id` / ถ้ามี `unit_id` ใช้ `unit_set_id`** → **ถ้าไม่พบ set_id → โยน 404 NOT_FOUND** → **INSERT ลง `survey_submissions`** → **Bulk INSERT คำตอบลง `survey_answers` ด้วย `(submission_id, set_id, qt_id, score)`** → **COMMIT** → **ดึง submission + answers ที่เพิ่งบันทึกจาก DB** → **ส่งผลลัพธ์กลับไป (201)**

---

## 3. Certificate

**Files:**
- `apps/backend/src/controller/certificate-template-controller.ts`
- `apps/backend/src/queries/certificate-template-query.ts`
- `apps/backend/src/services/certificate-generator.ts`

---

### 3.1 Public `GET /api/v1/exhibitions/:exhibitionId/certificate-template` — No Auth

**Dataflow:**
ดึงข้อมูล Certificate Template ของนิทรรศการที่ระบุ รวมถึง background URL, layout config และข้อมูลนิทรรศการ

**Step-by-Step Logic:**
**รับ `exhibitionId` จาก URL param** → **Query ตาราง `certificate_templates` JOIN `exhibitions`** → **ถ้าไม่พบ → ส่ง 404 NOT_FOUND** → **ส่ง template data กลับไป (template_id, exhibition_id, exhibition_code, exhibition_title, organizer_name, background_url, layout_config, created_at, updated_at)**

---

### 3.2 Organizer `POST /api/v1/exhibitions/:exhibitionId/certificate-template` — Auth Organizer (Multipart)

**Dataflow:**
Organizer สร้าง Certificate Template ใหม่สำหรับนิทรรศการ โดยอัปโหลดไฟล์ background image (PNG/JPG) ผ่าน multipart/form-data พร้อม layout_config (optional)

**Step-by-Step Logic:**
**รับ `exhibitionId` จาก URL param** → **ประมวลผล multipart form: บันทึกไฟล์ลง `uploads/certificates/templates/`** → **ถ้าไม่มีไฟล์ → โยน 400 VALIDATION_ERROR** → **ถ้ามี `layout_config` ใน field → parse เป็น JSON** → **เช็คว่านิทรรศการมีอยู่จริง (Query `exhibitions`) ถ้าไม่ → โยน 404** → **เช็คว่ามี template อยู่แล้วหรือไม่ ถ้ามี → โยน 409 CONFLICT** → **INSERT ลง `certificate_templates` (exhibition_id, background_url, layout_config)** → **ดึง template ที่สร้างจาก DB** → **ส่ง template กลับไป (201)**

---

### 3.3 Organizer `PUT /api/v1/exhibitions/:exhibitionId/certificate-template` — Auth Organizer (Multipart)

**Dataflow:**
Organizer อัปเดต Certificate Template โดยสามารถเปลี่ยน background image และ/หรือ layout_config ได้ ถ้าอัปโหลดไฟล์ใหม่ ไฟล์เก่าจะถูกลบออกจาก disk

**Step-by-Step Logic:**
**รับ `exhibitionId` จาก URL param** → **ดึง template เดิมจาก DB (เพื่อเอา URL ไฟล์เก่า)** → **ประมวลผล multipart form: บันทึกไฟล์ใหม่ (ถ้ามี)** → **ถ้ามีไฟล์ใหม่ → เซ็ต `background_url`** → **ถ้ามี `layout_config` → parse เป็น JSON** → **ถ้าไม่มีทั้งไฟล์และ layout_config → โยน 400 VALIDATION_ERROR** → **UPDATE ตาราง `certificate_templates`** → **ถ้า `affectedRows === 0` → โยน 404** → **ถ้าอัปโหลดไฟล์ใหม่ + มีไฟล์เก่า → ลบไฟล์เก่าจาก disk** → **ส่ง template ที่อัปเดตแล้วกลับไป**

---

### 3.4 Organizer `DELETE /api/v1/exhibitions/:exhibitionId/certificate-template` — Auth Organizer

**Dataflow:**
Organizer ลบ Certificate Template พร้อมลบไฟล์ background จาก disk

**Step-by-Step Logic:**
**รับ `exhibitionId` จาก URL param** → **ดึง template เดิมจาก DB (เพื่อเอา URL ไฟล์)** → **DELETE จาก `certificate_templates`** → **ถ้า `affectedRows === 0` → โยน 404** → **ลบไฟล์ background จาก disk (ถ้ามี)** → **ส่ง 204 No Content กลับไป**

---

### 3.5 Public `GET /api/v1/exhibitions/:exhibitionId/certificates/:userId/preview` — Optional Auth

**Dataflow:**
ดึงข้อมูล preview ของใบประกาศนียบัตร ประกอบด้วย template data และชื่อผู้เข้าร่วม เพื่อแสดง preview ก่อนดาวน์โหลด

**Step-by-Step Logic:**
**รับ `exhibitionId` และ `userId` จาก URL params** → **ดึง Certificate Template จาก DB ถ้าไม่พบ → ส่ง 404** → **ดึงชื่อผู้เข้าร่วมจาก `registrations` JOIN `normal_users` ถ้าไม่พบ → ส่ง 404 (User not registered)** → **ส่ง `template` + `participantName` กลับไป**

---

### 3.6 Public `GET /api/v1/exhibitions/:exhibitionId/certificates/:userId/download` — Optional Auth

**Dataflow:**
Generate ใบประกาศนียบัตรเป็น PDF แล้วส่งให้ดาวน์โหลด ระบบจะตรวจสอบว่า Visitor เช็คอินครบทุก Unit แล้วหรือยัง (ยกเว้น Admin ส่ง `?skipValidation=true`) จากนั้นใช้ `pdf-lib` วาดชื่อผู้เข้าร่วมลงบนภาพพื้นหลัง พร้อมรองรับฟอนต์ภาษาไทย (Noto Sans Thai)

**Step-by-Step Logic:**
**รับ `exhibitionId`, `userId` จาก URL params และ `skipValidation` จาก query string** → **เช็คว่าเป็น Admin skip หรือไม่ (`skipValidation === "true"` + มี `req.user`)** → **ดึง Certificate Template จาก DB ถ้าไม่พบ → ส่ง 404** → **ดึงชื่อผู้เข้าร่วมจาก `registrations` JOIN `normal_users` ถ้าไม่พบ → ส่ง 404** → **ถ้าไม่ใช่ Admin skip:**
- **นับจำนวน Unit ทั้งหมดของนิทรรศการ (`units` table) และจำนวน Unit ที่เช็คอินแล้ว (`units_checkins` table)**
- **ถ้า `total_units === 0` → ส่ง 403 NO_UNITS_CONFIGURED**
- **ถ้าเช็คอินไม่ครบ → ส่ง 403 INCOMPLETE_CHECKINS พร้อม details (total, checked_in, missing)**

→ **เริ่ม Generate PDF:**
1. **สร้าง PDF Document ใหม่ + ลงทะเบียน fontkit**
2. **โหลดไฟล์ background image + font (Noto Sans Thai)**
3. **Embed รูปภาพ (PNG/JPG) + font ลงใน PDF**
4. **ตั้งขนาดหน้าตามขนาด background image**
5. **วาด background image เต็มหน้า**
6. **วาดชื่อผู้เข้าร่วมตาม `layout_config.participant_name` (x, y, font_size, color, align)** — แกน Y แปลงจากบนลงล่างเป็นล่างขึ้นบน (pdf-lib convention)
7. **Save เป็น PDF Buffer**

→ **ส่ง PDF กลับไปพร้อม `Content-Disposition: attachment` (รองรับ filename ภาษาไทยด้วย RFC 5987)**

---

## 4. News and Announcement

**Files:**
- `apps/backend/src/controller/news-controller.ts`
- `apps/backend/src/queries/news-query.ts`

---

### 4.1 Public `GET /api/v1/news/` — No Auth

**Dataflow:**
ดึงรายการประกาศทั้งหมดที่ active อยู่ เรียงจากใหม่ไปเก่า

**Step-by-Step Logic:**
**Query ตาราง `exhibition_announcements` WHERE `is_active = 1`** → **เรียงตาม `created_at DESC`** → **ส่งรายการประกาศทั้งหมดกลับไป**

---

### 4.2 Public `GET /api/v1/news/:id` — No Auth

**Dataflow:**
ดึงรายการประกาศทั้งหมดของนิทรรศการที่ระบุ (กรองตาม `exhibition_id`)

**Step-by-Step Logic:**
**รับ `id` (exhibition_id) จาก URL param** → **Validate เป็นตัวเลข** → **Query ตาราง `exhibition_announcements` WHERE `exhibition_id = ?` AND `is_active = 1`** → **ถ้าไม่พบ → โยน 404 NOT_FOUND** → **ส่งรายการประกาศกลับไป (เรียงจากใหม่ไปเก่า)**

---

### 4.3 Organizer `POST /api/v1/news/` — Auth Organizer

**Dataflow:**
Organizer สร้างประกาศใหม่ รองรับทั้ง JSON body และ multipart/form-data (สำหรับอัปโหลดรูปภาพ)

**Step-by-Step Logic:**
**ตรวจสอบ `req.user` ถ้าไม่มี → โยน 401 UNAUTHORIZED** → **เช็คว่าเป็น multipart หรือไม่:**
- **ถ้าเป็น multipart → ประมวลผลไฟล์: บันทึกรูปลง `uploads/news/` → parse fields เป็น payload**
- **ถ้าเป็น JSON → parse body ด้วย `AnnoucncementsPayload` schema**

→ **INSERT ลง `exhibition_announcements` (exhibition_id, topic, description, description_delta, image_url, is_active)** → **ส่ง `{ message, id }` กลับไป (201)**

---

### 4.4 Organizer `PATCH /api/v1/news/:id` — Auth Organizer

**Dataflow:**
Organizer แก้ไขประกาศ รองรับทั้ง JSON body และ multipart/form-data ถ้าอัปโหลดรูปใหม่ ไฟล์เก่าจะถูกลบ

**Step-by-Step Logic:**
**ตรวจสอบ `req.user`** → **รับ `id` (announcement_id) จาก URL param** → **เช็คว่าเป็น multipart หรือไม่:**
- **ถ้าเป็น multipart → ดึงประกาศเดิมจาก DB → ประมวลผลไฟล์ → สร้าง payload จาก fields ที่ส่งมา (เฉพาะ field ที่มีค่า) → ถ้ามีรูปใหม่ + มีรูปเก่า → ลบไฟล์เก่าจาก disk**
- **ถ้าเป็น JSON → parse body ด้วย `UpdateAnnouncementPayload` schema**

→ **สร้าง dynamic SET clause จาก fields ที่ต้องอัปเดต** → **UPDATE `exhibition_announcements`** → **ถ้า `affectedRows === 0` → โยน 404** → **ส่ง `{ message: "Announcement updated" }` กลับไป**

---

### 4.5 Organizer `DELETE /api/v1/news/:id` — Auth Organizer

**Dataflow:**
Organizer ลบประกาศ (Hard Delete)

**Step-by-Step Logic:**
**ตรวจสอบ `req.user`** → **รับ `id` จาก URL param** → **DELETE จาก `exhibition_announcements` WHERE `announcement_id = ?`** → **ถ้า `affectedRows === 0` → โยน 404** → **ส่ง `{ message: "Announcement deleted" }` กลับไป**

---

## 5. Dashboard

**Files:**
- `apps/backend/src/controller/dashboard-controller.ts`
- `apps/backend/src/queries/dashboard-query.ts`

---

### 5.1 Staff `GET /api/v1/dashboard/staff/me` — Auth LIFF

**Dataflow:**
Staff ที่ล็อกอินผ่าน LIFF เรียกดูว่าตัวเองถูกมอบหมายให้ดูแล Unit ไหนในนิทรรศการใด เพื่อใช้เป็น parameter ต่อไปเรียก Dashboard data

**Step-by-Step Logic:**
**รับ `user_id` จาก LIFF Token** → **Query `unit_staffs` JOIN `units` ด้วย `staff_user_id`** → **ถ้าไม่พบ → โยน 404 NO_UNIT_ASSIGNED** → **ส่ง `{ ex_id, unit_id }` กลับไป**

---

### 5.2 Public `GET /api/v1/dashboard/staff/:ex_id/:unit_id` — No Auth

**Dataflow:**
ดึงข้อมูล Staff Dashboard สำหรับ Unit ที่ระบุ ประกอบด้วยข้อมูล Staff, รายละเอียด Unit, ข้อมูลนิทรรศการ, สถิติ (จำนวนเช็คอิน, จำนวนรีวิว, คะแนนเฉลี่ย) และ feedback breakdown รายข้อ

**Step-by-Step Logic:**
**รับ `ex_id` และ `unit_id` จาก URL params** → **Query View `v_staff_dashboard_stats` JOIN `normal_users` ด้วย `exhibition_id` + `unit_id` เพื่อดึง:**
- **ข้อมูล Staff (staff_id, staff_name)**
- **รายละเอียด Unit (unit_id, unit_code, unit_name, unit_type, description, poster_url, detail_pdf_url, starts_at, ends_at)**
- **ข้อมูลนิทรรศการ (exhibition_id, exhibition_title, exhibition_location, exhibition_status)**
- **สถิติ (total_visitors, total_reviews, average_score)**

→ **ถ้าไม่พบ → โยน 404 NOT_FOUND** → **Query View `v_staff_dashboard_question_scores` ด้วย `unit_id` เพื่อดึง feedback breakdown (qt_id, topic, score, response_count)** → **รวมทุกอย่างเข้าเป็น response object** → **ส่งกลับไป**

---

### 5.3 Public `GET /api/v1/dashboard/organizer/:id` — No Auth

**Dataflow:**
ดึงข้อมูล Organizer Dashboard สำหรับนิทรรศการที่ระบุ ข้อมูลครอบคลุม KPIs, demographics, feedback, comments และสถิติรายบูธ ใช้ parallel queries เพื่อประสิทธิภาพ

**Step-by-Step Logic:**
**รับ `id` (exhibition_id) จาก URL param** → **ดึง KPIs จาก View `v_org_dashboard_kpis` (total_registrations, total_units, total_checkins, exhibition_avg_score)** → **ดึง Demographics - Gender: Query `normal_users` JOIN `registrations` GROUP BY `gender`** → **ดึง Demographics - Age Groups: คำนวณช่วงอายุจาก `birthdate` ด้วย `TIMESTAMPDIFF` แบ่งเป็น 4 กลุ่ม (ต่ำกว่า 18, 18-24, 25-34, 35+) พร้อมคำนวณเปอร์เซ็นต์** → **ดึง Feedback Breakdown (ระดับนิทรรศการ) จาก View `v_org_exhibition_feedback_stats`** → **ดึง Recent Comments: 5 ความคิดเห็นล่าสุดจาก `survey_submissions` ที่ `unit_id IS NULL`** → **ดึงสถิติรายบูธจาก View `v_org_unit_stats` (id, name, type, checkins, rating)** → **สำหรับแต่ละ Unit ดึง feedback details และ recent comments แบบ parallel:**
- **Feedback Details: Query `survey_submissions` JOIN `survey_answers` JOIN `questions_template` GROUP BY `qt_id` (ได้ topic + average score)**
- **Recent Comments: 3 ความคิดเห็นล่าสุดของ Unit นั้น**

→ **รวมทุกอย่างเข้าเป็น response object ส่งกลับไป**

---

## สรุป Authentication Types

| Auth Type | ใช้กับ | วิธีการ |
|-----------|--------|---------|
| **Auth LIFF** | Visitor / Staff ผ่าน LINE | `requireLiffAuth` — ตรวจสอบ LINE LIFF Token, inject `req.lineUser` |
| **Auth Organizer** | Organizer / Admin | `requireOrganizerAuth` — ตรวจสอบ session/token ของ Organizer, inject `req.user` |
| **Optional Auth** | Public + Admin features | `optionalAuth` — ถ้ามี token จะ decode, ถ้าไม่มีก็ผ่านได้ |
| **No Auth** | Public endpoints | ไม่มี preHandler — เปิดให้เข้าถึงได้โดยไม่ต้อง login |

---

## สรุป Database Tables & Views ที่เกี่ยวข้อง

| Table / View | ใช้ใน Module |
|---|---|
| `normal_users` | Ticket, Survey, Certificate, Dashboard |
| `registrations` | Ticket, Survey, Certificate |
| `units` | Ticket, Certificate, Dashboard |
| `unit_staffs` | Ticket, Dashboard |
| `units_checkins` | Ticket, Certificate, Dashboard |
| `questions_template` | Survey, Dashboard |
| `question_sets` | Survey |
| `set_question_mapping` | Survey |
| `survey_submissions` | Survey, Ticket, Dashboard |
| `survey_answers` | Survey, Dashboard |
| `exhibitions` | Survey, Certificate, Dashboard |
| `certificate_templates` | Certificate |
| `exhibition_announcements` | News |
| `v_my_event_surveys` (view) | Ticket |
| `v_staff_dashboard_stats` (view) | Dashboard |
| `v_staff_dashboard_question_scores` (view) | Dashboard |
| `v_org_dashboard_kpis` (view) | Dashboard |
| `v_org_exhibition_feedback_stats` (view) | Dashboard |
| `v_org_unit_stats` (view) | Dashboard |
