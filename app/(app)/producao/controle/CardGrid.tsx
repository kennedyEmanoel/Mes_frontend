"use client";

import { Fragment, KeyboardEvent, useEffect, useState } from "react";
import { DeleteImpactModal } from "../../../components/DeleteImpactModal";
import {
  ProductionCard,
  ProductionCardOperator,
  ProductionOptions,
  ProductionRecord,
  TimeSlot,
} from "../../../lib/api";
import {
  DARK_STATUS_TEXT_CLASS,
  STATUS_TEXT_CLASS,
  balanceClass,
  efficiency,
  efficiencyStatus,
  formatBalance,
  formatDay,
  formatPercent,
  plural,
} from "../../../lib/production";

type CellKey = `${number}|${string}`;

interface CellDraft {
  target: string;
  produced: string;
}

interface CardGridProps {
  card: ProductionCard;
  onCardChange: (update: (card: ProductionCard) => ProductionCard) => void;
  operators: ProductionOptions["operators"];
  canEdit: boolean;
  canDelete: boolean;
  onBack: () => void;
  onDeleted: () => void;
  onDirtyChange: (count: number) => void;
}

const OPERATOR_COLORS = [
  "bg-orange-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-blue-600",
  "bg-red-600",
  "bg-amber-600",
  "bg-teal-600",
  "bg-pink-600",
];

const cellKey = (cardOperatorId: number, timeSlot: string): CellKey =>
  `${cardOperatorId}|${timeSlot}`;

function recordOf(operator: ProductionCardOperator, timeSlot: string) {
  return operator.records.find((record) => record.timeSlot === timeSlot);
}

function sumRecords(records: ProductionRecord[]) {
  return records.reduce(
    (total, record) => ({
      produced: total.produced + record.produced,
      target: total.target + record.target,
    }),
    { produced: 0, target: 0 },
  );
}

/** Inteiro ≥ 0 digitado numa célula; null se vazio ou inválido. */
function toCount(value: string): number | null {
  return /^\d+$/.test(value.trim()) ? Number(value) : null;
}

function withoutKeys<T>(record: Record<string, T>, drop: (key: string) => boolean) {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !drop(key)));
}

