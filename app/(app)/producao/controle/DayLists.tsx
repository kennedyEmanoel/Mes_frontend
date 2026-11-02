"use client";

import { DayCard, DayWithCards } from "../../../lib/api";
import {
  STATUS_TEXT_CLASS,
  efficiency,
  efficiencyStatus,
  formatDay,
  formatPercent,
  plural,
  stepColor,
} from "../../../lib/production";

interface DayListsProps {
  selectedDate: string;
  days: DayWithCards[];
  cards: DayCard[];
  loading: boolean;
  onSelectDay: (date: string) => void;
  onOpenCard: (id: number) => void;
}

/** Sem cartão aberto: os últimos dias com cartões e os cartões do dia escolhido. */
export function DayLists({
  selectedDate,
  days,
  cards,
  loading,
  onSelectDay,
  onOpenCard,
}: DayListsProps) {
  const selected = formatDay(selectedDate);
  const totalProduced = cards.reduce((sum, card) => sum + card.totalProduced, 0);
  const totalTarget = cards.reduce((sum, card) => sum + card.totalTarget, 0);
  const dayEfficiency = efficiency(totalProduced, totalTarget);

  return (
    <div className="mt-6 space-y-6">
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Dias com registro
        </h2>
        {days.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">
            {loading
              ? "Carregando..."
              : 'Ainda não há cartões. Escolha os filtros acima e clique em "Abrir / Criar".'}
          </p>
        ) : (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {days.map((day) => {
              const label = formatDay(day.date);
              const dayEff = efficiency(day.totalProduced, day.totalTarget);
              const isSelected = day.date === selectedDate;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => onSelectDay(day.date)}
                  className={`min-w-28 shrink-0 rounded-lg border bg-white px-3 py-2 text-left transition-colors hover:bg-zinc-50 ${
                    isSelected ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"
                  }`}
                >
                  <p className="text-xs font-medium uppercase text-zinc-500">{label.weekday}</p>
                  <p className="text-base font-semibold text-zinc-900">{label.short}</p>
                  <p className="text-xs text-zinc-500">{plural(day.cards, "cartão", "cartões")}</p>
                  <p className={`text-sm font-semibold ${STATUS_TEXT_CLASS[efficiencyStatus(dayEff)]}`}>
                    {formatPercent(dayEff)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Cartões de {selected.weekday} {selected.short}
          </h2>
          {cards.length > 0 && (
            <p className="text-sm text-zinc-500">
              {plural(cards.length, "cartão", "cartões")} · {totalProduced} de {totalTarget}{" "}
              <span className={`font-semibold ${STATUS_TEXT_CLASS[efficiencyStatus(dayEfficiency)]}`}>
                {formatPercent(dayEfficiency, 1)}
              </span>
            </p>
          )}
        </div>

        {loading ? (
          <p className="mt-2 text-sm text-zinc-400">Carregando...</p>
        ) : cards.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">
            Nenhum cartão neste dia. Escolha produto e etapa acima e clique em &quot;Abrir /
            Criar&quot; para começar um novo.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onOpenCard(card.id)}
                title="Abrir este cartão"
                className="overflow-hidden rounded-lg border border-zinc-200 bg-white text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`${stepColor(card.stepTemplate, card.variation)} px-3 py-2 text-white`}>
                  <p className="text-sm font-semibold uppercase tracking-wide">{card.label}</p>
                  <p className="text-xs text-white/80">{card.product}</p>
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-3">
                  <div className="text-sm text-zinc-600">
                    <p>{plural(card.operators, "operador", "operadores")}</p>
                    <p>
                      <span className="font-semibold text-zinc-900">{card.totalProduced}</span> de{" "}
                      {card.totalTarget}
                    </p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${STATUS_TEXT_CLASS[efficiencyStatus(card.efficiency)]}`}
                  >
                    {formatPercent(card.efficiency)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
