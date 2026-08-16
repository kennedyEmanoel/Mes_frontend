"use client";

import { FormEvent, useState } from "react";
import { ApiError, DirectoryStep, DirectoryStepTemplate } from "../../../../../lib/api";

interface FormState {
  step_template_id: string;
  order_index: string;
  target_quantity: string;
}

interface FormErrors {
  step_template_id?: string;
  order_index?: string;
  form?: string;
}

interface StepFormModalProps {
  editingStep: DirectoryStep | null;
  productionOrderId: number;
  stepTemplates: DirectoryStepTemplate[];
  onClose: () => void;
  onSaved: () => void;
}

function initialState(step: DirectoryStep | null): FormState {
  if (!step) {
    return { step_template_id: "", order_index: "", target_quantity: "" };
  }
  return {
    step_template_id: String(step.stepTemplate.id),
    order_index: String(step.orderIndex),
    target_quantity: String(step.targetQuantity),
  };
}

export function StepFormModal({
  editingStep,
  productionOrderId,
  stepTemplates,
  onClose,
  onSaved,
}: StepFormModalProps) {
  const [form, setForm] = useState<FormState>(initialState(editingStep));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(state: FormState): FormErrors {
    const nextErrors: FormErrors = {};

    if (!state.step_template_id) {
      nextErrors.step_template_id = "Selecione a etapa.";
    }
    if (state.order_index.trim() === "" || Number(state.order_index) < 0) {
      nextErrors.order_index = "Informe uma ordem valida.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    const url = editingStep ? `/api/steps/${editingStep.id}` : "/api/steps";
    const method = editingStep ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_template_id: Number(form.step_template_id),
          order_index: Number(form.order_index),
          target_quantity: form.target_quantity ? Number(form.target_quantity) : undefined,
          productionOrderId,
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
            : "Nao foi possivel salvar a etapa. Tente novamente.",
      });
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
        <h2 className="text-base font-semibold text-zinc-900">
          {editingStep ? "Editar etapa" : "Nova etapa"}
        </h2>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="step_template_id"
              className="block text-sm font-medium text-zinc-700"
            >
              Etapa
            </label>
            <select
              id="step_template_id"
              value={form.step_template_id}
              onChange={(e) => updateField("step_template_id", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            >
              <option value="">Selecione a etapa</option>
              {stepTemplates.map((stepTemplate) => (
                <option key={stepTemplate.id} value={stepTemplate.id}>
                  {stepTemplate.name}
                </option>
              ))}
            </select>
            {errors.step_template_id && (
              <p className="mt-1 text-xs text-red-600">{errors.step_template_id}</p>
            )}
          </div>

          <div>
            <label htmlFor="order_index" className="block text-sm font-medium text-zinc-700">
              Ordem
            </label>
            <input
              id="order_index"
              type="number"
              min={0}
              value={form.order_index}
              onChange={(e) => updateField("order_index", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Ex: 1"
            />
            {errors.order_index && (
              <p className="mt-1 text-xs text-red-600">{errors.order_index}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="target_quantity"
              className="block text-sm font-medium text-zinc-700"
            >
              Quantidade alvo <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <input
              id="target_quantity"
              type="number"
              min={0}
              value={form.target_quantity}
              onChange={(e) => updateField("target_quantity", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Ex: 100"
            />
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
