"use client";

import { ReactNode, useId } from "react";
import { addDays, isIsoDate } from "../../../lib/dates";
import {
  MAX_PERIOD_DAYS,
  MIN_PERIOD_DAYS,
  PerformanceOption,
  VariationFilter,
} from "../../../lib/performance";
import {
  FilterSelection,
  Period,
  availableOperators,
  fixPeriod,
  fixSelection,
  lastDaysPeriod,
  productsOfOperator,
  stepsOfProduct,
  variationsOfStep,
} from "./cascadeOptions";

interface AnalysisFiltersProps {
  options: readonly PerformanceOption[];
  selection: FilterSelection;
  period: Period;
  periodError: string | null;
  today: string;
  dataPeriod: Period | null;
  onSelection: (selection: FilterSelection) => void;
  onPeriod: (period: Period) => void;
}

const PRESETS = [7, 14, 30, 90] as const;

const FIELD_CLASS =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 aria-[invalid=true]:border-red-400";
const PRESET_CLASS =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40";

const toVariation = (text: string): VariationFilter =>
  text === "all" || text === "none" ? text : Number(text);

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-zinc-500">
        {label}
      </label>
      {children}
    </div>
  );
}

export function AnalysisFilters({
  options,
  selection,
  period,
  periodError,
  today,
  dataPeriod,
  onSelection,
  onPeriod,
}: AnalysisFiltersProps) {
  const id = useId();
  const operators = availableOperators(options);
  const products = productsOfOperator(options, selection.operatorId);
  const steps = stepsOfProduct(options, selection.operatorId, selection.productId);
  const variations = variationsOfStep(
    options,
    selection.operatorId,
    selection.productId,
    selection.stepTemplateId,
  );
  const correction = periodError ? fixPeriod(period) : null;

  const change = (patch: Partial<FilterSelection>) =>
    onSelection(fixSelection(options, { ...selection, ...patch }));

  // Os calendários já limitam as datas ao intervalo permitido (7 a 366 dias).
  const startLimits = isIsoDate(period.end)
    ? { min: addDays(period.end, -(MAX_PERIOD_DAYS - 1)), max: addDays(period.end, -(MIN_PERIOD_DAYS - 1)) }
    : {};
  const endLimits = isIsoDate(period.start)
    ? { min: addDays(period.start, MIN_PERIOD_DAYS - 1), max: addDays(period.start, MAX_PERIOD_DAYS - 1) }
    : {};

  return (
    <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Operador" htmlFor={`${id}-operator`}>
          <select
            id={`${id}-operator`}
            value={selection.operatorId ?? ""}
            onChange={(e) => change({ operatorId: Number(e.target.value) })}
            className={`${FIELD_CLASS} min-w-40`}
          >
            {operators.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Produto" htmlFor={`${id}-product`}>
          <select
            id={`${id}-product`}
            value={selection.productId ?? ""}
            onChange={(e) => change({ productId: Number(e.target.value) })}
            className={`${FIELD_CLASS} min-w-36`}
          >
            {products.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Etapa em que atuou" htmlFor={`${id}-step`}>
          <select
            id={`${id}-step`}
            value={selection.stepTemplateId ?? ""}
            onChange={(e) => change({ stepTemplateId: Number(e.target.value), variation: "all" })}
            className={`${FIELD_CLASS} min-w-32`}
          >
            {steps.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        {variations.length > 0 && (
          <Field label="Variação" htmlFor={`${id}-variation`}>
            <select
              id={`${id}-variation`}
              value={String(selection.variation)}
              onChange={(e) => change({ variation: toVariation(e.target.value) })}
              className={`${FIELD_CLASS} min-w-36`}
            >
              {variations.map((v) => (
                <option key={String(v.value)} value={String(v.value)}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Período (mínimo 1 semana)" htmlFor={`${id}-start`}>
          <div className="flex items-center gap-2">
            <input
              id={`${id}-start`}
              type="date"
              aria-label="Data inicial"
              aria-invalid={periodError !== null}
              value={period.start}
              {...startLimits}
              onChange={(e) => onPeriod({ ...period, start: e.target.value })}
              className={FIELD_CLASS}
            />
            <span className="text-xs text-zinc-400">até</span>
            <input
              type="date"
              aria-label="Data final"
              aria-invalid={periodError !== null}
              value={period.end}
              {...endLimits}
              onChange={(e) => onPeriod({ ...period, end: e.target.value })}
              className={FIELD_CLASS}
            />
          </div>
        </Field>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => onPeriod(lastDaysPeriod(days, today))}
              className={PRESET_CLASS}
            >
              {days} dias
            </button>
          ))}
          <button
            type="button"
            disabled={dataPeriod === null}
            title="Do primeiro ao último registro desta combinação (até 366 dias)"
            onClick={() => dataPeriod && onPeriod(dataPeriod)}
            className={PRESET_CLASS}
          >
            Histórico
          </button>
        </div>
      </div>

      {periodError && (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-sm text-red-700">
          <span>⚠ {periodError}</span>
          {correction && (
            <button type="button" onClick={() => onPeriod(correction)} className={PRESET_CLASS}>
              Corrigir período
            </button>
          )}
        </div>
      )}
    </div>
  );
}
