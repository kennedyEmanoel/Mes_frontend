"use client";

import { DashboardCard } from "../../lib/api";
import {
  DARK_STATUS_TEXT_CLASS,
  STATUS_TEXT_CLASS,
  efficiency,
  efficiencyStatus,
  formatBalance,
  formatPercent,
  localToday,
  stepChartColor,
  stepColor,
} from "../../lib/production";
import { HourlyChart } from "../PanelCharts";
import { PanelHeader } from "../PanelHeader";
import { PanelMessage, PanelSidebar, StepBanner } from "../PanelParts";
import { useCarousel, useFullscreen, useNow, usePanelData, usePanelParams } from "../usePanelData";

type Totals = { produced: number; target: number };

function totalsOf(card: DashboardCard | undefined): Totals {
  return { produced: card?.totalProduced ?? 0, target: card?.totalTarget ?? 0 };
}

function MiniTotal({ label, total }: { label: string; total: Totals }) {
  const value = efficiency(total.produced, total.target);
  return (
    <div className="flex-1 rounded-md bg-black/25 px-2 py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">{label}</p>
      <p className="text-xl font-extrabold leading-tight">{total.produced.toLocaleString("pt-BR")}</p>
      <p className={`text-xs font-bold ${DARK_STATUS_TEXT_CLASS[efficiencyStatus(value)]}`}>
        {formatPercent(value, 1)}
      </p>
    </div>
  );
}

function StepCard({ day, slot }: { day: DashboardCard; slot: DashboardCard | undefined }) {
  return (
    <div className={`${stepColor(day.stepTemplate, day.variation)} space-y-2 rounded-xl p-3 text-white`}>
      <div>
        <p className="text-base font-extrabold uppercase leading-tight tracking-wide">{day.label}</p>
        <p className="text-xs font-medium text-white/60">{day.product}</p>
      </div>
      <div className="flex gap-2">
        <MiniTotal label="Dia" total={totalsOf(day)} />
        <MiniTotal label="Faixa" total={totalsOf(slot)} />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  detail,
  valueClass,
}: {
  label: string;
  value: string;
  detail: string;
  valueClass: string;
}) {
  return (
    <div className="space-y-1.5 rounded-xl bg-zinc-900 px-5 py-4 text-white">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</p>
      <p className={`text-4xl font-black leading-none ${valueClass}`}>{value}</p>
      <p className="text-xs font-semibold text-white/45">{detail}</p>
    </div>
  );
}

function StepDetail({
  day,
  slotCard,
  slot,
}: {
  day: DashboardCard;
  slotCard: DashboardCard | undefined;
  slot: string | null;
}) {
  const slotTotal = totalsOf(slotCard);
  const slotEfficiency = efficiency(slotTotal.produced, slotTotal.target);
  const dayEfficiency = day.efficiency;
  const dayStatus = efficiencyStatus(dayEfficiency);

  return (
    <div className="space-y-5">
      <StepBanner card={day} slot={slot} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi
          label={`Realizado — ${slot ?? "dia todo"}`}
          value={slotTotal.produced.toLocaleString("pt-BR")}
          detail={`Meta: ${slotTotal.target}`}
          valueClass="text-white"
        />
        <Kpi
          label="Eficiência da faixa"
          value={formatPercent(slotEfficiency, 1)}
          detail={`Saldo: ${formatBalance(slotTotal.produced - slotTotal.target)}`}
          valueClass={DARK_STATUS_TEXT_CLASS[efficiencyStatus(slotEfficiency)]}
        />
        <Kpi
          label="Acumulado do dia"
          value={day.totalProduced.toLocaleString("pt-BR")}
          detail={
            dayEfficiency === null
              ? "Sem meta"
              : `Efic.: ${formatPercent(dayEfficiency, 1)} | Saldo: ${formatBalance(day.balance)}`
          }
          valueClass="text-white"
        />
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-600">
          Produção por faixa de horário
        </p>
        <div className="mt-2 h-56">
          {day.byHour.length > 0 ? (
            <HourlyChart
              hours={day.byHour}
              color={stepChartColor(day.stepTemplate, day.variation)}
            />
          ) : (
            <PanelMessage>Sem registros neste dia</PanelMessage>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-600">Progresso do dia</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-7 flex-1 overflow-hidden rounded-full bg-zinc-200">
            <div
              className={`${stepColor(day.stepTemplate, day.variation)} flex h-full items-center justify-end rounded-full pr-2 transition-[width] duration-700`}
              style={{ width: `${Math.min(dayEfficiency ?? 0, 100)}%` }}
            >
              {(dayEfficiency ?? 0) > 15 && (
                <span className="text-sm font-extrabold text-white">
                  {formatPercent(dayEfficiency)}
                </span>
              )}
            </div>
          </div>
          <p className={`min-w-16 text-right text-sm font-bold ${STATUS_TEXT_CLASS[dayStatus]}`}>
            {formatPercent(dayEfficiency, 1)}
          </p>
        </div>
        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>
            Realizado: <strong>{day.totalProduced}</strong>
          </span>
          <span>
            Meta: <strong>{day.totalTarget}</strong>
          </span>
          <span>
            Saldo: <strong className={STATUS_TEXT_CLASS[dayStatus]}>{formatBalance(day.balance)}</strong>
          </span>
        </div>
      </section>
    </div>
  );
}

/** Painel geral: todas as etapas com o total do dia e da faixa, sem detalhar operadores. */
export default function GeneralPanelPage() {
  const now = useNow();
  const { params, setParams } = usePanelParams();
  const { date, snapshot, failure } = usePanelData(params, localToday());
  const dayCards = snapshot?.day.cards ?? [];
  const carousel = useCarousel(dayCards.map((card) => card.cardId));
  const fullscreen = useFullscreen();
  const slotCardOf = (cardId: number) =>
    snapshot?.bySlot.cards.find((card) => card.cardId === cardId);
  const selected = dayCards.find((card) => card.cardId === carousel.selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100">
      <PanelHeader
        title="Painel geral"
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
          renderCard={(card) => <StepCard day={card} slot={slotCardOf(card.cardId)} />}
        />

        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">
          {!snapshot ? (
            <PanelMessage>Carregando...</PanelMessage>
          ) : !selected ? (
            <PanelMessage>Nenhum cartão de produção nesta data.</PanelMessage>
          ) : (
            <StepDetail day={selected} slotCard={slotCardOf(selected.cardId)} slot={snapshot.slot} />
          )}
        </main>
      </div>
    </div>
  );
}
