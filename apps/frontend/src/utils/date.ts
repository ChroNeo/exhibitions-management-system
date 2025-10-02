// ฟังก์ชันรวมๆ ไว้แปลงวันที่เป็นข้อความไทย
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
export function toApiDateTime(value: string): string {
  if (!value) return value;

  // รองรับเคสที่ดันเป็น "YYYY-MM-DD HH:mm"
  const v = value.replace(' ', 'T');

  const [datePart, timePartRaw] = v.split('T');
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
  const sign = offsetMin >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, '0');
  const mm = String(Math.abs(offsetMin) % 60).padStart(2, '0');

  return `${datePart}T${timeWithSec}${sign}${hh}:${mm}`;
}

export function toInputDateTime(value?: string | null): string {
      if (!value) return "";
      const separator = value.includes("T") ? "T" : " ";
      const [datePart, timePartRaw] = value.split(separator);
      if (!datePart || !timePartRaw) return "";
      const timePart = timePartRaw.slice(0, 5);
      return `${datePart}T${timePart}`;
}