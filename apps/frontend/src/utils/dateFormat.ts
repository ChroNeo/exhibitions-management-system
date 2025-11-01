/**
 * Example: toThaiDate("2024-02-10") => "10 กุมภาพันธ์ 2567"
 */
export const toThaiDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Example: toThaiTimeRange("2024-02-10T08:30+07:00","2024-02-10T12:00+07:00") => "08:30 - 12:00"
 */
export const toThaiTimeRange = (start?: string, end?: string) => {
  if (!start || !end) return "";
  const s = new Date(start).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const e = new Date(end).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${s} - ${e}`;
};

/**
 * Example: fmtDateRangeTH("2024-02-10T10:00+07:00","2024-02-10T12:00+07:00")
 * => "วันที่ 10 ก.พ.–10 ก.พ. 2567 | เวลา 10:00–12:00 น."
 */
export function fmtDateRangeTH(startISO: string, endISO: string): string {
  const s = new Date(startISO);
  const e = new Date(endISO);

  const opt: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const y = e.getFullYear() + 543; // แปลงเป็น พ.ศ.

  const time = (d: Date) =>
    d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

  return `วันที่ ${s.toLocaleDateString("th-TH", opt)}–${e.toLocaleDateString(
    "th-TH",
    opt
  )} ${y} | เวลา ${time(s)}–${time(e)} น.`;
}

/**
 * Example (UTC+07): toApiDateTime("2025-01-02 08:30") => "2025-01-02T08:30:00+07:00"
 */
export function toApiDateTime(value: string): string {
  if (!value) return value;

  // รองรับเคสที่ดันเป็น "YYYY-MM-DD HH:mm"
  const v = value.replace(" ", "T");

  const [datePart, timePartRaw] = v.split("T");
  if (!datePart || !timePartRaw) return value;

  // เติมวินาทีถ้าไม่มี
  const timeWithSec = /^\d{2}:\d{2}$/.test(timePartRaw)
    ? `${timePartRaw}:00`
    : timePartRaw;

  // ถ้ามี Z หรือ +/-HH:MM อยู่แล้ว ให้คืนทันที
  if (/(Z|[+-]\d{2}:\d{2})$/.test(timeWithSec)) {
    return `${datePart}T${timeWithSec}`;
  }

  // คำนวณ timezone ของเครื่องผู้ใช้
  const offsetMin = -new Date().getTimezoneOffset(); // นาทีทางทิศตะวันออกของ UTC
  const sign = offsetMin >= 0 ? "+" : "-";
  const hh = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, "0");
  const mm = String(Math.abs(offsetMin) % 60).padStart(2, "0");

  return `${datePart}T${timeWithSec}${sign}${hh}:${mm}`;
}

/**
 * Example: toInputDateTime("2025-01-02T08:30:45+07:00") => "2025-01-02T08:30"
 */
export function toInputDateTime(value?: string | null): string {
  if (!value) return "";
  const separator = value.includes("T") ? "T" : " ";
  const [datePart, timePartRaw] = value.split(separator);
  if (!datePart || !timePartRaw) return "";
  const timePart = timePartRaw.slice(0, 5);
  return `${datePart}T${timePart}`;
}
