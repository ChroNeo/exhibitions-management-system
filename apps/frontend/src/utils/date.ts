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
