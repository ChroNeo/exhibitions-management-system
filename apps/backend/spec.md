Flow ของ API ต่างๆ นะจ่ะ

---

## 1. ระบบ QR Code / Ticket API

### รายการ Endpoints ทั้งหมด

| Endpoint                          | Method | คำอธิบาย                                |
| --------------------------------- | ------ | --------------------------------------- |
| `/api/v1/ticket/`                 | GET    | ดึงรายการนิทรรศการที่ผู้ใช้ลงทะเบียนไว้ |
| `/api/v1/ticket/qr-token`         | GET    | สร้าง QR Token สำหรับ check-in          |
| `/api/v1/ticket/check-in-status`  | GET    | ตรวจสอบสถานะ check-in ของผู้ใช้         |
| `/api/v1/ticket/checked-in-units` | GET    | ดึงรายการ unit ที่ผู้ใช้ check-in แล้ว  |
| `/api/v1/ticket/verify`           | POST   | Staff ใช้ scan QR แล้วบันทึก check-in   |

---

### ไฟล์ที่เกี่ยวข้อง

| ประเภท     | ไฟล์                                  | หน้าที่                       |
| ---------- | ------------------------------------- | ----------------------------- |
| Controller | `src/controller/ticket-controller.ts` | จัดการ API endpoints          |
| Queries    | `src/queries/ticket-query.ts`         | Query ฐานข้อมูล               |
| Models     | `src/models/ticket.model.ts`          | Zod schemas สำหรับ validation |
| Auth       | `src/services/auth-middleware.ts`     | ตรวจสอบ LIFF Token            |
| JWT        | `src/services/jwt.ts`                 | สร้าง/ตรวจสอบ JWT Token       |

---

### Flow การทำงาน

```
┌─────────────────────────────────────────────────────────────────┐
│                    ผู้ใช้ลงทะเบียนนิทรรศการแล้ว                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. ผู้ใช้ขอ QR Token                                             │
│     GET /api/v1/ticket/qr-token?exhibition_id=xxx               │
│     - ต้องมี LIFF Token ใน Header                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ระบบสร้าง JWT Token                                          │
│     payload: { uid, eid, type: "access" }                       │
│     หมดอายุใน 5 นาที (300 วินาที)                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Frontend แสดง QR Code จาก Token                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Staff scan QR Code                                          │
│     POST /api/v1/ticket/verify                                  │
│     body: { qr_token: "xxx" }                                   │
│     - ต้องมี Organizer JWT Token ใน Header                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. ระบบตรวจสอบ                                                  │
│     - Token ยังไม่หมดอายุ?                                        │
│     - Staff อยู่ใน unit ของ exhibition นี้?                        │
│     - ผู้ใช้ลงทะเบียน exhibition นี้จริง?                            │
│     - ยังไม่เคย check-in unit นี้?                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. บันทึก Check-in                                              │
│     INSERT INTO units_checkins (user_id, unit_id, checked_at)  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. ผู้ใช้ดูสถานะได้                                               │
│     GET /api/v1/ticket/check-in-status                          │
│     GET /api/v1/ticket/checked-in-units                         │
└─────────────────────────────────────────────────────────────────┘
```

---

### ตาราง Database ที่เกี่ยวข้อง

| ตาราง                | หน้าที่                             |
| -------------------- | ----------------------------------- |
| `registrations`      | เก็บข้อมูลการลงทะเบียนเข้านิทรรศการ |
| `units_checkins`     | เก็บ record การ check-in            |
| `unit_staffs`        | เก็บข้อมูล staff ประจำ unit         |
| `units`              | เก็บข้อมูล unit/booth ในนิทรรศการ   |
| `normal_users`       | ข้อมูลผู้ใช้                        |
| `v_my_event_surveys` | View สำหรับดึงข้อมูล ticket         |

---

### Response ตัวอย่าง

**GET /api/v1/ticket/qr-token**

```json
{
  "qr_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 300
}
```

**POST /api/v1/ticket/verify (สำเร็จ)**

```json
{
  "success": true,
  "message": "Check-in successful",
  "user": {
    "name": "ชื่อผู้ใช้",
    "profile_image": "url..."
  }
}
```

**POST /api/v1/ticket/verify (ซ้ำ)**

```json
{
  "success": false,
  "message": "Already checked in",
  "checked_at": "2024-01-01T10:00:00Z"
}
```

---

## 2. ระบบ Survey

### รายการ Endpoints ทั้งหมด

