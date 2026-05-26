/* ── helpers ──────────────────────────────────────────────────────── */


export function toInputValue(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts._seconds * 1000);
  // datetime-local format: YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
}


export function toDisplayTime(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

