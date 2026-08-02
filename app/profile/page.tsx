"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "../types";
import { clearMockUser, getMockUser } from "../mockSession";

export default function ProfilePage() {
  const router = useRouter();
  const [user] = useState(getMockUser);

  function handleLogout() {
    // Simulacao local: sem token para revogar, apenas limpa os dados mockados.
    clearMockUser();
    router.push("/login");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Meu perfil</h1>
        <p className="mt-1 text-sm text-zinc-500">Dados simulados do usuario.</p>

        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-400">Nome</dt>
            <dd className="text-sm text-zinc-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-400">Matricula</dt>
            <dd className="text-sm text-zinc-900">{user.registration_number}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-400">Perfil</dt>
            <dd className="text-sm text-zinc-900">{ROLE_LABELS[user.role]}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-400">E-mail</dt>
            <dd className="text-sm text-zinc-900">{user.email || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-400">Filial</dt>
            <dd className="text-sm text-zinc-900">
              {user.branch_id !== null ? user.branch_id : "-"}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Sair
        </button>
      </div>
    </main>
  );
}
