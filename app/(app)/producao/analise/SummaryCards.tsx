"use client";

import { ReactNode } from "react";
import {
  ConsistencyLevel,
  HIGH_CONSISTENCY_LIMIT,
  MIN_CONSISTENCY_DAYS,
  MODERATE_CONSISTENCY_LIMIT,
  OverallSummary,
} from "../../../lib/performance";
import { EfficiencyStatus, plural } from "../../../lib/production";
import {
  dayLabel,
  formatNumber,
  formatPct,
  formatPoints,
  formatSigned,
  formatSlot,
} from "../../../lib/format";
import { STATUS_STYLE } from "./statusStyles";

type Highlight = "neutral" | Exclude<EfficiencyStatus, "no-data">;

const BORDER: Record<Highlight, string> = {
  neutral: "border-t-zinc-300",
  "on-target": "border-t-emerald-500",
  "near-target": "border-t-amber-500",
  critical: "border-t-red-500",
};

const VALUE: Record<Highlight, string> = {
  neutral: "text-zinc-900",
  "on-target": "text-emerald-600",
  "near-target": "text-amber-600",
  critical: "text-red-600",
};

const CONSISTENCY: Record<ConsistencyLevel, { label: string; highlight: Highlight }> = {
  high: { label: "Alta", highlight: "on-target" },
  moderate: { label: "Moderada", highlight: "near-target" },
  low: { label: "Baixa", highlight: "critical" },
  insufficient: { label: "Dados insuficientes", highlight: "neutral" },
};

const highlightOf = (status: EfficiencyStatus): Highlight =>
  status === "no-data" ? "neutral" : status;

/** Barra de eficiência até 120%, com marcador na meta (100%). */
export function ProgressBar({ value, color, label }: { value: number | null; color: string; label: string }) {
  const max = 120;
  const width = value === null ? 0 : (Math.min(Math.max(value, 0), max) / max) * 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value === null ? undefined : Math.round(value)}
      className="relative h-2 w-full rounded-full bg-zinc-100"
    >
      <div className="h-full rounded-full transition-[width]" style={{ width: `${width}%`, backgroundColor: color }} />
      <div
        className="absolute -top-0.5 h-3 w-0.5 rounded bg-zinc-700"
        style={{ left: `${(100 / max) * 100}%` }}
        title="Meta (100%)"
      />
    </div>
  );
}

