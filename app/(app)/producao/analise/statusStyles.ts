import { EfficiencyStatus } from "../../../lib/production";

interface StatusStyle {
  hex: string;
  background: string;
  text: string;
  badge: string;
  label: string;
}

export const STATUS_STYLE: Record<EfficiencyStatus, StatusStyle> = {
  "on-target": {
    hex: "#16a34a",
    background: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Na meta",
  },
  "near-target": {
    hex: "#d97706",
    background: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    label: "Próximo da meta",
  },
  critical: {
    hex: "#dc2626",
    background: "bg-red-50",
    text: "text-red-700",
    badge: "bg-red-100 text-red-700",
    label: "Crítico",
  },
  "no-data": {
    hex: "#cbd5e1",
    background: "bg-zinc-50",
    text: "text-zinc-400",
    badge: "bg-zinc-100 text-zinc-500",
    label: "Sem registro",
  },
};

export const CHART_COLOR = {
  target: "#475569",
  efficiency: "#0f766e",
  movingAverage: "#7c3aed",
  trend: "#2563eb",
  reference: "#94a3b8",
  selected: "#18181b",
  missingLabel: "#cbd5e1",
  label: "#475569",
  grid: "#e2e8f0",
};
