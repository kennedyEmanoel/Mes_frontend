"use client";

import { ReactNode } from "react";
import { DashboardCard } from "../lib/api";
import { stepColor } from "../lib/production";
import { ConsolidatedChart, SectorsDonut } from "./PanelCharts";

interface PanelSidebarProps {
  cards: DashboardCard[];
  selectedId: number | null;
  loading: boolean;
  onSelect: (cardId: number) => void;
  renderCard: (card: DashboardCard) => ReactNode;
}

/** Coluna lateral: um bloco por cartão do dia (clicar fixa a etapa) e o consolidado do dia. */
export function PanelSidebar({ cards, selectedId, loading, onSelect, renderCard }: PanelSidebarProps) {
  return (
    <aside className="w-80 shrink-0 space-y-2 overflow-y-auto border-r border-zinc-300 bg-zinc-200 p-3">
      {!loading && cards.length === 0 && (
        <p className="mt-10 text-center text-sm text-zinc-500">Nenhum cartão nesta data.</p>
      )}

      {cards.map((card) => {
        const active = card.cardId === selectedId;
        return (
          <button
            key={card.cardId}
            type="button"
            onClick={() => onSelect(card.cardId)}
            className={`block w-full rounded-xl text-left transition ${
              active ? "scale-[1.01] opacity-100 ring-4 ring-zinc-900/60" : "opacity-70 hover:opacity-90"
            }`}
          >
            {renderCard(card)}
          </button>
        );
      })}

      {cards.length >= 2 && (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-600">Consolidado do dia</p>
          <div className="mt-2 h-40">
            <ConsolidatedChart cards={cards} />
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-zinc-600">
            Produção por setor
          </p>
          <div className="mt-2 h-40">
            <SectorsDonut cards={cards} />
          </div>
        </div>
      )}
    </aside>
  );
}

export function StepBanner({ card, slot }: { card: DashboardCard; slot: string | null }) {
  return (
    <div
      className={`${stepColor(card.stepTemplate, card.variation)} flex flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-3 text-white`}
    >
      <div>
        <p className="text-3xl font-black uppercase tracking-wider">{card.label}</p>
        <p className="text-sm font-medium text-white/70">{card.product}</p>
      </div>
      <div className="rounded-lg border-2 border-white/30 bg-black/25 px-4 py-2 text-right">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
          Faixa de horário
        </p>
        <p className="text-2xl font-black tracking-wider">{slot ?? "—"}</p>
      </div>
    </div>
  );
}

export function PanelMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-48 items-center justify-center text-lg text-zinc-400">
      {children}
    </div>
  );
}
