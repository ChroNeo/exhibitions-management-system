import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, rgb } from "pdf-lib";
import sharp from "sharp";
import type { LayoutConfig } from "../models/certificate-template.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");
const fontPath = path.resolve(
  __dirname,
  "../../assets/fonts/NotoSansThaiRegular.ttf",
);

let cachedFontBytes: Buffer | null = null;
async function getFontBytes(): Promise<Buffer> {
  if (!cachedFontBytes) {
    cachedFontBytes = await fs.readFile(fontPath).catch(() => {
      throw new Error("Font file not found at " + fontPath);
    });
  }
  return cachedFontBytes;
}

interface CertificateData {
  participant_name: string;
  exhibition_title?: string;
  organizer_name?: string;
}

interface GenerateCertificateParams {
  backgroundUrl: string;
  layoutConfig: LayoutConfig;
  data: CertificateData;
}

const JPG_EXTENSIONS = new Set([".jpg", ".jpeg"]);
const PNG_EXTENSIONS = new Set([".png"]);

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      )
    : rgb(0, 0, 0);
}

async function embedBackgroundImage(
  pdfDoc: PDFDocument,
  backgroundUrl: string,
  imageBytes: Buffer,
) {
  const extension = path.extname(backgroundUrl).toLowerCase();

  if (PNG_EXTENSIONS.has(extension)) {
    return pdfDoc.embedPng(imageBytes);
  }

  if (JPG_EXTENSIONS.has(extension)) {
    return pdfDoc.embedJpg(imageBytes);
  }

  if (extension === ".pdf") {
    throw new Error(
      "Certificate background PDF is not supported. Please upload PNG or JPG image.",
    );
  }

  try {
    const pngBytes = await sharp(imageBytes).png().toBuffer();
    return pdfDoc.embedPng(pngBytes);
  } catch {
    throw new Error(
      `Unsupported certificate background format (${extension || "unknown"}). Please upload PNG or JPG image.`,
    );
  }
}

export async function generateCertificate(
  params: GenerateCertificateParams,
): Promise<Buffer> {
  const { backgroundUrl, layoutConfig, data } = params;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const backgroundFullPath = path.resolve(uploadsDir, "..", backgroundUrl);

  const [backgroundImageBytes, fontBytes] = await Promise.all([
    fs.readFile(backgroundFullPath),
    getFontBytes(),
  ]);

  const pdfImage = await embedBackgroundImage(
    pdfDoc,
    backgroundUrl,
    backgroundImageBytes,
  );

  const customFont = await pdfDoc.embedFont(fontBytes);
  const { width, height } = pdfImage.scale(1);
  const page = pdfDoc.addPage([width, height]);

  page.drawImage(pdfImage, {
    x: 0,
    y: 0,
    width,
    height,
  });

  const drawConfiguredText = (
    field:
      | LayoutConfig["participant_name"]
      | LayoutConfig["exhibition_title"]
      | LayoutConfig["organizer_name"],
    text: string | undefined,
  ) => {
    if (!field || !text) return;

    const fontSize = field.font_size;
    const color = hexToRgb(field.color);
    const normalizedText = String(text).trim();
    if (!normalizedText) return;
    const textWidth = customFont.widthOfTextAtSize(normalizedText, fontSize);

    let x = field.x;
    if (field.align === "center") {
      x = field.x - textWidth / 2;
    } else if (field.align === "right") {
      x = field.x - textWidth;
    }

    const y = height - field.y - fontSize / 2;

    page.drawText(normalizedText, {
      x,
      y,
      size: fontSize,
      font: customFont,
      color,
    });
  };

  drawConfiguredText(layoutConfig.participant_name, data.participant_name);
  drawConfiguredText(layoutConfig.exhibition_title, data.exhibition_title);
  drawConfiguredText(layoutConfig.organizer_name, data.organizer_name);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
