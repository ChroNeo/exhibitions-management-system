import path from "node:path";
import fs from "node:fs/promises"; // ใช้ fs แบบ promise เพื่ออ่านไฟล์
import { fileURLToPath } from "node:url";
import { PDFDocument, rgb, CustomFontEmbedder } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit"; // จำเป็นสำหรับ Custom Font (ภาษาไทย)
import type { LayoutConfig } from "../models/certificate-template.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// สมมติว่าเก็บ uploads ไว้ที่นี่
const uploadsDir = path.resolve(__dirname, "../../uploads");
// **สำคัญ** ต้องมีไฟล์ฟอนต์ภาษาไทยในเครื่อง
const fontPath = path.resolve(__dirname, "../../assets/fonts/NotoSansThaiRegular.ttf");

interface CertificateData {
  participant_name: string;
}

interface GenerateCertificateParams {
  backgroundUrl: string;
  layoutConfig: LayoutConfig;
  data: CertificateData;
}

// Helper: แปลงสี Hex (#000000) เป็น RGB ของ pdf-lib (0-1)
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? rgb(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    )
    : rgb(0, 0, 0);
}

export async function generateCertificate(
  params: GenerateCertificateParams
): Promise<Buffer> {
  const { backgroundUrl, layoutConfig, data } = params;

  // 1. สร้าง PDF Doc ใหม่
  const pdfDoc = await PDFDocument.create();
  console.log("Fontkit object:", fontkit);
  // ลงทะเบียน fontkit เพื่อให้โหลด Custom Font ได้
  pdfDoc.registerFontkit(fontkit);

  // 2. โหลดไฟล์พื้นหลังและไฟล์ฟอนต์
  const backgroundFullPath = path.resolve(uploadsDir, "..", backgroundUrl);

  const [backgroundImageBytes, fontBytes] = await Promise.all([
    fs.readFile(backgroundFullPath),
    fs.readFile(fontPath).catch(() => {
      throw new Error("Font file not found at " + fontPath);
    }),
  ]);
  console.log("Font size:", fontBytes.length);
  // 3. Embed รูปภาพและฟอนต์ลงใน PDF
  // เช็คสกุลไฟล์ว่าเป็น PNG หรือ JPG
  let pdfImage;
  if (backgroundUrl.endsWith('.png')) {
    pdfImage = await pdfDoc.embedPng(backgroundImageBytes);
  } else {
    pdfImage = await pdfDoc.embedJpg(backgroundImageBytes);
  }

  console.log("First 4 bytes:", fontBytes.subarray(0, 4));
  const customFont = await pdfDoc.embedFont(fontBytes);
  // 4. เอาขนาดรูปมาตั้งเป็นขนาดหน้ากระดาษ
  const { width, height } = pdfImage.scale(1);
  const page = pdfDoc.addPage([width, height]);

  // 5. วาดรูปพื้นหลัง
  page.drawImage(pdfImage, {
    x: 0,
    y: 0,
    width,
    height,
  });

  // 6. วาดชื่อผู้เข้าร่วม (Participant Name)
  if (layoutConfig.participant_name && data.participant_name) {
    const field = layoutConfig.participant_name;
    const fontSize = field.font_size;
    const text = data.participant_name;
    const color = hexToRgb(field.color);

    // คำนวณความกว้างข้อความ เพื่อจัดกึ่งกลาง (Text Alignment Logic)
    const textWidth = customFont.widthOfTextAtSize(text, fontSize);

    let x = field.x;
    // ปรับ X ตามการจัดวาง
    if (field.align === 'center') {
      x = field.x - (textWidth / 2);
    } else if (field.align === 'right') {
      x = field.x - textWidth;
    }

    // คำนวณแกน Y: pdf-lib นับ 0 จากล่างสุด แต่ config เราน่าจะนับจากบนสุด
    // สูตร: ความสูงกระดาษ - ตำแหน่ง Y ที่ต้องการ - (ครึ่งนึงของขนาดฟอนต์เพื่อให้อยู่ตรงกลางบรรทัดโดยประมาณ)
    const y = height - field.y - (fontSize / 2);

    page.drawText(text, {
      x: x,
      y: y,
      size: fontSize,
      font: customFont,
      color: color,
    });
  }

  // 7. Save เป็น Buffer (Uint8Array -> Buffer)
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}