function IndicatorCard({
  label,
  value,
  detail,
  highlight = "neutral",
  hint,
  compact = false,
  children,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  highlight?: Highlight;
  hint?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      title={hint}
      className={`flex flex-col gap-2 rounded-lg border border-t-4 border-zinc-200 bg-white p-4 ${BORDER[highlight]}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p
        className={`${compact ? "text-2xl" : "text-3xl"} font-extrabold leading-tight tabular-nums ${VALUE[highlight]}`}
      >
        {value}
      </p>
      {children}
      {detail && <div className="text-xs leading-relaxed text-zinc-500">{detail}</div>}
    </div>
  );
}

function HighlightChip({
  tone,
  label,
  value,
}: {
  tone: "on-target" | "critical";
  label: string;
  value: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${STATUS_STYLE[tone].badge}`}>
      <span className="font-semibold">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

export function SummaryCards({ overall }: { overall: OverallSummary }) {
  const { consistency, hourlyTarget } = overall;
  const level = CONSISTENCY[consistency.level];
  const relativeBalance =
    overall.overallEfficiency === null ? null : overall.overallEfficiency - 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <IndicatorCard
          label="Eficiência global no período"
          value={formatPct(overall.overallEfficiency)}
          highlight={highlightOf(overall.status)}
          hint="Total produzido ÷ total das metas, considerando só as faixas com registro."
          detail={
            <>
              Média simples dos dias:{" "}
              <b className="text-zinc-700">{formatPct(overall.averageDailyEfficiency)}</b> (
              {plural(overall.daysWithEfficiency, "dia", "dias")})
            </>
          }
        >
          <ProgressBar
            value={overall.overallEfficiency}
            color={STATUS_STYLE[overall.status].hex}
            label="Eficiência global"
          />
        </IndicatorCard>

        <IndicatorCard
          label="Produzido × metas acumuladas"
          value={
            <>
              {formatNumber(overall.totalProduced)}
              <span className="text-lg font-semibold text-zinc-400">
                {" "}
                / {formatNumber(overall.totalTarget)}
              </span>
            </>
          }
          highlight={overall.balance >= 0 ? "on-target" : highlightOf(overall.status)}
          hint="Soma do realizado e soma das metas de todas as faixas registradas no período."
          detail={
            <>
              Saldo: <b className="text-zinc-700">{formatSigned(overall.balance)} peças</b>
              {relativeBalance !== null && <> ({formatPoints(relativeBalance)} da meta)</>}
            </>
          }
        />

        <IndicatorCard
          label="Consistência de desempenho"
          value={level.label}
          compact
          highlight={level.highlight}
          hint={
            `Coeficiente de variação (desvio padrão ÷ média) da eficiência diária. Alta: até ${HIGH_CONSISTENCY_LIMIT}%; ` +
            `moderada: até ${MODERATE_CONSISTENCY_LIMIT}%; baixa: acima disso. Exige ${MIN_CONSISTENCY_DAYS} dias com registro.`
          }
          detail={
            consistency.coefficientOfVariation === null ? (
              <>
                São necessários pelo menos {MIN_CONSISTENCY_DAYS} dias com registro (há{" "}
                {overall.daysWithEfficiency}).
              </>
            ) : (
              <>
                Oscilação diária de{" "}
                <b className="text-zinc-700">{formatPct(consistency.coefficientOfVariation)}</b>{" "}
                (desvio de {formatPoints(consistency.standardDeviation).replace("+", "")}).
                <br />
                <b className="text-zinc-700">{overall.daysOnTarget}</b> de{" "}
                {overall.daysWithEfficiency} dias na meta (
                {formatPct(overall.percentDaysOnTarget, 0)}).
              </>
            )
          }
        />

        <IndicatorCard
          label="Registros e meta horária"
          value={plural(overall.recordedDays, "dia", "dias")}
          hint="Dias úteis sem registro não entram nas contas (não são tratados como produção zero)."
          detail={
            <>
              de {overall.workdaysInPeriod} dias úteis
              {overall.workdaysWithoutRecords > 0 && (
                <> ({overall.workdaysWithoutRecords} sem registro)</>
              )}
              <br />
              {plural(overall.recordedSlots, "faixa registrada", "faixas registradas")}
              {hourlyTarget.average !== null && (
                <>
                  <br />
                  Meta horária:{" "}
                  <b className="text-zinc-700">{formatNumber(hourlyTarget.average, 1)}/h</b>
                  {hourlyTarget.min !== hourlyTarget.max && (
                    <>
                      {" "}
                      (de {hourlyTarget.min} a {hourlyTarget.max})
                    </>
                  )}
                </>
              )}
            </>
          }
        />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {overall.bestDay && (
          <HighlightChip
            tone="on-target"
            label="Melhor dia"
            value={`${dayLabel(overall.bestDay.date)} · ${formatPct(overall.bestDay.efficiency)}`}
          />
        )}
        {overall.worstDay && (
          <HighlightChip
            tone="critical"
            label="Pior dia"
            value={`${dayLabel(overall.worstDay.date)} · ${formatPct(overall.worstDay.efficiency)}`}
          />
        )}
        {overall.bestSlot && (
          <HighlightChip
            tone="on-target"
            label="Melhor horário"
            value={`${formatSlot(overall.bestSlot.timeSlot)} · ${formatPct(overall.bestSlot.efficiency)}`}
          />
        )}
        {overall.worstSlot && (
          <HighlightChip
            tone="critical"
            label="Pior horário"
            value={`${formatSlot(overall.worstSlot.timeSlot)} · ${formatPct(overall.worstSlot.efficiency)}`}
          />
        )}
      </div>
    </div>
  );
}