| Endpoint                          | Method | Auth      | คำอธิบาย                                    |
| --------------------------------- | ------ | --------- | ------------------------------------------- |
| `/api/v1/surveys/questions`       | GET    | -         | ดึงคำถามตาม exhibition_id                   |
| `/api/v1/surveys/master-questions`| GET    | -         | ดึง master question sets ทั้งหมด            |
| `/api/v1/surveys/questions`       | POST   | Organizer | สร้างชุดคำถามใหม่สำหรับ exhibition          |
| `/api/v1/surveys/questions`       | PUT    | Organizer | แก้ไขชุดคำถามของ exhibition                 |
| `/api/v1/surveys/check-completed` | GET    | LIFF      | ตรวจสอบว่าผู้ใช้ทำ survey แล้วหรือยัง       |
| `/api/v1/surveys/submit`          | POST   | LIFF      | ส่งคำตอบ survey                             |

---

### ไฟล์ที่เกี่ยวข้อง

| ประเภท     | ไฟล์                                  | หน้าที่                       |
| ---------- | ------------------------------------- | ----------------------------- |
| Controller | `src/controller/survey-controller.ts` | จัดการ API endpoints          |
| Queries    | `src/queries/survey-query.ts`         | Query ฐานข้อมูล               |
| Models     | `src/models/survey.model.ts`          | Zod schemas สำหรับ validation |

---

### ประเภท Survey

ระบบมี 2 ประเภท:

| Type         | คำอธิบาย                          |
| ------------ | --------------------------------- |
| `EXHIBITION` | Survey ระดับนิทรรศการ (ภาพรวม)    |
| `UNIT`       | Survey ระดับ unit/booth (รายบูธ) |

---

### Flow การทำงาน

