"use client";

import { ReactNode, useMemo } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Legend,
  LegendItem,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  TooltipItem,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import {
  MIN_TREND_CHANGE,
  MIN_TREND_DAYS,
  PerformanceDay,
  PerformanceSlot,
  Trend,
  TrendDirection,
} from "../../../lib/performance";
import { EfficiencyStatus, efficiencyStatus, plural } from "../../../lib/production";
import {
  dayLabel,
  formatNumber,
  formatPct,
  formatPoints,
  formatShortDate,
  formatSigned,
  formatSlot,
  weekdayName,
} from "../../../lib/format";
import { CHART_COLOR, STATUS_STYLE } from "./statusStyles";

ChartJS.register(
  BarController,
  BarElement,
  CategoryScale,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

type MixedData = ChartData<"bar" | "line", (number | null)[], string | string[]>;
type MixedOptions = ChartOptions<"bar" | "line">;
type YScale = NonNullable<MixedOptions["scales"]>["y"];

function MixedChart({ type, data, options }: { type: "bar" | "line"; data: MixedData; options: MixedOptions }) {
  return (
    <Chart<"bar" | "line", (number | null)[], string | string[]>
      type={type}
      data={data}
      options={options}
    />
  );
}

// ─── Peças comuns ────────────────────────────────────────────────────────────

export function ChartCard({
  title,
  subtitle,
  actions,
  height = 280,
  ariaLabel,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  height?: number;
  ariaLabel: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        </div>
        {actions}
      </header>
      <div role="img" aria-label={ariaLabel} className="relative" style={{ height }}>
        {children}
      </div>
      {footer && <div className="text-[11px] leading-relaxed text-zinc-500">{footer}</div>}
    </section>
  );
}

export function Segmented<V extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: V;
  options: readonly { value: V; label: string; disabled?: boolean }[];
  onChange: (value: V) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`rounded px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? "bg-white font-semibold text-zinc-900 shadow-sm"
                : "font-medium text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const SHORT_STATUS = { "on-target": "na meta", "near-target": "próximo", critical: "crítico" } as const;
const LEGEND_LABELS = { boxWidth: 12, boxHeight: 12, font: { size: 11 }, color: CHART_COLOR.label };

/** Séries com valor nulo (sem registro) não entram na dica daquele ponto. */
const hasData = (item: TooltipItem<"bar" | "line">) => item.raw !== null && item.raw !== undefined;

const plainLegend = { position: "top" as const, labels: LEGEND_LABELS };

/** As barras de "Realizado" mudam de cor conforme a situação; a legenda mostra cada cor. */
const statusLegend = {
  position: "top" as const,
  onClick: () => undefined,
  labels: {
    ...LEGEND_LABELS,
    generateLabels: (chart: ChartJS): LegendItem[] =>
      ChartJS.defaults.plugins.legend.labels.generateLabels(chart).flatMap((item) =>
        item.text.startsWith("Realizado")
          ? (["on-target", "near-target", "critical"] as const).map(
              (status): LegendItem => ({
                ...item,
                text: `Realizado · ${SHORT_STATUS[status]}`,
                fillStyle: STATUS_STYLE[status].hex,
                strokeStyle: STATUS_STYLE[status].hex,
                hidden: false,
              }),
            )
          : [item],
      ),
  },
};

const piecesAxis: YScale = {
  beginAtZero: true,
  title: { display: true, text: "Peças", font: { size: 11 }, color: CHART_COLOR.label },
  grid: { color: CHART_COLOR.grid },
  ticks: { font: { size: 11 }, color: CHART_COLOR.label },
};

function efficiencyAxis(values: readonly (number | null)[]): YScale {
  const present = values.filter((v): v is number => v !== null);
  const lowest = Math.min(100, ...present);
  const highest = Math.max(100, ...present);
  return {
    suggestedMin: Math.max(0, Math.floor((lowest - 10) / 10) * 10),
    suggestedMax: Math.ceil((highest + 10) / 10) * 10,
    title: { display: true, text: "Eficiência (% da meta)", font: { size: 11 }, color: CHART_COLOR.label },
    grid: { color: CHART_COLOR.grid },
    ticks: { font: { size: 11 }, color: CHART_COLOR.label, callback: (value) => `${value}%` },
  };
}

/** Altura da barra baixa e cinza que torna visível (e com dica) o que não tem registro. */
function missingMarkerHeight(values: readonly (number | null)[]): number {
  return Math.max(1, ...values.filter((v): v is number => v !== null)) * 0.05;
}

// ─── Realizado × meta por dia (clicável) ─────────────────────────────────────

export function DailyChart({
  days,
  selectedDay,
  onSelectDay,
}: {
  days: readonly PerformanceDay[];
  selectedDay: string | null;
  onSelectDay: (date: string) => void;
}) {
  const data = useMemo<MixedData>(() => {
    const produced = days.map((d) => (d.recorded ? d.produced : null));
    const marker = missingMarkerHeight(produced);
    return {
      labels: days.map((d) => dayLabel(d.date)),
      datasets: [
        {
          type: "bar",
          label: "Realizado",
          data: produced,
          stack: "day",
          backgroundColor: days.map((d) => STATUS_STYLE[d.status].hex),
          borderColor: days.map((d) => (d.date === selectedDay ? CHART_COLOR.selected : "transparent")),
          borderWidth: 2,
          borderRadius: 4,
          order: 2,
        },
        {
          type: "bar",
          label: "Sem registro",
          data: days.map((d) => (d.recorded ? null : marker)),
          stack: "day",
          backgroundColor: STATUS_STYLE["no-data"].hex,
          borderRadius: 4,
          order: 3,
        },
        {
          type: "line",
          label: "Meta",
          data: days.map((d) => (d.recorded ? d.target : null)),
          borderColor: CHART_COLOR.target,
          backgroundColor: CHART_COLOR.target,
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 3,
          tension: 0,
          order: 1,
        },
      ],
    };
  }, [days, selectedDay]);

  const options = useMemo<MixedOptions>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      onClick: (_event, elements) => {
        const day = elements[0] ? days[elements[0].index] : undefined;
        if (day?.recorded) onSelectDay(day.date);
      },
      onHover: (event, elements) => {
        const target = event.native?.target;
        if (target instanceof HTMLElement) target.style.cursor = elements.length > 0 ? "pointer" : "default";
      },
      plugins: {
        legend: statusLegend,
        tooltip: {
          filter: hasData,
          callbacks: {
            label: (item) =>
              item.dataset.label === "Sem registro"
                ? "Sem registro neste dia"
                : `${item.dataset.label}: ${formatNumber(item.parsed.y)}`,
            afterBody: (items) => {
              const day = days[items[0]?.dataIndex];
              if (!day?.recorded) return [];
              return [
                `Eficiência: ${formatPct(day.efficiency)}`,
                `Saldo: ${formatSigned(day.balance)} peças`,
                "Clique para ver hora a hora",
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            autoSkip: true,
            maxRotation: 60,
            font: { size: 10 },
            color: (context) =>
              days[context.index]?.recorded ? CHART_COLOR.label : CHART_COLOR.missingLabel,
          },
        },
        y: piecesAxis,
      },
    }),
    [days, onSelectDay],
  );

  return <MixedChart type="bar" data={data} options={options} />;
}

// ─── Realizado × meta por hora ───────────────────────────────────────────────

export type HourlyMode = "day" | "period";

interface HourlyPoint {
  timeSlot: string;
  target: number | null;
  produced: number | null;
  efficiency: number | null;
  status: EfficiencyStatus;
  detail: string;
}

export function ByHourChart({
  mode,
  day,
  slots,
}: {
  mode: HourlyMode;
  day: PerformanceDay | null;
  slots: readonly PerformanceSlot[];
}) {
  const byDay = mode === "day" && day !== null;
  const points = useMemo<HourlyPoint[]>(
    () =>
      byDay
        ? day.hours.map((h) => ({
            timeSlot: h.timeSlot,
            target: h.target,
            produced: h.produced,
            efficiency: h.efficiency,
            status: efficiencyStatus(h.efficiency),
            detail: "",
          }))
        : slots.map((s) => ({
            timeSlot: s.timeSlot,
            target: s.averageTarget,
            produced: s.averageProduced,
            efficiency: s.efficiency,
            status: s.status,
            detail: `Média de ${plural(s.recordedDays, "dia com registro", "dias com registro")}`,
          })),
    [byDay, day, slots],
  );

  const data = useMemo<MixedData>(() => {
    const produced = points.map((p) => p.produced);
    const marker = missingMarkerHeight([...produced, ...points.map((p) => p.target)]);
    return {
      labels: points.map((p) => p.timeSlot.split(" - ")),
      datasets: [
        {
          type: "bar",
          label: byDay ? "Realizado" : "Realizado (média por dia)",
          data: produced,
          stack: "slot",
          backgroundColor: points.map((p) => STATUS_STYLE[p.status].hex),
          borderRadius: 4,
          order: 2,
        },
        {
          type: "bar",
          label: "Sem registro",
          data: points.map((p) => (p.produced === null ? marker : null)),
          stack: "slot",
          backgroundColor: STATUS_STYLE["no-data"].hex,
          borderRadius: 4,
          order: 3,
        },
        {
          type: "line",
          label: byDay ? "Meta" : "Meta (média por dia)",
          data: points.map((p) => p.target),
          borderColor: CHART_COLOR.target,
          backgroundColor: CHART_COLOR.target,
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 3,
          tension: 0,
          order: 1,
        },
      ],
    };
  }, [points, byDay]);

  const options = useMemo<MixedOptions>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: statusLegend,
        tooltip: {
          filter: hasData,
          callbacks: {
            title: (items) => formatSlot(points[items[0]?.dataIndex]?.timeSlot ?? ""),
            label: (item) =>
              item.dataset.label === "Sem registro"
                ? "Sem registro nesta faixa"
                : `${item.dataset.label}: ${formatNumber(item.parsed.y, byDay ? 0 : 1)}`,
            afterBody: (items) => {
              const point = points[items[0]?.dataIndex];
              if (!point || point.produced === null) return [];
              return [`Eficiência: ${formatPct(point.efficiency)}`, ...(point.detail ? [point.detail] : [])];
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: CHART_COLOR.label } },
        y: piecesAxis,
      },
    }),
    [points, byDay],
  );

  return <MixedChart type="bar" data={data} options={options} />;
}

// ─── Tendência ───────────────────────────────────────────────────────────────

export type TrendView = "period" | "weeks" | "weekday";

const percentTooltip: NonNullable<MixedOptions["plugins"]>["tooltip"] = {
  filter: (item) => item.dataset.label !== "Meta (100%)" && hasData(item),
  callbacks: {
    label: (item) =>
      item.dataset.label === "Sem registro"
        ? "Sem registro"
        : `${item.dataset.label}: ${formatPct(item.parsed.y)}`,
  },
};

const referenceLine = (count: number): MixedData["datasets"][number] => ({
  type: "line",
  label: "Meta (100%)",
  data: Array.from({ length: count }, () => 100),
  borderColor: CHART_COLOR.reference,
  borderDash: [2, 4],
  borderWidth: 1.5,
  pointRadius: 0,
  order: 5,
});

interface ChartSetup {
  type: "bar" | "line";
  data: MixedData;
  options: MixedOptions;
}

function evolutionSetup(days: readonly PerformanceDay[], trend: Trend): ChartSetup {
  const efficiencies = days.map((d) => d.efficiency);
  const hasLine = trend.line.some((v) => v !== null);

  return {
    type: "line",
    data: {
      labels: days.map((d) => dayLabel(d.date)),
      datasets: [
        {
          type: "line",
          label: "Eficiência diária",
          data: efficiencies,
          borderColor: CHART_COLOR.efficiency,
          backgroundColor: CHART_COLOR.efficiency,
          pointBackgroundColor: days.map((d) => STATUS_STYLE[d.status].hex),
          pointBorderColor: "#ffffff",
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2,
          tension: 0,
          spanGaps: true,
          order: 2,
        },
        {
          type: "line",
          label: "Média móvel (3 dias)",
          data: trend.movingAverage,
          borderColor: CHART_COLOR.movingAverage,
          backgroundColor: CHART_COLOR.movingAverage,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          spanGaps: true,
          order: 3,
        },
        ...(hasLine
          ? [
              {
                type: "line" as const,
                label: "Linha de tendência",
                data: trend.line,
                borderColor: CHART_COLOR.trend,
                backgroundColor: CHART_COLOR.trend,
                borderDash: [8, 5],
                borderWidth: 2,
                pointRadius: 0,
                spanGaps: true,
                order: 4,
              },
            ]
          : []),
        referenceLine(days.length),
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: plainLegend, tooltip: percentTooltip },
      scales: {
        x: {
          grid: { display: false },
          ticks: { autoSkip: true, maxRotation: 60, font: { size: 10 }, color: CHART_COLOR.label },
        },
        y: efficiencyAxis([...efficiencies, ...trend.movingAverage, ...trend.line]),
      },
    },
  };
}

function barsSetup(
  labels: string[],
  efficiencies: (number | null)[],
  seriesLabel: string,
  details: string[],
): ChartSetup {
  const marker = missingMarkerHeight(efficiencies);
  return {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: seriesLabel,
          data: efficiencies,
          stack: "series",
          backgroundColor: efficiencies.map((e) => STATUS_STYLE[efficiencyStatus(e)].hex),
          borderRadius: 4,
          order: 2,
        },
        {
          type: "bar",
          label: "Sem registro",
          data: efficiencies.map((e) => (e === null ? marker : null)),
          stack: "series",
          backgroundColor: STATUS_STYLE["no-data"].hex,
          borderRadius: 4,
          order: 3,
        },
        referenceLine(labels.length),
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: statusLegend,
        tooltip: {
          ...percentTooltip,
          callbacks: {
            ...percentTooltip?.callbacks,
            afterBody: (items) =>
              details[items[0]?.dataIndex] ? [details[items[0].dataIndex]] : [],
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: CHART_COLOR.label } },
        y: efficiencyAxis(efficiencies),
      },
    },
  };
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function TrendChart({
  view,
  days,
  trend,
}: {
  view: TrendView;
  days: readonly PerformanceDay[];
  trend: Trend;
}) {
  const { type, data, options } = useMemo(() => {
    if (view === "weeks") {
      return barsSetup(
        trend.weekly.map((w) => `${formatShortDate(w.start)}–${formatShortDate(w.end)}`),
        trend.weekly.map((w) => w.efficiency),
        "Eficiência da semana",
        trend.weekly.map((w) => plural(w.recordedDays, "dia com registro", "dias com registro")),
      );
    }
    if (view === "weekday") {
      return barsSetup(
        trend.byWeekday.map((p) => capitalize(weekdayName(p.weekday))),
        trend.byWeekday.map((p) => p.efficiency),
        "Eficiência no dia da semana",
        trend.byWeekday.map((p) => plural(p.recordedDays, "dia com registro", "dias com registro")),
      );
    }
    return evolutionSetup(days, trend);
  }, [view, days, trend]);

  return <MixedChart type={type} data={data} options={options} />;
}

const DIRECTION: Record<TrendDirection, { label: string; arrow: string; className: string }> = {
  rising: { label: "Produtividade subindo", arrow: "↗", className: "bg-emerald-100 text-emerald-700" },
  falling: { label: "Produtividade caindo", arrow: "↘", className: "bg-red-100 text-red-700" },
  stable: { label: "Produtividade estável", arrow: "→", className: "bg-zinc-100 text-zinc-700" },
  insufficient: { label: "Tendência indisponível", arrow: "·", className: "bg-zinc-100 text-zinc-500" },
};

export function TrendSummary({ trend, recordedDays }: { trend: Trend; recordedDays: number }) {
  const direction = DIRECTION[trend.direction];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${direction.className}`}
      >
        <span aria-hidden="true">{direction.arrow}</span>
        {direction.label}
      </span>
      <span>
        {trend.direction === "insufficient"
          ? `São necessários pelo menos ${MIN_TREND_DAYS} dias com registro (há ${plural(recordedDays, "dia", "dias")}).`
          : `${formatPoints(trend.periodChange)} do primeiro ao último dia analisado (ajuste linear, R² ${formatNumber(trend.r2, 2)}). ` +
            (trend.direction === "stable"
              ? `Variações abaixo de ${MIN_TREND_CHANGE} p.p. ou sem direção clara são tratadas como estáveis.`
              : "")}
      </span>
    </div>
  );
}
