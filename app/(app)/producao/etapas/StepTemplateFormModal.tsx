"use client";

import { FormEvent, useState } from "react";
import { ApiError, DirectoryStepTemplate } from "../../../lib/api";

interface FormState {
  name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  form?: string;
}

interface StepTemplateFormModalProps {
  editingStepTemplate: DirectoryStepTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}

function initialState(stepTemplate: DirectoryStepTemplate | null): FormState {
  if (!stepTemplate) {
    return { name: "", description: "" };
  }
  return {
    name: stepTemplate.name,
    description: stepTemplate.description ?? "",
  };
}

export function StepTemplateFormModal({
  editingStepTemplate,
  onClose,
  onSaved,
}: StepTemplateFormModalProps) {
  const [form, setForm] = useState<FormState>(initialState(editingStepTemplate));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(state: FormState): FormErrors {
    const nextErrors: FormErrors = {};

    if (!state.name.trim()) {
      nextErrors.name = "Informe o nome da etapa.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    const url = editingStepTemplate
      ? `/api/step-templates/${editingStepTemplate.id}`
      : "/api/step-templates";
    const method = editingStepTemplate ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
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
            : "Nao foi possivel salvar o modelo de etapa. Tente novamente.",
      });
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
        <h2 className="text-base font-semibold text-zinc-900">
          {editingStepTemplate ? "Editar modelo de etapa" : "Novo modelo de etapa"}
        </h2>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Ex: Montagem"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
              Descrição <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Descreva o que essa etapa envolve"
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
