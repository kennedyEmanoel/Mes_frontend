"use client";

import { useState } from "react";
import { HourCell, PerformanceDay, PerformanceSlot } from "../../../lib/performance";
import { efficiencyStatus } from "../../../lib/production";
import { dayLabel, formatNumber, formatPct, formatSigned, formatSlot } from "../../../lib/format";
import { STATUS_STYLE } from "./statusStyles";

const HEADER =
  "sticky top-0 z-10 bg-zinc-50 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-zinc-500";

function MapCell({ cell, day }: { cell: HourCell; day: PerformanceDay }) {
  const where = `${dayLabel(day.date)} · ${formatSlot(cell.timeSlot)}`;
  if (!cell.recorded) {
    return (
      <td className="px-2 py-1.5 text-center text-zinc-300" title={`${where}: sem registro`}>
        —
      </td>
    );
  }

  const style = STATUS_STYLE[efficiencyStatus(cell.efficiency)];
  return (
    <td
      className={`px-2 py-1.5 text-center ${style.background}`}
      title={`${where}: ${formatNumber(cell.produced)} de ${formatNumber(cell.target)} (${formatPct(cell.efficiency)}), saldo ${formatSigned(cell.balance)}`}
    >
      <p className={`text-sm font-semibold leading-tight tabular-nums ${style.text}`}>
        {formatNumber(cell.produced)}
      </p>
      <p className="text-[10px] leading-tight text-zinc-400">/ {formatNumber(cell.target)}</p>
    </td>
  );
}

function DayTotal({ day }: { day: PerformanceDay }) {
  if (!day.recorded) return <td className="px-2 py-1.5 text-center text-zinc-300">—</td>;
  const style = STATUS_STYLE[day.status];
  return (
    <td className="px-2 py-1.5 text-center">
      <p className={`text-sm font-bold tabular-nums ${style.text}`}>{formatPct(day.efficiency)}</p>
      <p className="text-[10px] text-zinc-400">
        {formatNumber(day.produced)} / {formatNumber(day.target)}
      </p>
    </td>
  );
}

function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
      {(
        [
          ["on-target", " (≥ 100%)"],
          ["near-target", " (80–99%)"],
          ["critical", " (< 80%)"],
        ] as const
      ).map(([status, range]) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: STATUS_STYLE[status].hex }} />
          {STATUS_STYLE[status].label}
          {range}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="font-semibold text-zinc-400">—</span> sem registro (não é o mesmo que
        produção zero)
      </span>
    </div>
  );
}

/** Mapa dia × faixa: realizado / meta de cada célula; hora sem registro aparece como "—", nunca como zero. */
export function DaySlotMap({
  days,
  slots,
  selectedDay,
  onSelectDay,
}: {
  days: readonly PerformanceDay[];
  slots: readonly PerformanceSlot[];
  selectedDay: string | null;
  onSelectDay: (date: string) => void;
}) {
  const [showUnrecorded, setShowUnrecorded] = useState(false);
  const unrecorded = days.filter((d) => !d.recorded).length;
  const rows = showUnrecorded ? days : days.filter((d) => d.recorded);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Dia a dia, hora a hora</h3>
          <p className="text-xs text-zinc-500">
            Realizado <span className="text-zinc-400">/ meta</span> de cada faixa. Clique em um dia
            para vê-lo no gráfico por hora.
          </p>
        </div>
        {unrecorded > 0 && (
          <label className="flex select-none items-center gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={showUnrecorded}
              onChange={(e) => setShowUnrecorded(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Mostrar {unrecorded} {unrecorded === 1 ? "dia útil" : "dias úteis"} sem registro
          </label>
        )}
      </header>

      <MapLegend />

      <div className="max-h-[30rem] overflow-auto rounded-md border border-zinc-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${HEADER} left-0 z-20 min-w-28 text-left`}>
                Dia
              </th>
              {slots.map((s) => (
                <th key={s.timeSlot} scope="col" className={`${HEADER} min-w-16 whitespace-nowrap`}>
                  {s.timeSlot.split(" - ").map((part) => (
                    <div key={part}>{part}</div>
                  ))}
                </th>
              ))}
              <th scope="col" className={`${HEADER} min-w-24`}>
                Total do dia
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((day) => {
              const selected = day.date === selectedDay;
              return (
                <tr
                  key={day.date}
                  tabIndex={day.recorded ? 0 : undefined}
                  aria-current={selected ? "true" : undefined}
                  onClick={() => day.recorded && onSelectDay(day.date)}
                  onKeyDown={(e) => {
                    if (day.recorded && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onSelectDay(day.date);
                    }
                  }}
                  className={`border-t border-zinc-100 ${day.recorded ? "cursor-pointer hover:bg-zinc-50" : ""} ${
                    selected ? "bg-zinc-100" : ""
                  }`}
                >
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 whitespace-nowrap px-3 py-1.5 text-left text-xs font-semibold ${
                      selected
                        ? "bg-zinc-100 text-zinc-900"
                        : day.recorded
                          ? "bg-white text-zinc-700"
                          : "bg-white text-zinc-300"
                    }`}
                  >
                    {dayLabel(day.date)}
                    {!day.recorded && <span className="ml-1 text-[10px] font-normal">sem registro</span>}
                  </th>
                  {day.hours.map((cell) => (
                    <MapCell key={cell.timeSlot} cell={cell} day={day} />
                  ))}
                  <DayTotal day={day} />
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-zinc-200 bg-zinc-50">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-zinc-50 px-3 py-2 text-left text-xs font-bold text-zinc-700"
              >
                Período
              </th>
              {slots.map((s) => (
                <td key={s.timeSlot} className="px-2 py-2 text-center">
                  {s.recordedDays === 0 ? (
                    <span className="text-zinc-300">—</span>
                  ) : (
                    <>
                      <p className={`text-xs font-bold tabular-nums ${STATUS_STYLE[s.status].text}`}>
                        {formatPct(s.efficiency, 0)}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {formatNumber(s.produced)} / {formatNumber(s.target)}
                      </p>
                    </>
                  )}
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
