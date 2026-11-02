"use client";

import { ReactNode } from "react";
import { CriticalItems } from "../../../lib/performance";
import { plural } from "../../../lib/production";
import {
  dayLabel,
  formatNumber,
  formatPct,
  formatPoints,
  formatSigned,
  formatSlot,
} from "../../../lib/format";
import { STATUS_STYLE } from "./statusStyles";

function ListCard({
  title,
  subtitle,
  total,
  shown,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  total: number;
  shown: number;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-lg border border-t-4 border-zinc-200 border-t-red-500 bg-white p-4">
      <header>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              total === 0 ? STATUS_STYLE["on-target"].badge : STATUS_STYLE.critical.badge
            }`}
          >
            {total}
          </span>
        </div>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </header>

      {total === 0 ? (
        <p className="py-3 text-sm text-emerald-700">✓ {empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100">{children}</ul>
      )}

      {total > shown && (
        <p className="text-[11px] text-zinc-400">
          Mostrando os {shown} piores de {total}.
        </p>
      )}
    </section>
  );
}

function CriticalItem({
  title,
  detail,
  efficiency,
  deviation,
}: {
  title: string;
  detail: string;
  efficiency: number;
  deviation: number;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-800">{title}</p>
        <p className="text-xs text-zinc-500">{detail}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums text-red-600">{formatPct(efficiency)}</p>
        <p className="text-[11px] tabular-nums text-zinc-400">{formatPoints(deviation)}</p>
      </div>
    </li>
  );
}

export function CriticalLists({ critical }: { critical: CriticalItems }) {
  const cutoff = `abaixo de ${critical.threshold}% da meta`;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <ListCard
        title="Dias críticos"
        subtitle={`Dias com eficiência ${cutoff}`}
        total={critical.totalDays}
        shown={critical.days.length}
        empty={`Nenhum dia ${cutoff}.`}
      >
        {critical.days.map((d) => (
          <CriticalItem
            key={d.date}
            title={dayLabel(d.date)}
            detail={`${formatNumber(d.produced)} de ${formatNumber(d.target)} peças (saldo ${formatSigned(-d.deficit)})`}
            efficiency={d.efficiency}
            deviation={d.deviation}
          />
        ))}
      </ListCard>

      <ListCard
        title="Horários críticos"
        subtitle={`Faixas com eficiência ${cutoff} no período`}
        total={critical.slots.length}
        shown={critical.slots.length}
        empty={`Nenhuma faixa de horário ${cutoff}.`}
      >
        {critical.slots.map((s) => (
          <CriticalItem
            key={s.timeSlot}
            title={formatSlot(s.timeSlot)}
            detail={`Abaixo da meta em ${s.daysBelowTarget} de ${plural(s.recordedDays, "dia", "dias")} · saldo ${formatSigned(-s.deficit)} peças`}
            efficiency={s.efficiency}
            deviation={s.deviation}
          />
        ))}
      </ListCard>

      <ListCard
        title="Piores ocorrências"
        subtitle="Faixas de um dia específico com maior déficit"
        total={critical.totalOccurrences}
        shown={critical.occurrences.length}
        empty={`Nenhuma faixa de nenhum dia ${cutoff}.`}
      >
        {critical.occurrences.map((o) => (
          <CriticalItem
            key={`${o.date}-${o.timeSlot}`}
            title={`${dayLabel(o.date)} · ${formatSlot(o.timeSlot)}`}
            detail={`${formatNumber(o.produced)} de ${formatNumber(o.target)} peças (saldo ${formatSigned(-o.deficit)})`}
            efficiency={o.efficiency}
            deviation={o.deviation}
          />
        ))}
      </ListCard>
    </div>
  );
}
