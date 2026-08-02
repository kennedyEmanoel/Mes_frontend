"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface FormErrors {
  registration_number?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!registrationNumber.trim()) {
      nextErrors.registration_number = "Informe a matricula.";
    }
    if (!password) {
      nextErrors.password = "Informe a senha.";
    }
    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    // Simulacao local: sem chamada de API real, sem token.
    router.push("/profile");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Entrar</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Acesse com sua matricula e senha.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
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
              autoComplete="username"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Ex: 123456"
            />
            {errors.registration_number && (
              <p className="mt-1 text-xs text-red-600">
                {errors.registration_number}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="********"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Nao tem uma conta?{" "}
          <Link href="/register" className="font-medium text-zinc-900 underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  );
}
