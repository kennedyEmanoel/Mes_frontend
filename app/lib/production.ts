// Regras de exibição compartilhadas pelas telas de produção (controle, painéis).

export type EfficiencyStatus = "on-target" | "near-target" | "critical" | "no-data";

/** Mesmos cortes do backend (performance.constants): ≥ 100 na meta, ≥ 80 perto, senão crítico. */
export function efficiencyStatus(efficiency: number | null): EfficiencyStatus {
  if (efficiency === null) return "no-data";
  if (efficiency >= 100) return "on-target";
  if (efficiency >= 80) return "near-target";
  return "critical";
}

export const STATUS_TEXT_CLASS: Record<EfficiencyStatus, string> = {
  "on-target": "text-green-600",
  "near-target": "text-amber-600",
  critical: "text-red-600",
  "no-data": "text-zinc-400",
};

/** Mesmas cores para textos sobre fundo escuro (rodapés, painéis de TV). */
export const DARK_STATUS_TEXT_CLASS: Record<EfficiencyStatus, string> = {
  "on-target": "text-green-300",
  "near-target": "text-amber-300",
  critical: "text-red-300",
  "no-data": "text-white/50",
};

export function efficiency(produced: number, target: number): number | null {
  return target > 0 ? (produced / target) * 100 : null;
}

export function formatPercent(value: number | null, digits = 0): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}

export function formatBalance(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function balanceClass(value: number): string {
  if (value < 0) return "text-red-600";
  if (value > 0) return "text-blue-600";
  return "text-green-600";
}

export function plural(count: number, singular: string, pluralText: string): string {
  return `${count} ${count === 1 ? singular : pluralText}`;
}

/** "Hoje" no calendário local do navegador (toISOString usaria UTC e viraria o dia à noite). */
export function localToday(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** "2026-10-05" → { short: "05/10", full: "05/10/2026", weekday: "seg" }, sem `new Date("AAAA-MM-DD")`. */
export function formatDay(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const noon = new Date(year, month - 1, day, 12);
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return {
    short: `${dd}/${mm}`,
    full: `${dd}/${mm}/${year}`,
    weekday: noon.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
  };
}

interface StepColor {
  className: string;
  chart: string;
}

const STEP_COLORS: Record<string, StepColor> = {
  Montagem: { className: "bg-blue-700", chart: "rgba(59,130,246,0.85)" },
  Soldagem: { className: "bg-green-700", chart: "rgba(34,197,94,0.85)" },
  Retrabalho: { className: "bg-rose-700", chart: "rgba(244,63,94,0.85)" },
  Revisão: { className: "bg-purple-700", chart: "rgba(168,85,247,0.85)" },
  Gravação: { className: "bg-amber-700", chart: "rgba(245,158,11,0.85)" },
  Firmware: { className: "bg-amber-700", chart: "rgba(245,158,11,0.85)" },
  IMEI: { className: "bg-cyan-700", chart: "rgba(6,182,212,0.85)" },
  Serial: { className: "bg-fuchsia-700", chart: "rgba(217,70,239,0.85)" },
};

const FALLBACK_COLORS: StepColor[] = [
  { className: "bg-slate-700", chart: "rgba(100,116,139,0.85)" },
  { className: "bg-teal-700", chart: "rgba(20,184,166,0.85)" },
  { className: "bg-indigo-700", chart: "rgba(99,102,241,0.85)" },
  { className: "bg-orange-700", chart: "rgba(249,115,22,0.85)" },
];

/** A variação tem prioridade sobre a etapa; nomes novos caem numa cor fixa calculada pelo nome. */
function paletteOf(stepTemplate: string, variation: string | null): StepColor {
  const known = (variation && STEP_COLORS[variation]) || STEP_COLORS[stepTemplate];
  if (known) return known;
  const label = `${stepTemplate}${variation ?? ""}`;
  const hash = [...label].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

/** Classe de fundo do cabeçalho de um cartão/etapa. */
export function stepColor(stepTemplate: string, variation: string | null): string {
  return paletteOf(stepTemplate, variation).className;
}

/** Cor da etapa nos gráficos (Chart.js precisa do valor, não da classe). */
export function stepChartColor(stepTemplate: string, variation: string | null): string {
  return paletteOf(stepTemplate, variation).chart;
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Faixa que contém a hora atual, pela grade do dia (time_slots); fora do expediente, a primeira. */
export function currentSlot<T extends { start: string; end: string }>(
  slots: T[],
  now: Date = new Date(),
): T | null {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return (
    slots.find((slot) => minutes >= minutesOf(slot.start) && minutes < minutesOf(slot.end)) ??
    slots[0] ??
    null
  );
}
