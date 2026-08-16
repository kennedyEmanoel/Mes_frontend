"use client";

import { FormEvent, useState } from "react";
import { ApiError, DirectoryProduct } from "../../../lib/api";

interface FormState {
  sku: string;
  commercial_name: string;
  version: string;
}

interface FormErrors {
  sku?: string;
  commercial_name?: string;
  form?: string;
}

interface ProductFormModalProps {
  editingProduct: DirectoryProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

function initialState(product: DirectoryProduct | null): FormState {
  if (!product) {
    return { sku: "", commercial_name: "", version: "" };
  }
  return {
    sku: product.sku,
    commercial_name: product.commercialName,
    version: product.version ?? "",
  };
}

export function ProductFormModal({
  editingProduct,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const [form, setForm] = useState<FormState>(initialState(editingProduct));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(state: FormState): FormErrors {
    const nextErrors: FormErrors = {};

    if (!state.sku.trim()) {
      nextErrors.sku = "Informe o SKU.";
    }
    if (!state.commercial_name.trim()) {
      nextErrors.commercial_name = "Informe o nome comercial.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
    const method = editingProduct ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: form.sku.trim(),
          commercial_name: form.commercial_name.trim(),
          version: form.version.trim() || undefined,
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
            : "Nao foi possivel salvar o produto. Tente novamente.",
      });
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
        <h2 className="text-base font-semibold text-zinc-900">
          {editingProduct ? "Editar produto" : "Novo produto"}
        </h2>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-zinc-700">
              SKU
            </label>
            <input
              id="sku"
              type="text"
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Ex: PRD-001"
            />
            {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
          </div>

          <div>
            <label
              htmlFor="commercial_name"
              className="block text-sm font-medium text-zinc-700"
            >
              Nome comercial
            </label>
            <input
              id="commercial_name"
              type="text"
              value={form.commercial_name}
              onChange={(e) => updateField("commercial_name", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Nome do produto"
            />
            {errors.commercial_name && (
              <p className="mt-1 text-xs text-red-600">{errors.commercial_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="version" className="block text-sm font-medium text-zinc-700">
              Versão <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <input
              id="version"
              type="text"
              value={form.version}
              onChange={(e) => updateField("version", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Ex: 1.0"
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
