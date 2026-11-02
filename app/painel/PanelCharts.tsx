"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { DashboardCard } from "../lib/api";
import { stepChartColor } from "../lib/production";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const TARGET_COLOR = "rgba(148,163,184,0.5)";
const AXIS = { ticks: { color: "#475569" }, grid: { color: "#e2e8f0" } };

function barOptions(fontSize: number): ChartOptions<"bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { font: { size: fontSize }, color: "#334155" } },
    },
    scales: {
      y: { beginAtZero: true, ...AXIS, ticks: { ...AXIS.ticks, font: { size: fontSize } } },
      x: { grid: { display: false }, ticks: { ...AXIS.ticks, font: { size: fontSize } } },
    },
  };
}

/** Painel detalhado: realizado e saldo de cada operador na faixa. */
export function OperatorsChart({
  operators,
  color,
}: {
  operators: DashboardCard["byOperator"];
  color: string;
}) {
  const options = barOptions(13);
  options.plugins = {
    ...options.plugins,
    tooltip: {
      callbacks: { afterLabel: (ctx) => `Meta: ${operators[ctx.dataIndex].totalTarget}` },
    },
  };

  return (
    <Bar
      options={options}
      data={{
        labels: operators.map((o) => o.name),
        datasets: [
          {
            label: "Realizado",
            data: operators.map((o) => o.totalProduced),
            backgroundColor: color,
            borderRadius: 6,
            barPercentage: 0.6,
          },
          {
            label: "Saldo",
            data: operators.map((o) => o.totalProduced - o.totalTarget),
            backgroundColor: operators.map((o) =>
              o.totalProduced - o.totalTarget >= 0
                ? "rgba(134,239,172,0.8)"
                : "rgba(252,165,165,0.8)",
            ),
            borderRadius: 6,
            barPercentage: 0.6,
          },
        ],
      }}
    />
  );
}

/** Coluna lateral: realizado × meta do dia por etapa. */
export function ConsolidatedChart({ cards }: { cards: DashboardCard[] }) {
  return (
    <Bar
      options={barOptions(11)}
      data={{
        labels: cards.map((c) => c.label.toUpperCase()),
        datasets: [
          {
            label: "Realizado",
            data: cards.map((c) => c.totalProduced),
            backgroundColor: cards.map((c) => stepChartColor(c.stepTemplate, c.variation)),
            borderRadius: 6,
            barPercentage: 0.5,
          },
          {
            label: "Meta",
            data: cards.map((c) => c.totalTarget),
            backgroundColor: TARGET_COLOR,
            borderRadius: 6,
            barPercentage: 0.5,
          },
        ],
      }}
    />
  );
}

/** Coluna lateral: participação de cada etapa no realizado do dia. */
export function SectorsDonut({ cards }: { cards: DashboardCard[] }) {
  const total = cards.reduce((sum, c) => sum + c.totalProduced, 0);
  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: { font: { size: 11 }, boxWidth: 12, color: "#334155" },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const percent = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : "0";
            return ` ${ctx.label}: ${ctx.parsed} pçs (${percent}%)`;
          },
        },
      },
    },
  };

  return (
    <Doughnut
      options={options}
      data={{
        labels: cards.map((c) => c.label.toUpperCase()),
        datasets: [
          {
            data: cards.map((c) => c.totalProduced),
            backgroundColor: cards.map((c) => stepChartColor(c.stepTemplate, c.variation)),
            borderWidth: 2,
            borderColor: "#f1f5f9",
          },
        ],
      }}
    />
  );
}

/** Painel geral: realizado × meta de cada faixa do dia. */
export function HourlyChart({
  hours,
  color,
}: {
  hours: DashboardCard["byHour"];
  color: string;
}) {
  return (
    <Bar
      options={barOptions(12)}
      data={{
        labels: hours.map((h) => h.timeSlot),
        datasets: [
          {
            label: "Realizado",
            data: hours.map((h) => h.produced),
            backgroundColor: color,
            borderRadius: 5,
            barPercentage: 0.6,
          },
          {
            label: "Meta",
            data: hours.map((h) => h.target),
            backgroundColor: TARGET_COLOR,
            borderRadius: 5,
            barPercentage: 0.6,
          },
        ],
      }}
    />
  );
}
