// Análise de desempenho: tipos da resposta da API e cópia mínima das regras de período
// (fonte: control-system/src/performance/performance.constants.ts).
import { daysBetween, isIsoDate } from "./dates";
import { EfficiencyStatus } from "./production";

export const MIN_PERIOD_DAYS = 7;
export const MAX_PERIOD_DAYS = 366;
export const HIGH_CONSISTENCY_LIMIT = 10;
export const MODERATE_CONSISTENCY_LIMIT = 20;
export const MIN_CONSISTENCY_DAYS = 3;
export const MIN_TREND_DAYS = 5;
export const MIN_TREND_CHANGE = 3;

export type VariationFilter = "all" | "none" | number;
export type ConsistencyLevel = "high" | "moderate" | "low" | "insufficient";
export type TrendDirection = "rising" | "stable" | "falling" | "insufficient";

export interface PerformanceOption {
  operatorId: number;
  operator: string;
  operatorActive: boolean;
  productId: number;
  product: string;
  stepTemplateId: number;
  stepTemplate: string;
  variationId: number | null;
  variation: string | null;
  firstDate: string;
  lastDate: string;
  days: number;
}

export interface HourCell {
  timeSlot: string;
  recorded: boolean;
  target: number | null;
  produced: number | null;
  balance: number | null;
  efficiency: number | null;
}

export interface PerformanceDay {
  date: string;
  weekday: number;
  recorded: boolean;
  target: number;
  produced: number;
  balance: number;
  efficiency: number | null;
  status: EfficiencyStatus;
  hours: HourCell[];
}

export interface PerformanceSlot {
  timeSlot: string;
  recordedDays: number;
  target: number;
  produced: number;
  balance: number;
  efficiency: number | null;
  averageTarget: number | null;
  averageProduced: number | null;
  daysBelowTarget: number;
  zeroDays: number;
  status: EfficiencyStatus;
}

export interface OverallSummary {
  totalProduced: number;
  totalTarget: number;
  balance: number;
  overallEfficiency: number | null;
  status: EfficiencyStatus;
  averageDailyEfficiency: number | null;
  daysOnTarget: number;
  daysWithEfficiency: number;
  percentDaysOnTarget: number | null;
  periodDays: number;
  workdaysInPeriod: number;
  recordedDays: number;
  workdaysWithoutRecords: number;
  recordedSlots: number;
  hourlyTarget: { average: number | null; min: number | null; max: number | null };
  bestDay: { date: string; efficiency: number } | null;
  worstDay: { date: string; efficiency: number } | null;
  bestSlot: { timeSlot: string; efficiency: number } | null;
  worstSlot: { timeSlot: string; efficiency: number } | null;
  consistency: {
    level: ConsistencyLevel;
    standardDeviation: number | null;
    coefficientOfVariation: number | null;
    consideredDays: number;
  };
}

interface CriticalBase {
  target: number;
  produced: number;
  deficit: number;
  efficiency: number;
  deviation: number;
}

export interface CriticalItems {
  threshold: number;
  days: (CriticalBase & { date: string; weekday: number })[];
  totalDays: number;
  slots: (CriticalBase & { timeSlot: string; recordedDays: number; daysBelowTarget: number })[];
  occurrences: (CriticalBase & { date: string; weekday: number; timeSlot: string })[];
  totalOccurrences: number;
}

export interface Trend {
  movingAverage: (number | null)[];
  line: (number | null)[];
  direction: TrendDirection;
  slopePerDay: number | null;
  periodChange: number | null;
  r2: number | null;
  weekly: {
    start: string;
    end: string;
    recordedDays: number;
    target: number;
    produced: number;
    efficiency: number | null;
  }[];
  byWeekday: {
    weekday: number;
    recordedDays: number;
    target: number;
    produced: number;
    efficiency: number | null;
  }[];
}

export interface PerformanceAnalysis {
  filter: {
    operatorId: number;
    operator: string;
    productId: number;
    product: string;
    stepTemplateId: number;
    stepTemplate: string;
    variation: VariationFilter;
    variationLabel: string;
    start: string;
    end: string;
    periodDays: number;
  };
  overall: OverallSummary;
  days: PerformanceDay[];
  slots: PerformanceSlot[];
  critical: CriticalItems;
  trend: Trend;
}

/** Mesmas mensagens do backend: a tela valida antes de consultar e o serviço valida de novo. */
export function validatePeriod(start: unknown, end: unknown): string | null {
  if (!isIsoDate(start) || !isIsoDate(end)) return "Informe a data inicial e a data final.";
  if (start > end) return "A data inicial não pode ser depois da data final.";

  const days = daysBetween(start, end) + 1;
  if (days < MIN_PERIOD_DAYS) {
    return `O período deve ter pelo menos ${MIN_PERIOD_DAYS} dias (1 semana). Selecionado: ${days} ${days === 1 ? "dia" : "dias"}.`;
  }
  if (days > MAX_PERIOD_DAYS) {
    return `O período pode ter no máximo ${MAX_PERIOD_DAYS} dias. Selecionado: ${days} dias.`;
  }
  return null;
}
