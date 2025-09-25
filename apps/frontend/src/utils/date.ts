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
      const [datePart, timePartRaw] = value.split("T");
      if (!datePart || !timePartRaw) return value;
      const timePart = timePartRaw.length === 5 ? `${timePartRaw}:00` : timePartRaw;
      return `${datePart} ${timePart}`;
}
export function toInputDateTime(value?: string | null): string {
      if (!value) return "";
      const separator = value.includes("T") ? "T" : " ";
      const [datePart, timePartRaw] = value.split(separator);
      if (!datePart || !timePartRaw) return "";
      const timePart = timePartRaw.slice(0, 5);
      return `${datePart}T${timePart}`;
}