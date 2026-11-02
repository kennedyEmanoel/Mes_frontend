"use client";

import { DashboardCard } from "../../lib/api";
import {
  DARK_STATUS_TEXT_CLASS,
  EfficiencyStatus,
  efficiency,
  efficiencyStatus,
  formatBalance,
  formatPercent,
  localToday,
  stepChartColor,
  stepColor,
} from "../../lib/production";
import { OperatorsChart } from "../PanelCharts";
import { PanelHeader } from "../PanelHeader";
import { PanelMessage, PanelSidebar, StepBanner } from "../PanelParts";
import { useCarousel, useFullscreen, useNow, usePanelData, usePanelParams } from "../usePanelData";

const OPERATOR_TILE: Record<EfficiencyStatus, { box: string; bar: string; icon: string }> = {
  "on-target": { box: "border-green-500 bg-green-900", bar: "bg-green-500", icon: "✓" },
  "near-target": { box: "border-amber-500 bg-amber-900", bar: "bg-amber-500", icon: "~" },
  critical: { box: "border-red-600 bg-red-900", bar: "bg-red-600", icon: "✗" },
  "no-data": { box: "border-zinc-500 bg-zinc-700", bar: "bg-zinc-500", icon: "—" },
};

function DayCard({ card }: { card: DashboardCard }) {
  return (
    <div className={`${stepColor(card.stepTemplate, card.variation)} space-y-2 rounded-xl p-3 text-white`}>
      <div>
        <p className="text-lg font-extrabold uppercase leading-tight tracking-wide">{card.label}</p>
        <p className="text-xs font-medium text-white/60">{card.product}</p>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 rounded-md bg-black/25 px-2 py-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Realizado no dia</p>
          <p className="text-xl font-extrabold">{card.totalProduced.toLocaleString("pt-BR")}</p>
        </div>
        <div className="flex-1 rounded-md bg-black/25 px-2 py-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Eficiência</p>
          <p className={`text-xl font-extrabold ${DARK_STATUS_TEXT_CLASS[efficiencyStatus(card.efficiency)]}`}>
            {formatPercent(card.efficiency, 1)}
          </p>
        </div>
      </div>
    </div>
  );
}

function OperatorTile({ operator }: { operator: DashboardCard["byOperator"][number] }) {
  const value = efficiency(operator.totalProduced, operator.totalTarget);
  const status = efficiencyStatus(value);
  const style = OPERATOR_TILE[status];
  const balance = operator.totalProduced - operator.totalTarget;

  return (
    <div className={`${style.box} space-y-3 rounded-xl border-[3px] p-4 text-white`}>
      <div className="flex items-center justify-between">
        <p className="text-base font-extrabold">{operator.name}</p>
        <p className="text-2xl leading-none">{style.icon}</p>
      </div>
      {status === "no-data" ? (
        <p className="text-sm text-white/60">Sem registro nesta faixa</p>
      ) : (
        <>
          <div className="flex gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-white/50">Real.</p>
              <p className="text-3xl font-black leading-none">{operator.totalProduced}</p>
            </div>
            <div className="border-l border-white/15 pl-3">
              <p className="text-[10px] font-bold uppercase text-white/50">Meta</p>
              <p className="text-3xl font-black leading-none text-white/50">{operator.totalTarget}</p>
            </div>
            <div className="border-l border-white/15 pl-3">
              <p className="text-[10px] font-bold uppercase text-white/50">Saldo</p>
              <p className={`text-3xl font-black leading-none ${DARK_STATUS_TEXT_CLASS[status]}`}>
                {formatBalance(balance)}
              </p>
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs font-bold">
              <span className="text-white/50">EFICIÊNCIA</span>
              <span className={DARK_STATUS_TEXT_CLASS[status]}>{formatPercent(value, 1)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/35">
              <div
                className={`${style.bar} h-full rounded-full transition-[width] duration-700`}
                style={{ width: `${Math.min(value ?? 0, 100)}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Painel detalhado: uma etapa por vez, com o desempenho de cada operador na faixa. */
export default function DetailedPanelPage() {
  const now = useNow();
  const { params, setParams } = usePanelParams();
  const { date, snapshot, failure } = usePanelData(params, localToday());
  const dayCards = snapshot?.day.cards ?? [];
  const carousel = useCarousel(dayCards.map((card) => card.cardId));
  const fullscreen = useFullscreen();
  const selected = snapshot?.bySlot.cards.find((card) => card.cardId === carousel.selectedId) ?? null;
  const hasSlotData = selected?.byOperator.some((o) => o.totalProduced > 0 || o.totalTarget > 0);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100">
      <PanelHeader
        title="Painel detalhado"
        params={params}
        onParamsChange={setParams}
        date={date}
        snapshot={snapshot}
        failure={failure}
        now={now}
        carousel={{ rotating: carousel.rotating, pinned: carousel.pinned, onResume: carousel.resume }}
        fullscreen={fullscreen}
      />

      <div className="flex min-h-0 flex-1">
        <PanelSidebar
          cards={dayCards}
          selectedId={carousel.selectedId}
          loading={!snapshot}
          onSelect={carousel.select}
          renderCard={(card) => <DayCard card={card} />}
        />

        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">
          {!snapshot ? (
            <PanelMessage>Carregando...</PanelMessage>
          ) : !selected ? (
            <PanelMessage>Nenhum cartão de produção nesta data.</PanelMessage>
          ) : (
            <div className="space-y-5">
              <StepBanner card={selected} slot={snapshot.slot} />

              <section className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-600">
                  Realizado × saldo por operador — {snapshot.slot ?? "dia todo"}
                </p>
                <div className="mt-2 h-48">
                  {hasSlotData ? (
                    <OperatorsChart
                      operators={selected.byOperator}
                      color={stepChartColor(selected.stepTemplate, selected.variation)}
                    />
                  ) : (
                    <PanelMessage>Sem registros para esta faixa de horário</PanelMessage>
                  )}
                </div>
              </section>

              <section>
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-600">
                  Detalhe por operador — {snapshot.slot ?? "dia todo"}
                </p>
                {selected.byOperator.length === 0 ? (
                  <PanelMessage>Nenhum operador escalado neste cartão.</PanelMessage>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {selected.byOperator.map((operator) => (
                      <OperatorTile key={operator.name} operator={operator} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
