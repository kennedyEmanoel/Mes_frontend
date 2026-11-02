"use client";

import { PerformanceSlot } from "../../../lib/performance";
import { formatNumber, formatPct, formatSigned, formatSlot } from "../../../lib/format";
import { ProgressBar } from "./SummaryCards";
import { STATUS_STYLE } from "./statusStyles";

const HEADER = "px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-zinc-500";

/** Meta horária × realizado por faixa no período; médias só dos dias com registro naquela faixa. */
export function SlotTable({ slots }: { slots: readonly PerformanceSlot[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <header>
        <h3 className="text-sm font-semibold text-zinc-900">Meta horária × realizado, por faixa</h3>
        <p className="text-xs text-zinc-500">
          Comparativo direto de cada faixa de horário em todo o período. As médias consideram só os
          dias com registro naquela faixa.
        </p>
      </header>

      <div className="overflow-x-auto rounded-md border border-zinc-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-50">
              <th scope="col" className={`${HEADER} text-left`}>Faixa</th>
              <th scope="col" className={HEADER}>Dias c/ registro</th>
              <th scope="col" className={HEADER}>Meta/h média</th>
              <th scope="col" className={HEADER}>Realizado/h médio</th>
              <th scope="col" className={HEADER}>Meta total</th>
              <th scope="col" className={HEADER}>Realizado total</th>
              <th scope="col" className={HEADER}>Saldo</th>
              <th scope="col" className={`${HEADER} min-w-40 text-left`}>Eficiência</th>
              <th scope="col" className={HEADER}>Abaixo da meta</th>
              <th scope="col" className={HEADER}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => {
              const style = STATUS_STYLE[s.status];
              const noData = s.recordedDays === 0;
              return (
                <tr key={s.timeSlot} className={`border-t border-zinc-100 ${noData ? "text-zinc-300" : ""}`}>
                  <th scope="row" className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold">
                    {formatSlot(s.timeSlot)}
                  </th>
                  <td className="px-3 py-2 text-right tabular-nums">{noData ? "—" : s.recordedDays}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNumber(s.averageTarget, 1)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNumber(s.averageProduced, 1)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{noData ? "—" : formatNumber(s.target)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{noData ? "—" : formatNumber(s.produced)}</td>
                  <td
                    className={`px-3 py-2 text-right font-semibold tabular-nums ${
                      noData ? "" : s.balance < 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {noData ? "—" : formatSigned(s.balance)}
                  </td>
                  <td className="px-3 py-2">
                    {noData ? (
                      "—"
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <ProgressBar
                            value={s.efficiency}
                            color={style.hex}
                            label={`Eficiência ${formatSlot(s.timeSlot)}`}
                          />
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${style.text}`}>
                          {formatPct(s.efficiency)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {noData ? (
                      "—"
                    ) : (
                      <>
                        {s.daysBelowTarget}/{s.recordedDays}
                        {s.zeroDays > 0 && (
                          <span className="ml-1 text-[11px] text-red-500">
                            ({s.zeroDays} {s.zeroDays > 1 ? "zerados" : "zerado"})
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}>
                      {style.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
