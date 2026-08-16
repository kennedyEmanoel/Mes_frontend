"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, registerUser } from "../lib/api";

interface FormState {
  name: string;
  email: string;
  password: string;
  branch_id: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  branch_id?: string;
  form?: string;
}

const BRANCH_OPTIONS: { value: string; label: string }[] = [
  { value: "3", label: "Santa Rita do Sapucaí (SRS)" },
  { value: "4", label: "Belo Horizonte (BH)" },
  { value: "2", label: "São Paulo (SP)" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_STATE: FormState = {
  name: "",
  email: "",
  password: "",
  branch_id: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = false;

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

    if (!state.password) {
      nextErrors.password = "Informe uma senha.";
    } else if (state.password.length < 6) {
      nextErrors.password = "A senha deve ter no minimo 6 caracteres.";
    }

    if (!isAdmin && !state.branch_id.trim()) {
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

    try {
      await registerUser({
        name: form.name.trim(),
        role: "operator",
        email: form.email.trim(),
        password: form.password,
        branch_id: isAdmin ? undefined : Number(form.branch_id),
      });
      router.push("/login");
    } catch (error) {
      setErrors({
        form:
          error instanceof ApiError
            ? error.message
            : "Nao foi possivel criar a conta. Tente novamente.",
      });
      setSubmitting(false);
    }
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
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              E-mail
            </label>
            <input
              id="email"
              name="email"
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
              <select
                id="branch_id"
                name="branch_id"
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

          {isAdmin && (
            <p className="text-xs text-zinc-400">
              Administradores nao possuem filial vinculada.
            </p>
          )}

          {errors.form && (
            <p className="text-sm text-red-600">{errors.form}</p>
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
