"use client";

import { useState } from "react";
import { DirectoryStep, DirectoryUser } from "../../../../../lib/api";

interface AssignOperatorModalProps {
  step: DirectoryStep;
  availableUsers: DirectoryUser[];
  onClose: () => void;
  onChanged: () => void;
}

export function AssignOperatorModal({
  step,
  availableUsers,
  onClose,
  onChanged,
}: AssignOperatorModalProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignedIds = new Set(step.assignments.map((a) => a.user.id));
  const selectableUsers = availableUsers.filter((user) => !assignedIds.has(user.id));

  async function handleAssign() {
    if (!selectedUserId) return;

    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/steps/${step.id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: Number(selectedUserId) }),
    });

    if (response.ok) {
      setSelectedUserId("");
      onChanged();
    } else {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Nao foi possivel atribuir o operador.");
    }
    setSubmitting(false);
  }

  async function handleRemove(userId: number) {
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/steps/${step.id}/assignments/${userId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      onChanged();
    } else {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Nao foi possivel remover o operador.");
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
        <h2 className="text-base font-semibold text-zinc-900">
          Atribuir operadores — {step.stepTemplate.name}
        </h2>

        <div className="mt-4 space-y-2">
          {step.assignments.length === 0 && (
            <p className="text-sm text-zinc-400">Nenhum operador atribuído.</p>
          )}
          {step.assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm"
            >
              <span className="text-zinc-900">{assignment.user.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(assignment.user.id)}
                disabled={submitting}
                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <label
              htmlFor="assign_user_id"
              className="block text-sm font-medium text-zinc-700"
            >
              Adicionar operador
            </label>
            <select
              id="assign_user_id"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            >
              <option value="">Selecione</option>
              {selectableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAssign}
            disabled={submitting || !selectedUserId}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
          >
            Adicionar
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