#### Flow 1: Organizer สร้างชุดคำถาม

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Organizer ดู Master Questions                               │
│     GET /api/v1/surveys/master-questions?type=EXHIBITION        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. เลือกใช้ master หรือสร้างคำถามเอง                             │
│     POST /api/v1/surveys/questions                              │
│     body: {                                                     │
│       exhibition_id: 1,                                         │
│       type: "EXHIBITION",                                       │
│       question_topics: ["คำถาม1", "คำถาม2", ...]               │
│     }                                                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. ระบบสร้าง question_set + questions                          │
│     อัพเดท exhibition.exhibition_set_id หรือ unit_set_id       │
└─────────────────────────────────────────────────────────────────┘
```

#### Flow 2: ผู้ใช้ทำ Survey

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ผู้ใช้เปิดหน้า Survey                                         │
│     GET /api/v1/surveys/questions?exhibition_id=1&type=EXHIBITION│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ตรวจสอบว่าทำไปแล้วหรือยัง                                     │
│     GET /api/v1/surveys/check-completed                         │
│     query: { exhibition_id, unit_id? }                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌───────────┐           ┌───────────────┐
            │ ทำแล้ว     │           │ ยังไม่ได้ทำ    │
            │ แสดงข้อความ │           │ แสดงฟอร์ม     │
            └───────────┘           └───────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. ผู้ใช้ส่งคำตอบ                                                │
│     POST /api/v1/surveys/submit                                 │
│     body: {                                                     │
│       exhibition_id: 1,                                         │
│       unit_id: null,  // หรือ unit_id ถ้าเป็น unit survey       │
│       comment: "ความคิดเห็น...",                                │
│       answers: [                                                │
│         { question_id: 1, score: 5 },                           │
│         { question_id: 2, score: 4 }                            │
│       ]                                                         │
│     }                                                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. ระบบตรวจสอบ                                                  │
│     - ผู้ใช้ลงทะเบียน exhibition นี้จริง?                          │
│     - ยังไม่เคยทำ survey นี้?                                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. บันทึกผล                                                     │
│     INSERT INTO survey_submissions (...)                        │
│     INSERT INTO survey_answers (...)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### ตาราง Database ที่เกี่ยวข้อง

| ตาราง               | หน้าที่                                    |
| ------------------- | ------------------------------------------ |
| `question_sets`     | ชุดคำถาม (is_master=1 คือ template)        |
| `questions`         | คำถามแต่ละข้อ                              |
| `survey_submissions`| การส่ง survey ของผู้ใช้                    |
| `survey_answers`    | คำตอบแต่ละข้อ (score 1-5)                  |

**Database Views:**

| View                       | หน้าที่                                  |
| -------------------------- | ---------------------------------------- |
| `v_exhibition_feedback`    | ดู feedback ระดับ exhibition             |
| `v_unit_feedback`          | ดู feedback ระดับ unit                   |
| `v_stats_score_by_question`| สถิติคะแนนเฉลี่ยแยกตามคำถาม              |

---

### Response ตัวอย่าง

**GET /api/v1/surveys/questions**

```json
{
  "questions": [
    {
      "question_id": 1,
      "topic": "ความสะอาดและความปลอดภัย",
      "set_id": 101,
      "set_name": "Set for AI Expo"
    },
    {
      "question_id": 2,
      "topic": "การให้บริการของเจ้าหน้าที่",
      "set_id": 101,
      "set_name": "Set for AI Expo"
    }
  ]
}
```

**GET /api/v1/surveys/master-questions**

```json
{
  "question_sets": [
    {
      "set_id": 1,
      "name": "Master Exhibition Standard",
      "type": "EXHIBITION",
      "is_master": true,
      "questions": [
        { "question_id": 1, "topic": "ความสะอาดและความปลอดภัย" },
        { "question_id": 2, "topic": "การประชาสัมพันธ์ข้อมูล" }
      ]
    }
  ]
}
```

**POST /api/v1/surveys/submit (สำเร็จ)**

```json
{
  "submission_id": 1,
  "exhibition_id": 1,
  "unit_id": null,
  "comment": "งานดีมาก!",
  "answers": [
    { "question_id": 1, "score": 5 },
    { "question_id": 2, "score": 4 }
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
```

**POST /api/v1/surveys/submit (ทำไปแล้ว)**

```json
{
  "error": "Already submitted survey for this exhibition"
}
```

---

## 3. ระบบ Certificate

### รายการ Endpoints ทั้งหมด

| Endpoint                                              | Method | Auth      | คำอธิบาย                         |
| ----------------------------------------------------- | ------ | --------- | -------------------------------- |
| `/api/v1/exhibitions/:exhibitionId/certificate-template`        | GET    | Optional  | ดึงข้อมูล template เกียรติบัตร   |
| `/api/v1/exhibitions/:exhibitionId/certificate-template`        | POST   | Organizer | สร้าง template เกียรติบัตรใหม่   |
| `/api/v1/exhibitions/:exhibitionId/certificate-template`        | PUT    | Organizer | แก้ไข template เกียรติบัตร       |
| `/api/v1/exhibitions/:exhibitionId/certificate-template`        | DELETE | Organizer | ลบ template เกียรติบัตร          |
| `/api/v1/exhibitions/:exhibitionId/certificates/:userId/preview`| GET    | Optional  | ดูตัวอย่างข้อมูลเกียรติบัตร       |
| `/api/v1/exhibitions/:exhibitionId/certificates/:userId/download`| GET   | Optional  | ดาวน์โหลดเกียรติบัตร (PDF)       |

---

### ไฟล์ที่เกี่ยวข้อง

| ประเภท     | ไฟล์                                               | หน้าที่                        |
| ---------- | -------------------------------------------------- | ------------------------------ |
| Controller | `src/controller/certificate-template-controller.ts`| จัดการ API endpoints           |
| Queries    | `src/queries/certificate-template-query.ts`        | Query ฐานข้อมูล                |
| Models     | `src/models/certificate-template.model.ts`         | Zod schemas สำหรับ validation  |
| Generator  | `src/services/certificate-generator.ts`            | สร้าง PDF เกียรติบัตร          |

---

### โครงสร้าง Layout Config

Template เกียรติบัตรประกอบด้วย:
- **background_url** - รูปพื้นหลัง (PNG/JPG)
- **layout_config** - ตำแหน่งข้อความต่างๆ

```json
{
  "participant_name": {
    "x": 400,
    "y": 300,
    "font_size": 36,
    "color": "#000000",
    "align": "center"
  },
  "exhibition_title": {
    "x": 400,
    "y": 200,
    "font_size": 24,
    "color": "#333333",
    "align": "center"
  },
  "date": {
    "x": 400,
    "y": 450,
    "font_size": 18,
    "color": "#666666",
    "align": "center"
  },
  "organizer_name": {
    "x": 400,
    "y": 500,
    "font_size": 18,
    "color": "#666666",
    "align": "center"
  }
}
```

---

### Flow การทำงาน

#### Flow 1: Organizer สร้าง Template

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Organizer อัพโหลดรูปพื้นหลัง + ตั้งค่า layout                  │
│     POST /api/v1/exhibitions/:id/certificate-template           │
│     Content-Type: multipart/form-data                           │
│     - background_image: (file)                                  │
│     - layout_config: (JSON string)                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ระบบบันทึก                                                   │
│     - เซฟไฟล์ไปที่ uploads/certificates/templates/              │
│     - บันทึกข้อมูลลง certificate_templates table                │
└─────────────────────────────────────────────────────────────────┘
```

#### Flow 2: ผู้ใช้ดาวน์โหลดเกียรติบัตร

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ผู้ใช้กดดาวน์โหลดเกียรติบัตร                                    │
│     GET /api/v1/exhibitions/:id/certificates/:userId/download   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ระบบตรวจสอบ                                                  │
│     - ดึง template ของ exhibition                               │
│     - ดึงชื่อผู้ใช้จาก registrations                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. สร้าง PDF                                                    │
│     - โหลดรูปพื้นหลัง                                             │
│     - วางข้อความตาม layout_config                                │
│     - ใช้ฟอนต์ไทย (NotoSansThaiRegular.ttf)                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. ส่ง PDF กลับ                                                 │
│     Content-Type: application/pdf                               │
│     Content-Disposition: attachment; filename="certificate.pdf" │
└─────────────────────────────────────────────────────────────────┘
```

#### Flow 3: LINE Bot ส่งข้อความเกียรติบัตร

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ผู้ใช้พิมพ์ "เกียรติบัตร" หรือ "ใบประกาศ" ใน LINE            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ระบบตรวจสอบ                                                  │
│     - ดึง registrations ของผู้ใช้                                │
│     - ดูสถานะ check-in ของแต่ละ unit                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. ส่ง Flex Message                                            │
│     - แสดง progress bar (เช็คอินกี่ unit แล้ว)                   │
│     - ถ้าครบทุก unit → แสดงปุ่มดาวน์โหลด                         │
│     - ถ้ายังไม่ครบ → แสดงสถานะที่ต้องทำต่อ                       │
└─────────────────────────────────────────────────────────────────┘
```

---

### ตาราง Database ที่เกี่ยวข้อง

| ตาราง                  | หน้าที่                                |
| ---------------------- | -------------------------------------- |
| `certificate_templates`| เก็บ template เกียรติบัตรของแต่ละงาน   |
| `exhibitions`          | ข้อมูลนิทรรศการ                        |
| `registrations`        | ข้อมูลผู้ลงทะเบียน (ดึงชื่อ)           |
| `normal_users`         | ข้อมูลผู้ใช้                           |

**Schema ของ certificate_templates:**

```sql
CREATE TABLE certificate_templates (
  template_id INT PRIMARY KEY AUTO_INCREMENT,
  exhibition_id INT NOT NULL,
  background_url VARCHAR(500) NOT NULL,
  layout_config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (exhibition_id) REFERENCES exhibitions(exhibition_id)
);
```

---

### Response ตัวอย่าง

**GET /api/v1/exhibitions/:id/certificate-template**

```json
{
  "template_id": 1,
  "exhibition_id": 1,
  "background_url": "uploads/certificates/templates/EX_C_smart_tech_expo_2025.png",
  "layout_config": {
    "participant_name": {
      "x": 400,
      "y": 300,
      "font_size": 36,
      "color": "#000000",
      "align": "center"
    }
  },
  "exhibition_name": "Smart Tech Expo 2025",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**GET /api/v1/exhibitions/:id/certificates/:userId/preview**

```json
{
  "template": {
    "background_url": "uploads/certificates/templates/EX_C_smart_tech_expo_2025.png",
    "layout_config": { ... }
  },
  "participant_name": "สมชาย ใจดี"
}
```

**GET /api/v1/exhibitions/:id/certificates/:userId/download**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="certificate_สมชาย_ใจดี.pdf"

(PDF binary data)
```

---

### Dependencies ที่ใช้สร้าง PDF

| Package          | Version | หน้าที่                          |
| ---------------- | ------- | -------------------------------- |
| `pdf-lib`        | ^1.17.1 | สร้างและจัดการ PDF               |
| `@pdf-lib/fontkit`| ^1.1.1 | รองรับฟอนต์ภาษาไทย              |
| `fontkit`        | ^2.0.4  | อ่านไฟล์ฟอนต์                   |

---

### LINE Commands ที่เกี่ยวข้อง

| คำสั่ง       | คำอธิบาย                              |
| ------------ | ------------------------------------- |
| `เกียรติบัตร` | ดูสถานะและดาวน์โหลดเกียรติบัตร         |
| `ใบประกาศ`   | เหมือนกับ "เกียรติบัตร"               |
