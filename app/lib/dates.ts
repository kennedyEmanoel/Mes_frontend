// Datas "AAAA-MM-DD" sem fuso (cópia mínima de date.util do backend); nunca usar new Date("AAAA-MM-DD").

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toUtcMs(iso: string): number | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const ms = Date.UTC(year, month - 1, day);
  const date = new Date(ms);
  const exists =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return exists ? ms : null;
}

function utcMsOrThrow(iso: string): number {
  const ms = toUtcMs(iso);
  if (ms === null) throw new Error(`Data inválida: ${iso}`);
  return ms;
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && toUtcMs(value) !== null;
}

export function daysBetween(start: string, end: string): number {
  return Math.round((utcMsOrThrow(end) - utcMsOrThrow(start)) / DAY_MS);
}

export function addDays(iso: string, days: number): string {
  return new Date(utcMsOrThrow(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** 0 = domingo ... 6 = sábado. */
export function dayOfWeek(iso: string): number {
  return new Date(utcMsOrThrow(iso)).getUTCDay();
}
