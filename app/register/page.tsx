"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "../types";
import { saveMockUser } from "../mockSession";

interface FormState {
  name: string;
  registration_number: string;
  role: UserRole;
  email: string;
  password: string;
  branch_id: string;
}

interface FormErrors {
  name?: string;
  registration_number?: string;
  role?: string;
  email?: string;
  password?: string;
  branch_id?: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "operator", label: "Operador" },
  { value: "manager", label: "Gerente" },
  { value: "analyst", label: "Analista" },
  { value: "admin", label: "Administrador" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_STATE: FormState = {
  name: "",
  registration_number: "",
  role: "operator",
  email: "",
  password: "",
  branch_id: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = form.role === "admin";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleRoleChange(role: UserRole) {
    setForm((prev) => ({
      ...prev,
      role,
      branch_id: role === "admin" ? "" : prev.branch_id,
    }));
  }

  function validate(state: FormState): FormErrors {
    const nextErrors: FormErrors = {};

    if (!state.name.trim()) {
      nextErrors.name = "Informe o nome.";
    }

    if (!state.registration_number.trim()) {
      nextErrors.registration_number = "Informe a matricula.";
    }

    if (!state.role) {
      nextErrors.role = "Selecione um perfil.";
    }

    if (state.email.trim() && !EMAIL_REGEX.test(state.email.trim())) {
      nextErrors.email = "Informe um e-mail valido.";
    }

    if (!state.password) {
      nextErrors.password = "Informe uma senha.";
    } else if (state.password.length < 6) {
      nextErrors.password = "A senha deve ter no minimo 6 caracteres.";
    }

    if (state.role !== "admin") {
      if (!state.branch_id.trim()) {
        nextErrors.branch_id = "Informe a filial.";
      } else if (!/^\d+$/.test(state.branch_id.trim())) {
        nextErrors.branch_id = "A filial deve ser um numero.";
      }
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    // Simulacao local: sem chamada de API real, sem persistencia de token.
    saveMockUser({
      name: form.name.trim(),
      registration_number: form.registration_number.trim(),
      role: form.role,
      email: form.email.trim() || undefined,
      branch_id: form.role === "admin" ? null : Number(form.branch_id),
    });

    router.push("/login");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Criar conta</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Preencha os dados para se cadastrar.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Nome completo"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label
              htmlFor="registration_number"
              className="block text-sm font-medium text-zinc-700"
            >
              Matricula
            </label>
            <input
              id="registration_number"
              name="registration_number"
              type="text"
              value={form.registration_number}
              onChange={(e) => updateField("registration_number", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Ex: 123456"
            />
            {errors.registration_number && (
              <p className="mt-1 text-xs text-red-600">{errors.registration_number}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-zinc-700">
              Perfil
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              E-mail <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="voce@empresa.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Minimo 6 caracteres"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {!isAdmin && (
            <div>
              <label
                htmlFor="branch_id"
                className="block text-sm font-medium text-zinc-700"
              >
                Filial
              </label>
              <input
                id="branch_id"
                name="branch_id"
                type="number"
                value={form.branch_id}
                onChange={(e) => updateField("branch_id", e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                placeholder="Ex: 1"
              />
              {errors.branch_id && (
                <p className="mt-1 text-xs text-red-600">{errors.branch_id}</p>
              )}
            </div>
          )}

          {isAdmin && (
            <p className="text-xs text-zinc-400">
              Administradores nao possuem filial vinculada.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
          >
            {submitting ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Ja tem uma conta?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
