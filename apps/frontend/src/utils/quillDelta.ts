// utils/quillDelta.ts
export function toDeltaObject(raw: unknown) {
  if (!raw) return { ops: [] };
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return { ops: [] }; }
  }
  // กรณี API ส่ง object มาอยู่แล้ว
  if (typeof raw === "object" && raw !== null) return raw as Record<string, unknown>;
  return { ops: [] };
}

export function toDeltaString(raw: unknown) {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  try { return JSON.stringify(raw); } catch { return ""; }
}
