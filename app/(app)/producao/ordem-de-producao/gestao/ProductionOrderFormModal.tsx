"use client";

import { FormEvent, useState } from "react";
import {
  ApiError,
  DirectoryProduct,
  DirectoryProductionOrder,
  PRODUCTION_ORDER_STATUSES,
  ProductionOrderStatus,
} from "../../../../lib/api";
import { SessionUser } from "../../../../types";

const BRANCH_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Barueri" },
  { value: "2", label: "Santa Rita do Sapucaí" },
  { value: "3", label: "Belo Horizonte" },
];

// <input type="date"> devolve "YYYY-MM-DD"; o backend espera um DateTime ISO-8601 completo.
function toIsoDateTime(dateOnly: string): string | undefined {
  return dateOnly ? new Date(`${dateOnly}T00:00:00.000Z`).toISOString() : undefined;
}

interface FormState {
  op_number: string;
  product_id: string;
  branch_id: string;
  start_date: string;
  estimated_end_date: string;
  target_quantity: string;
  status: ProductionOrderStatus;
}

interface FormErrors {
  op_number?: string;
  product_id?: string;
  branch_id?: string;
  target_quantity?: string;
  form?: string;
}

interface ProductionOrderFormModalProps {
  editingOrder: DirectoryProductionOrder | null;
  currentUser: SessionUser;
  products: DirectoryProduct[];
  onClose: () => void;
  onSaved: () => void;
}

function initialState(
  order: DirectoryProductionOrder | null,
  currentUser: SessionUser,
): FormState {
  if (!order) {
    return {
      op_number: "",
      product_id: "",
      branch_id: currentUser.role === "admin" ? "" : String(currentUser.branchId ?? ""),
      start_date: "",
      estimated_end_date: "",
      target_quantity: "",
      status: "Aberta",
    };
  }
  return {
    op_number: order.opNumber,
    product_id: String(order.product.id),
    branch_id: String(order.branch.id),
    start_date: order.startDate?.slice(0, 10) ?? "",
    estimated_end_date: order.estimatedEndDate?.slice(0, 10) ?? "",
    target_quantity: String(order.targetQuantity),
    status: order.status,
  };
}

export function ProductionOrderFormModal({
  editingOrder,
  currentUser,
  products,
  onClose,
  onSaved,
}: ProductionOrderFormModalProps) {
  const [form, setForm] = useState<FormState>(initialState(editingOrder, currentUser));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const canChooseBranch = currentUser.role === "admin";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(state: FormState): FormErrors {
    const nextErrors: FormErrors = {};

    if (!state.op_number.trim()) {
      nextErrors.op_number = "Informe o numero da OP.";
    }
    if (!state.product_id) {
      nextErrors.product_id = "Selecione o produto.";
    }
    if (!state.branch_id) {
      nextErrors.branch_id = "Selecione a filial.";
    }
    if (!state.target_quantity || Number(state.target_quantity) < 1) {
      nextErrors.target_quantity = "Informe uma quantidade valida.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    const url = editingOrder
      ? `/api/production-orders/${editingOrder.id}`
      : "/api/production-orders";
    const method = editingOrder ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op_number: form.op_number.trim(),
          product_id: Number(form.product_id),
          branch_id: Number(form.branch_id),
          start_date: toIsoDateTime(form.start_date),
          estimated_end_date: toIsoDateTime(form.estimated_end_date),
          target_quantity: Number(form.target_quantity),
          status: form.status,
        }),
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new ApiError(response.status, responseBody?.message ?? "Erro desconhecido.");
      }

      onSaved();
    } catch (error) {
      setErrors({
        form:
          error instanceof ApiError
            ? error.message
            : "Nao foi possivel salvar a ordem de producao. Tente novamente.",
      });
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
        <h2 className="text-base font-semibold text-zinc-900">
          {editingOrder ? "Editar ordem de produção" : "Nova ordem de produção"}
        </h2>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="op_number" className="block text-sm font-medium text-zinc-700">
              Número da OP
            </label>
            <input
              id="op_number"
              type="text"
              value={form.op_number}
              onChange={(e) => updateField("op_number", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Ex: OP-0001"
            />
            {errors.op_number && (
              <p className="mt-1 text-xs text-red-600">{errors.op_number}</p>
            )}
          </div>

          <div>
            <label htmlFor="product_id" className="block text-sm font-medium text-zinc-700">
              Produto
            </label>
            <select
              id="product_id"
              value={form.product_id}
              onChange={(e) => updateField("product_id", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            >
              <option value="">Selecione o produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} — {product.commercialName}
                </option>
              ))}
            </select>
            {errors.product_id && (
              <p className="mt-1 text-xs text-red-600">{errors.product_id}</p>
            )}
          </div>

          <div>
            <label htmlFor="branch_id" className="block text-sm font-medium text-zinc-700">
              Filial
            </label>
            <select
              id="branch_id"
              value={form.branch_id}
              onChange={(e) => updateField("branch_id", e.target.value)}
              disabled={!canChooseBranch}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-500"
            >
              <option value="">Selecione a filial</option>
              {BRANCH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.branch_id && (
              <p className="mt-1 text-xs text-red-600">{errors.branch_id}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-zinc-700">
                Início <span className="font-normal text-zinc-400">(opcional)</span>
              </label>
              <input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => updateField("start_date", e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label
                htmlFor="estimated_end_date"
                className="block text-sm font-medium text-zinc-700"
              >
                Previsão fim <span className="font-normal text-zinc-400">(opcional)</span>
              </label>
              <input
                id="estimated_end_date"
                type="date"
                value={form.estimated_end_date}
                onChange={(e) => updateField("estimated_end_date", e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="target_quantity"
              className="block text-sm font-medium text-zinc-700"
            >
              Quantidade alvo
            </label>
            <input
              id="target_quantity"
              type="number"
              min={1}
              value={form.target_quantity}
              onChange={(e) => updateField("target_quantity", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Ex: 100"
            />
            {errors.target_quantity && (
              <p className="mt-1 text-xs text-red-600">{errors.target_quantity}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-zinc-700">
              Status
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value as ProductionOrderStatus)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            >
              {PRODUCTION_ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
            >
              {submitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