/** Cartão aberto: grade de faixas × operadores, com rascunho por célula até salvar. */
export function CardGrid({
  card,
  onCardChange,
  operators,
  canEdit,
  canDelete,
  onBack,
  onDeleted,
  onDirtyChange,
}: CardGridProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[] | null>(null);
  const [drafts, setDrafts] = useState<Record<CellKey, CellDraft>>({});
  const [saving, setSaving] = useState<Set<CellKey>>(new Set());
  const [justSaved, setJustSaved] = useState<Set<CellKey>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [targetInput, setTargetInput] = useState(String(card.defaultHourlyTarget));
  const [selectedOperatorId, setSelectedOperatorId] = useState<number | null>(null);
  const [addingOperator, setAddingOperator] = useState(false);
  const [removingOperator, setRemovingOperator] = useState<ProductionCardOperator | null>(null);
  const [removing, setRemoving] = useState(false);
  const [deletingCard, setDeletingCard] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/time-slots?date=${card.date}`).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (cancelled) return;
      if (response.ok) setTimeSlots(body);
      else setError(body?.message ?? "Não foi possível carregar a grade de horários.");
    });
    return () => {
      cancelled = true;
    };
  }, [card.date]);

  useEffect(() => {
    onDirtyChange(Object.keys(drafts).length);
  }, [drafts, onDirtyChange]);

  const day = formatDay(card.date);
  const gridLabels = timeSlots?.map((slot) => slot.label) ?? [];
  const extraLabels = [
    ...new Set(card.operators.flatMap((o) => o.records.map((r) => r.timeSlot))),
  ]
    .filter((label) => !gridLabels.includes(label))
    .sort();
  const rows = [
    ...gridLabels.map((label) => ({ label, inGrid: true })),
    ...extraLabels.map((label) => ({ label, inGrid: false })),
  ];

  const availableOperators = operators.filter(
    (o) => o.branchId === card.branchId && !card.operators.some((c) => c.operatorId === o.id),
  );
  const chosenOperator =
    availableOperators.find((o) => o.id === selectedOperatorId) ?? availableOperators[0] ?? null;

  const operatorTotals = card.operators.map((operator) => {
    const total = sumRecords(operator.records);
    return { id: operator.id, ...total, balance: total.produced - total.target };
  });
  const grandTotal = sumRecords(card.operators.flatMap((o) => o.records));
  const grandEfficiency = efficiency(grandTotal.produced, grandTotal.target);
  const operatorColumns = canEdit ? 4 : 3;

  function valuesOf(operator: ProductionCardOperator, timeSlot: string): CellDraft {
    const draft = drafts[cellKey(operator.id, timeSlot)];
    if (draft) return draft;
    const record = recordOf(operator, timeSlot);
    return record
      ? { target: String(record.target), produced: String(record.produced) }
      : { target: String(card.defaultHourlyTarget), produced: "0" };
  }

  function changeCell(
    operator: ProductionCardOperator,
    timeSlot: string,
    field: keyof CellDraft,
    value: string,
  ) {
    const key = cellKey(operator.id, timeSlot);
    const current = valuesOf(operator, timeSlot);
    setDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] ?? current), [field]: value } }));
  }

  async function saveCell(operator: ProductionCardOperator, timeSlot: string) {
    const key = cellKey(operator.id, timeSlot);
    const values = valuesOf(operator, timeSlot);
    const target = toCount(values.target);
    const produced = toCount(values.produced);
    if (target === null || target <= 0) {
      setError(`Informe a meta da faixa ${timeSlot} antes de salvar.`);
      return;
    }
    if (produced === null) {
      setError(`Realizado inválido na faixa ${timeSlot}.`);
      return;
    }

    setError(null);
    setSaving((prev) => new Set(prev).add(key));
    const response = await fetch(`/api/production-cards/operators/${operator.id}/records`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time_slot: timeSlot, target, produced }),
    });
    const body = await response.json().catch(() => null);
    setSaving((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    if (!response.ok) {
      setError(body?.message ?? "Não foi possível salvar o registro.");
      return;
    }

    const saved = body as ProductionRecord;
    onCardChange((current) => ({
      ...current,
      operators: current.operators.map((o) =>
        o.id !== operator.id
          ? o
          : {
              ...o,
              records: [...o.records.filter((r) => r.timeSlot !== timeSlot), saved].sort((a, b) =>
                a.timeSlot.localeCompare(b.timeSlot),
              ),
            },
      ),
    }));
    // Só descarta o rascunho se ninguém digitou de novo enquanto salvava.
    setDrafts((prev) =>
      prev[key]?.target === values.target && prev[key]?.produced === values.produced
        ? withoutKeys(prev, (k) => k === key)
        : prev,
    );
    setJustSaved((prev) => new Set(prev).add(key));
    setTimeout(
      () =>
        setJustSaved((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        }),
      1500,
    );
  }

  function saveOnEnter(
    event: KeyboardEvent<HTMLInputElement>,
    operator: ProductionCardOperator,
    timeSlot: string,
  ) {
    if (event.key === "Enter") saveCell(operator, timeSlot);
  }

  async function saveDefaultTarget() {
    const value = toCount(targetInput);
    if (value === null) {
      setError("Meta padrão deve ser um número inteiro maior ou igual a zero.");
      setTargetInput(String(card.defaultHourlyTarget));
      return;
    }
    if (value === card.defaultHourlyTarget) return;

    const response = await fetch(`/api/production-cards/${card.id}/default-target`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default_hourly_target: value }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Não foi possível alterar a meta padrão.");
      setTargetInput(String(card.defaultHourlyTarget));
      return;
    }
    onCardChange((current) => ({ ...current, defaultHourlyTarget: value }));
  }

  async function addOperator() {
    if (!chosenOperator) return;
    setAddingOperator(true);
    setError(null);
    const response = await fetch(`/api/production-cards/${card.id}/operators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operator_id: chosenOperator.id }),
    });
    const body = await response.json().catch(() => null);
    setAddingOperator(false);
    if (!response.ok) {
      setError(body?.message ?? "Não foi possível adicionar o operador.");
      return;
    }
    const added = body.cardOperator as ProductionCardOperator;
    onCardChange((current) =>
      current.operators.some((o) => o.id === added.id)
        ? current
        : { ...current, operators: [...current.operators, added] },
    );
    setSelectedOperatorId(null);
  }

  async function confirmRemoveOperator() {
    if (!removingOperator) return;
    setRemoving(true);
    const response = await fetch(`/api/production-cards/operators/${removingOperator.id}`, {
      method: "DELETE",
    });
    setRemoving(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Não foi possível remover o operador.");
      setRemovingOperator(null);
      return;
    }
    const removedId = removingOperator.id;
    onCardChange((current) => ({
      ...current,
      operators: current.operators.filter((o) => o.id !== removedId),
    }));
    setDrafts((prev) => withoutKeys(prev, (k) => k.startsWith(`${removedId}|`)));
    setRemovingOperator(null);
  }

  const removingDrafts = removingOperator
    ? Object.keys(drafts).filter((k) => k.startsWith(`${removingOperator.id}|`)).length
    : 0;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3 rounded-t-lg bg-zinc-900 px-4 py-3 text-white">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/20"
        >
          ← Cartões do dia
        </button>
        <h2 className="flex-1 text-sm font-semibold uppercase tracking-wide">
          Controle de produção — {card.label} | {card.product}
        </h2>
        <span className="text-xs text-zinc-300">
          {day.weekday} {day.full}
        </span>
        {canDelete && (
          <button
            type="button"
            onClick={() => setDeletingCard(true)}
            className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium transition-colors hover:bg-red-700"
          >
            Excluir cartão
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-x border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600">
        <span>Cartão #{card.id}</span>
        <label className="flex items-center gap-2">
          Meta padrão
          {canEdit ? (
            <input
              type="number"
              min={0}
              step={1}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              onBlur={saveDefaultTarget}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="w-16 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            />
          ) : (
            <span className="font-medium text-zinc-900">{card.defaultHourlyTarget}</span>
          )}
        </label>
        {canEdit && (
          <div className="flex items-center gap-2">
            <span>Operador</span>
            <select
              value={chosenOperator?.id ?? ""}
              onChange={(e) => setSelectedOperatorId(Number(e.target.value))}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            >
              {availableOperators.length === 0 && (
                <option value="">
                  {operators.length === 0 ? "Cadastre operadores" : "Todos já escalados"}
                </option>
              )}
              {availableOperators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addOperator}
              disabled={addingOperator || !chosenOperator}
              className="rounded-md bg-zinc-900 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
            >
              Adicionar
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 border-x border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Fechar aviso"
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-b-lg border border-zinc-200 bg-white">
        {timeSlots === null ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-400">Carregando a grade...</p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            Não há faixas de horário na grade para {day.weekday}. Para lançar produção neste dia,
            cadastre faixas para este dia da semana.
          </p>
        ) : (
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="text-white">
                <th rowSpan={2} className="bg-zinc-800 px-3 py-2 text-left font-medium">
                  Horário
                </th>
                {card.operators.map((operator, index) => (
                  <th
                    key={operator.id}
                    colSpan={operatorColumns}
                    className={`${OPERATOR_COLORS[index % OPERATOR_COLORS.length]} border-l border-white/20 px-2 py-2 font-semibold`}
                  >
                    {operator.name}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setRemovingOperator(operator)}
                        aria-label={`Remover ${operator.name} do cartão`}
                        title="Remover do cartão"
                        className="ml-2 text-white/70 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </th>
                ))}
                <th rowSpan={2} className="border-l border-white/20 bg-teal-700 px-2 py-2 font-medium">
                  Tot. real.
                </th>
                <th rowSpan={2} className="bg-teal-700 px-2 py-2 font-medium">
                  Tot. meta
                </th>
                <th rowSpan={2} className="bg-teal-700 px-2 py-2 font-medium">
                  % ating.
                </th>
              </tr>
              <tr className="bg-zinc-100 text-zinc-500">
                {card.operators.map((operator) => (
                  <Fragment key={operator.id}>
                    <th className="border-l border-zinc-200 px-2 py-1 font-medium">Meta</th>
                    <th className="px-2 py-1 font-medium">Real.</th>
                    <th className="px-2 py-1 font-medium">Saldo</th>
                    {canEdit && <th className="px-2 py-1" />}
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, inGrid }) => {
                const rowTotal = sumRecords(
                  card.operators.flatMap((o) => {
                    const record = recordOf(o, label);
                    return record ? [record] : [];
                  }),
                );
                const rowEfficiency = efficiency(rowTotal.produced, rowTotal.target);
                return (
                  <tr key={label} className="border-b border-zinc-100">
                    <td className="whitespace-nowrap border-r-2 border-zinc-200 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-700">
                      {label}
                      {!inGrid && (
                        <span className="block text-[10px] font-normal text-zinc-400">
                          fora da grade
                        </span>
                      )}
                    </td>
                    {card.operators.map((operator) => {
                      const key = cellKey(operator.id, label);
                      const record = recordOf(operator, label);
                      const values = valuesOf(operator, label);
                      const isDraft = key in drafts;
                      const editable = canEdit && inGrid;
                      const target = toCount(values.target);
                      const produced = toCount(values.produced);
                      const targetInvalid = target === null || target <= 0;
                      const balance = (produced ?? 0) - (target ?? 0);
                      const cellBg = isDraft ? "bg-yellow-50" : "";
                      return (
                        <Fragment key={operator.id}>
                          <td className={`border-l border-zinc-100 px-1 py-1 text-center ${cellBg}`}>
                            {editable ? (
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={values.target}
                                aria-label={`Meta de ${operator.name} em ${label}`}
                                onChange={(e) => changeCell(operator, label, "target", e.target.value)}
                                onKeyDown={(e) => saveOnEnter(e, operator, label)}
                                className={`w-14 rounded border px-1 py-0.5 text-center text-xs outline-none focus:border-zinc-500 ${
                                  isDraft && targetInvalid ? "border-red-300" : "border-zinc-300"
                                }`}
                              />
                            ) : (
                              <span className="text-zinc-700">{record?.target ?? "—"}</span>
                            )}
                          </td>
                          <td className={`px-1 py-1 text-center ${cellBg}`}>
                            {editable ? (
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={values.produced}
                                aria-label={`Realizado de ${operator.name} em ${label}`}
                                onChange={(e) =>
                                  changeCell(operator, label, "produced", e.target.value)
                                }
                                onKeyDown={(e) => saveOnEnter(e, operator, label)}
                                className="w-14 rounded border border-zinc-300 bg-green-50 px-1 py-0.5 text-center text-xs outline-none focus:border-zinc-500"
                              />
                            ) : (
                              <span className="text-zinc-700">{record?.produced ?? "—"}</span>
                            )}
                          </td>
                          <td
                            className={`px-1 py-1 text-center font-semibold ${
                              record || isDraft ? balanceClass(balance) : "text-zinc-300"
                            } ${cellBg}`}
                          >
                            {record || isDraft ? formatBalance(balance) : "—"}
                          </td>
                          {canEdit && (
                            <td className={`px-1 py-1 text-center ${cellBg}`}>
                              {inGrid && (
                                <button
                                  type="button"
                                  onClick={() => saveCell(operator, label)}
                                  disabled={saving.has(key) || targetInvalid}
                                  title={
                                    targetInvalid
                                      ? "Informe a meta antes de salvar"
                                      : "Salvar este registro"
                                  }
                                  className={`min-w-12 rounded px-2 py-0.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed ${
                                    justSaved.has(key)
                                      ? "bg-green-600 text-white"
                                      : targetInvalid
                                        ? "bg-zinc-200 text-zinc-400"
                                        : isDraft
                                          ? "bg-zinc-900 text-white hover:bg-zinc-700"
                                          : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
                                  }`}
                                >
                                  {saving.has(key) ? "..." : justSaved.has(key) ? "✓" : "Salvar"}
                                </button>
                              )}
                            </td>
                          )}
                        </Fragment>
                      );
                    })}
                    <td className="border-l-2 border-zinc-200 px-2 py-1 text-center font-semibold text-zinc-800">
                      {rowTotal.produced || "—"}
                    </td>
                    <td className="px-2 py-1 text-center font-semibold text-zinc-800">
                      {rowTotal.target || "—"}
                    </td>
                    <td
                      className={`px-2 py-1 text-center font-semibold ${STATUS_TEXT_CLASS[efficiencyStatus(rowEfficiency)]}`}
                    >
                      {formatPercent(rowEfficiency, 1)}
                    </td>
                  </tr>
                );
              })}

              <tr className="bg-zinc-900 font-semibold text-white">
                <td className="whitespace-nowrap px-3 py-2">Total geral</td>
                {operatorTotals.map((total) => (
                  <Fragment key={total.id}>
                    <td className="border-l border-white/10 px-1 py-2 text-center">{total.target}</td>
                    <td className="px-1 py-2 text-center">{total.produced}</td>
                    <td
                      className={`px-1 py-2 text-center ${total.balance < 0 ? "text-red-300" : "text-green-300"}`}
                    >
                      {formatBalance(total.balance)}
                    </td>
                    {canEdit && <td />}
                  </Fragment>
                ))}
                <td className="border-l-2 border-white/10 px-2 py-2 text-center">
                  {grandTotal.produced}
                </td>
                <td className="px-2 py-2 text-center">{grandTotal.target}</td>
                <td
                  className={`px-2 py-2 text-center ${DARK_STATUS_TEXT_CLASS[efficiencyStatus(grandEfficiency)]}`}
                >
                  {formatPercent(grandEfficiency, 1)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {card.operators.length === 0 && canEdit && (
        <p className="mt-3 text-sm text-zinc-500">
          Nenhum operador neste cartão ainda. Escolha um operador acima e clique em
          &quot;Adicionar&quot; para começar a lançar.
        </p>
      )}

      {removingOperator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-zinc-900">Remover operador do cartão</h2>
            <p className="mt-3 text-sm text-zinc-700">
              Remover <strong>{removingOperator.name}</strong> deste cartão?
            </p>
            {removingOperator.records.length > 0 ? (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900">
                {removingOperator.records.length === 1
                  ? "O registro hora a hora dele neste cartão será apagado."
                  : `Os ${plural(removingOperator.records.length, "registro hora a hora", "registros hora a hora")} dele neste cartão serão apagados.`}{" "}
                Não há como desfazer.
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Ele ainda não tem registros neste cartão.</p>
            )}
            {removingDrafts > 0 && (
              <p className="mt-3 text-sm text-amber-700">
                {removingDrafts === 1
                  ? "A célula não salva dele será descartada."
                  : `As ${plural(removingDrafts, "célula não salva", "células não salvas")} dele serão descartadas.`}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-5">
              <button
                type="button"
                onClick={() => setRemovingOperator(null)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRemoveOperator}
                disabled={removing}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {removing ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingCard && (
        <DeleteImpactModal
          title="Excluir cartão"
          question={
            <>
              Excluir o cartão{" "}
              <strong>
                {card.label} · {card.product}
              </strong>{" "}
              de {day.full}?
            </>
          }
          url={`/api/production-cards/${card.id}`}
          deactivateHint="Operadores, produto e etapa continuam cadastrados."
          onClose={() => setDeletingCard(false)}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
}
