"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DirectoryUser } from "../../lib/api";
import { ROLE_LABELS, UserRole } from "../../types";
import { UserFormModal } from "./UserFormModal";

const ALLOWED_ROLES: UserRole[] = ["manager", "analyst", "admin"];

export default function AdminPage() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [users, setUsers] = useState<DirectoryUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalUser, setModalUser] = useState<DirectoryUser | null | "new">(null);

  function loadUsers() {
    return fetch("/api/users")
      .then((response) => {
        if (!response.ok) throw new Error("failed to load users");
        return response.json();
      })
      .then((data) => setUsers(data.users));
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/me")
      .then((response) => {
        if (!response.ok) throw new Error("unauthenticated");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (!ALLOWED_ROLES.includes(data.user.role)) {
          router.push("/home");
          return;
        }
        setCurrentRole(data.user.role);
        return loadUsers().then(() => {
          if (!cancelled) setLoading(false);
        });
      })
      .catch(() => {
        if (!cancelled) router.push("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleDelete(user: DirectoryUser) {
    if (!window.confirm(`Excluir o usuário "${user.name}"?`)) return;

    const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (response.ok) {
      loadUsers();
    } else {
      const body = await response.json().catch(() => null);
      window.alert(body?.message ?? "Nao foi possivel excluir o usuario.");
    }
  }

  function handleSaved() {
    setModalUser(null);
    loadUsers();
  }

  if (loading || !users || !currentRole) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </div>
    );
  }

  const isAdmin = currentRole === "admin";

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-zinc-900">Usuários</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Lista de usuários cadastrados no sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalUser("new")}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Novo usuário
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">E-mail</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Perfil</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Filial</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => {
              const canManage = isAdmin || user.role !== "admin";
              return (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-zinc-900">{user.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{user.email}</td>
                  <td className="px-4 py-3 text-zinc-500">{ROLE_LABELS[user.role]}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {user.branch ? user.branch.name : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setModalUser(user)}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalUser !== null && (
        <UserFormModal
          editingUser={modalUser === "new" ? null : modalUser}
          canAssignAdmin={isAdmin}
          onClose={() => setModalUser(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
