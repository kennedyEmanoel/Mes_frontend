"use client";

import { ReactNode } from "react";
import { ProductionOptions } from "../../../lib/api";
import { BRANCH_OPTIONS } from "../../../lib/branches";

export interface CardFilterState {
  date: string;
  productId: number | null;
  stepTemplateId: number | null;
  variationId: number | null;
  defaultTarget: number;
}

interface CardFiltersProps {
  filters: CardFilterState;
  onChange: (filters: CardFilterState) => void;
  options: ProductionOptions | null;
  branchId: number | null;
  /** Só o admin escolhe a filial; para os demais, a filial é a do usuário. */
  onBranchChange: ((branchId: number) => void) | null;
  canEdit: boolean;
  loading: boolean;
  onFind: () => void;
  onOpen: () => void;
}

const FIELD_CLASS =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

export function CardFilters({
  filters,
  onChange,
  options,
  branchId,
  onBranchChange,
  canEdit,
  loading,
  onFind,
  onOpen,
}: CardFiltersProps) {
  const products = options?.products ?? [];
  const stepTemplates = options?.stepTemplates ?? [];
  const step = stepTemplates.find((s) => s.id === filters.stepTemplateId) ?? null;

  function update(patch: Partial<CardFilterState>) {
    onChange({ ...filters, ...patch });
  }

  function changeStep(stepTemplateId: number) {
    const next = stepTemplates.find((s) => s.id === stepTemplateId);
    update({ stepTemplateId, variationId: next?.variations[0]?.id ?? null });
  }

  return (
    <div className="mt-6 flex flex-wrap items-end gap-4 rounded-lg border border-zinc-200 bg-white p-4">
      {onBranchChange && (
        <Field label="Filial">
          <select
            value={branchId ?? ""}
            onChange={(e) => onBranchChange(Number(e.target.value))}
            className={FIELD_CLASS}
          >
            {BRANCH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Data">
        <input
          type="date"
          value={filters.date}
          onChange={(e) => e.target.value && update({ date: e.target.value })}
          className={FIELD_CLASS}
        />
      </Field>

      <Field label="Produto">
        <select
          value={filters.productId ?? ""}
          onChange={(e) => update({ productId: e.target.value ? Number(e.target.value) : null })}
          className={`${FIELD_CLASS} min-w-40`}
        >
          {products.length === 0 && <option value="">Cadastre um produto</option>}
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Etapa">
        <select
          value={filters.stepTemplateId ?? ""}
          onChange={(e) => changeStep(Number(e.target.value))}
          className={FIELD_CLASS}
        >
          {stepTemplates.length === 0 && <option value="">Cadastre uma etapa</option>}
          {stepTemplates.map((stepTemplate) => (
            <option key={stepTemplate.id} value={stepTemplate.id}>
              {stepTemplate.name}
            </option>
          ))}
        </select>
      </Field>

      {step && step.variations.length > 0 && (
        <Field label="Variação">
          <select
            value={filters.variationId ?? ""}
            onChange={(e) =>
              update({ variationId: e.target.value ? Number(e.target.value) : null })
            }
            className={FIELD_CLASS}
          >
            <option value="">Sem variação</option>
            {step.variations.map((variation) => (
              <option key={variation.id} value={variation.id}>
                {variation.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {canEdit && (
        <Field label="Meta/h">
          <input
            type="number"
            min={0}
            step={1}
            value={filters.defaultTarget}
            onChange={(e) => update({ defaultTarget: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })}
            className={`${FIELD_CLASS} w-20`}
          />
        </Field>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onFind}
          disabled={loading}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60"
        >
          Consultar
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={onOpen}
            disabled={loading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
          >
            {loading ? "Abrindo..." : "Abrir / Criar"}
          </button>
        )}
      </div>
    </div>
  );
}
