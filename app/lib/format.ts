// Formatação pt-BR usada na análise de desempenho.
import { dayOfWeek } from "./dates";

const SHORT_WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function formatNumber(value: number | null, decimals = 0): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPct(value: number | null, decimals = 1): string {
  return value === null || !Number.isFinite(value) ? "—" : `${formatNumber(value, decimals)}%`;
}

export function formatSigned(value: number | null, decimals = 0): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const text = formatNumber(value, decimals);
  return value > 0 ? `+${text}` : text;
}

export function formatPoints(value: number | null, decimals = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${formatSigned(value, decimals)} p.p.`;
}

export function formatShortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function formatPeriod(start: string, end: string): string {
  const full = (iso: string) => iso.split("-").reverse().join("/");
  return `${full(start)} a ${full(end)}`;
}

export function weekdayName(weekday: number): string {
  return SHORT_WEEKDAYS[weekday];
}

/** "2026-10-05" → "seg 05/10". */
export function dayLabel(iso: string): string {
  return `${weekdayName(dayOfWeek(iso))} ${formatShortDate(iso)}`;
}

export function formatSlot(timeSlot: string): string {
  return timeSlot.replace(" - ", " – ");
}
