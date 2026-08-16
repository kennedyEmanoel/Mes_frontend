"use client";

import { FormEvent, useState } from "react";
import { ApiError, DirectoryUser } from "../../lib/api";
import { ROLE_LABELS, UserRole } from "../../types";

const BRANCH_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Barueri" },
  { value: "2", label: "Santa Rita do Sapucaí" },
  { value: "3", label: "Belo Horizonte" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  branch_id: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  branch_id?: string;
  form?: string;
}

interface UserFormModalProps {
  editingUser: DirectoryUser | null;
  canAssignAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function initialState(user: DirectoryUser | null): FormState {
  if (!user) {
    return { name: "", email: "", password: "", role: "operator", branch_id: "" };
  }
  return {
    name: user.name,
    email: user.email,
    password: "",
    role: user.role,
    branch_id: user.branch ? String(user.branch.id) : "",
  };
}

export function UserFormModal({
  editingUser,
  canAssignAdmin,
  onClose,
  onSaved,
}: UserFormModalProps) {
  const [form, setForm] = useState<FormState>(initialState(editingUser));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const isAdminRole = form.role === "admin";
  const roleOptions = (Object.keys(ROLE_LABELS) as UserRole[]).filter(
    (role) => role !== "admin" || canAssignAdmin,
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(state: FormState): FormErrors {
    const nextErrors: FormErrors = {};

    if (!state.name.trim()) {
      nextErrors.name = "Informe o nome.";
    }
    if (!state.email.trim()) {
      nextErrors.email = "Informe o e-mail.";
    } else if (!EMAIL_REGEX.test(state.email.trim())) {
      nextErrors.email = "Informe um e-mail valido.";
    }
    if (!editingUser && !state.password) {
      nextErrors.password = "Informe uma senha.";
    } else if (state.password && state.password.length < 6) {
      nextErrors.password = "A senha deve ter no minimo 6 caracteres.";
    }
    if (!isAdminRole && !state.branch_id.trim()) {
      nextErrors.branch_id = "Selecione a filial.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = editingUser ? "PATCH" : "POST";
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      branch_id: isAdminRole ? undefined : Number(form.branch_id),
    };
    if (form.password) {
      body.password = form.password;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
            : "Nao foi possivel salvar o usuario. Tente novamente.",
      });
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
        <h2 className="text-base font-semibold text-zinc-900">
          {editingUser ? "Editar usuário" : "Novo usuário"}
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
              placeholder="Nome completo"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="voce@bwsiot.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Senha {editingUser && <span className="font-normal text-zinc-400">(opcional)</span>}
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder={editingUser ? "Deixe em branco para manter" : "Minimo 6 caracteres"}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-zinc-700">
              Perfil
            </label>
            <select
              id="role"
              value={form.role}
              onChange={(e) => updateField("role", e.target.value as UserRole)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>

          {!isAdminRole && (
            <div>
              <label htmlFor="branch_id" className="block text-sm font-medium text-zinc-700">
                Filial
              </label>
              <select
                id="branch_id"
                value={form.branch_id}
                onChange={(e) => updateField("branch_id", e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
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
