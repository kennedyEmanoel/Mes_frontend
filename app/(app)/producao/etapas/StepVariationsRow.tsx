"use client";

import { FormEvent, useState } from "react";
import { DeleteImpactModal } from "../../../components/DeleteImpactModal";
import { StatusBadge } from "../../../components/Registry";
import { DirectoryStepTemplate, DirectoryStepVariation } from "../../../lib/api";

interface StepVariationsRowProps {
  stepTemplate: DirectoryStepTemplate;
  canManage: boolean;
  canDelete: boolean;
  onChanged: () => void;
}

const INPUT_CLASS =
  "w-full max-w-xs rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500";

/** Variações de uma etapa (ex.: Soldagem → Cabos, Retrabalho), geridas na própria linha expandida. */
export function StepVariationsRow({
  stepTemplate,
  canManage,
  canDelete,
  onChanged,
}: StepVariationsRowProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingVariation, setDeletingVariation] = useState<DirectoryStepVariation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(url: string, method: string, payload: object) {
    setBusy(true);
    setError(null);
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Não foi possível salvar a variação.");
      return false;
    }
    onChanged();
    return true;
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) return;
    const saved = await send("/api/step-variations", "POST", {
      step_template_id: stepTemplate.id,
      name: newName.trim(),
    });
    if (saved) setNewName("");
  }

  async function handleRename(event: FormEvent<HTMLFormElement>, variation: DirectoryStepVariation) {
    event.preventDefault();
    const saved = await send(`/api/step-variations/${variation.id}`, "PATCH", {
      name: editingName.trim(),
    });
    if (saved) setEditingId(null);
  }

  function startEditing(variation: DirectoryStepVariation) {
    setEditingId(variation.id);
    setEditingName(variation.name);
    setError(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Variações de {stepTemplate.name}
      </p>

      {stepTemplate.variations.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Esta etapa não tem variações. Ela é usada diretamente nos cartões de produção.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
          {stepTemplate.variations.map((variation) => (
            <li
              key={variation.id}
              className={`flex items-center gap-3 px-3 py-2 ${variation.active ? "" : "text-zinc-400"}`}
            >
              {editingId === variation.id ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={(event) => handleRename(event, variation)}
                >
                  <input
                    autoFocus
                    value={editingName}
                    maxLength={40}
                    onChange={(e) => setEditingName(e.target.value)}
                    className={INPUT_CLASS}
                  />
                  <button
                    type="submit"
                    disabled={busy || !editingName.trim()}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{variation.name}</span>
                  <StatusBadge active={variation.active} />
                  <div className="flex gap-3 whitespace-nowrap">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(variation)}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            send(`/api/step-variations/${variation.id}/active`, "PATCH", {
                              active: !variation.active,
                            })
                          }
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          {variation.active ? "Desativar" : "Reativar"}
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeletingVariation(variation)}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            value={newName}
            maxLength={40}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nova variação (ex.: Retrabalho)"
            className={INPUT_CLASS}
          />
          <button
            type="submit"
            disabled={busy || !newName.trim()}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60"
          >
            Adicionar variação
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {deletingVariation && (
        <DeleteImpactModal
          title="Excluir variação"
          question={
            <>
              Excluir a variação <strong>{deletingVariation.name}</strong> da etapa{" "}
              {stepTemplate.name}?
            </>
          }
          url={`/api/step-variations/${deletingVariation.id}`}
          deactivateHint="Para apenas tirá-la das listas, use Desativar."
          onClose={() => setDeletingVariation(null)}
          onDeleted={() => {
            setDeletingVariation(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
