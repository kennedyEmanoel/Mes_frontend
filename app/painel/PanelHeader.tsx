"use client";

import { useEffect, useState } from "react";
import { ProductionOptions } from "../lib/api";
import { BRANCH_OPTIONS } from "../lib/branches";
import {
  DARK_STATUS_TEXT_CLASS,
  efficiency,
  efficiencyStatus,
  formatDay,
  formatPercent,
} from "../lib/production";
import { usePanelUser } from "./PanelSession";
import { PanelParams, PanelSnapshot } from "./usePanelData";

interface PanelHeaderProps {
  title: string;
  params: PanelParams;
  onParamsChange: (patch: Partial<PanelParams>) => void;
  date: string;
  snapshot: PanelSnapshot | null;
  failure: { message: string; at: number } | null;
  now: number;
  carousel: { rotating: boolean; pinned: boolean; onResume: () => void };
  fullscreen: { isFullscreen: boolean; toggle: () => void };
}

const CONTROL_CLASS =
  "rounded-md border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-white outline-none focus:border-zinc-400";

function elapsed(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min`;
}

function Totals({ label, total }: { label: string; total: { produced: number; target: number } }) {
  const value = efficiency(total.produced, total.target);
  return (
    <div className="text-right">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="text-lg font-bold leading-tight">
        {total.produced.toLocaleString("pt-BR")}
        <span className="text-sm font-medium text-zinc-400"> / {total.target.toLocaleString("pt-BR")}</span>
        <span className={`ml-2 text-base ${DARK_STATUS_TEXT_CLASS[efficiencyStatus(value)]}`}>
          {formatPercent(value, 1)}
        </span>
      </p>
    </div>
  );
}

/** Indicador de atualização: verde quando recente, âmbar se parado, vermelho se a última consulta falhou. */
function Freshness({
  snapshot,
  failure,
  now,
}: Pick<PanelHeaderProps, "snapshot" | "failure" | "now">) {
  if (failure) {
    return (
      <p className="text-xs font-medium text-red-400" title={failure.message}>
        ● Falha ao atualizar
        {snapshot ? ` · dados de ${elapsed(now - snapshot.updatedAt)} atrás` : ""}
      </p>
    );
  }
  if (!snapshot) return <p className="text-xs text-zinc-400">● Carregando...</p>;
  const age = now - snapshot.updatedAt;
  return (
    <p className={`text-xs font-medium ${age > 90_000 ? "text-amber-300" : "text-green-400"}`}>
      ● Atualizado há {elapsed(age)}
    </p>
  );
}

export function PanelHeader({
  title,
  params,
  onParamsChange,
  date,
  snapshot,
  failure,
  now,
  carousel,
  fullscreen,
}: PanelHeaderProps) {
  const user = usePanelUser();
  const [products, setProducts] = useState<ProductionOptions["products"]>([]);
  const day = formatDay(date);
  const branchQuery = params.branchId ? `?branch_id=${params.branchId}` : "";

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/production-cards/options${branchQuery}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((options: ProductionOptions | null) => {
        if (!cancelled && options) setProducts(options.products);
      });
    return () => {
      cancelled = true;
    };
  }, [branchQuery]);

  return (
    <header className="shrink-0 bg-zinc-900 text-white">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        <h1 className="text-base font-bold uppercase tracking-wider">{title}</h1>

        <div className="rounded-lg border-2 border-blue-500 bg-zinc-800 px-4 py-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
            Faixa {params.timeSlot ? "(fixada)" : "atual"}
          </p>
          <p className="text-xl font-black tracking-wide">{snapshot?.slot ?? "—"}</p>
        </div>

        <div className="text-sm text-zinc-300">
          <p>
            {day.weekday} {day.full}
            {!params.date && <span className="text-zinc-500"> (hoje)</span>}
          </p>
          <p className="text-zinc-400">{snapshot?.day.product ?? "Todos"}</p>
        </div>

        {carousel.rotating && (
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-300">
            ⟳ Carrossel a cada 60 s
          </p>
        )}
        {carousel.pinned && (
          <button
            type="button"
            onClick={carousel.onResume}
            className="rounded-md border border-orange-400 px-2 py-1 text-xs font-semibold text-orange-300 hover:bg-orange-400/10"
          >
            Etapa fixada · retomar carrossel
          </button>
        )}

        <div className="ml-auto flex items-center gap-6">
          {snapshot && <Totals label="Dia" total={snapshot.day.total} />}
          {snapshot?.slot && <Totals label="Faixa" total={snapshot.bySlot.total} />}
          <Freshness snapshot={snapshot} failure={failure} now={now} />
          <button
            type="button"
            onClick={fullscreen.toggle}
            title={fullscreen.isFullscreen ? "Sair da tela cheia (F)" : "Tela cheia (F)"}
            className="rounded-md border border-zinc-600 px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            ⛶ <span className="text-xs text-zinc-500">F</span>
          </button>
        </div>
      </div>

      {!fullscreen.isFullscreen && (
        <div className="flex flex-wrap items-center gap-4 border-t border-zinc-800 bg-zinc-950 px-5 py-2 text-sm text-zinc-300">
          {user.role === "admin" && (
            <label className="flex items-center gap-2">
              Filial
              <select
                value={params.branchId ?? ""}
                onChange={(e) =>
                  onParamsChange({ branchId: Number(e.target.value) || null, productId: null })
                }
                className={CONTROL_CLASS}
              >
                <option value="">Todas</option>
                {BRANCH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2">
            Data
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && onParamsChange({ date: e.target.value, timeSlot: null })}
              className={CONTROL_CLASS}
            />
          </label>
          <label className="flex items-center gap-2">
            Produto
            <select
              value={params.productId ?? ""}
              onChange={(e) => onParamsChange({ productId: Number(e.target.value) || null })}
              className={CONTROL_CLASS}
            >
              <option value="">Todos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Faixa
            <select
              value={params.timeSlot ?? ""}
              onChange={(e) => onParamsChange({ timeSlot: e.target.value || null })}
              className={CONTROL_CLASS}
            >
              <option value="">Atual (segue o relógio)</option>
              {snapshot?.slots.map((slot) => (
                <option key={slot.id} value={slot.label}>
                  {slot.label}
                </option>
              ))}
            </select>
          </label>
          <p className="ml-auto text-xs text-zinc-500">
            Atualiza sozinho a cada 30 s. A configuração fica no endereço da página (pode virar
            favorito da TV). Tecla F: tela cheia.
          </p>
        </div>
      )}
    </header>
  );
}
