"use client";

import { FormEvent, useState } from "react";
import { DirectoryOperator } from "../../../lib/api";
import { BRANCH_OPTIONS } from "../../../lib/branches";
import { SessionUser } from "../../../types";

interface FormErrors {
  name?: string;
  branch_id?: string;
  form?: string;
}

interface OperatorFormModalProps {
  editingOperator: DirectoryOperator | null;
  currentUser: SessionUser;
  onClose: () => void;
  onSaved: () => void;
}

export function OperatorFormModal({
  editingOperator,
  currentUser,
  onClose,
  onSaved,
}: OperatorFormModalProps) {
  const [name, setName] = useState(editingOperator?.name ?? "");
  const [branchId, setBranchId] = useState(String(currentUser.branchId ?? ""));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const choosesBranch = !editingOperator && currentUser.role === "admin";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Informe o nome do operador.";
    }
    if (choosesBranch && !branchId) {
      nextErrors.branch_id = "Selecione a filial.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    const response = await fetch(
      editingOperator ? `/api/operators/${editingOperator.id}` : "/api/operators",
      {
        method: editingOperator ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          branch_id: choosesBranch ? Number(branchId) : undefined,
        }),
      },
    );

    if (response.ok) {
      onSaved();
      return;
    }

    const body = await response.json().catch(() => null);
    setErrors({ form: body?.message ?? "Não foi possível salvar o operador." });
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
        <h2 className="text-base font-semibold text-zinc-900">
          {editingOperator ? "Editar operador" : "Novo operador"}
        </h2>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
              Nome
            </label>
            <input
              id="name"
              type="text"
              autoFocus
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Nome do operador"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Salvo em maiúsculas, como aparece nos cartões de produção.
            </p>
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {choosesBranch && (
            <div>
              <label htmlFor="branch_id" className="block text-sm font-medium text-zinc-700">
                Filial
              </label>
              <select
                id="branch_id"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              >
                <option value="">Selecione</option>
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
          )}

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
