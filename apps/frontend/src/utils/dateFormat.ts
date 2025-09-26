export const toThaiDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  });
};
export const toThaiTimeRange = (start?: string, end?: string) => {
  if (!start || !end) return "";
  const s = new Date(start).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});
  const e = new Date(end).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});
  return `${s} - ${e}`;
};