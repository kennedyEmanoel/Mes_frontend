"use client";

import { useState } from "react";
import { Breadcrumb } from "../../../components/Breadcrumb";
import { DeleteImpactModal } from "../../../components/DeleteImpactModal";
import {
  RegistryActions,
  RegistryEmptyRow,
  RegistryLoading,
  RegistryTabs,
  RegistryToolbar,
  StatusBadge,
} from "../../../components/Registry";
import { DirectoryOperator } from "../../../lib/api";
import { branchName } from "../../../lib/branches";
import { useRegistry } from "../../../lib/useRegistry";
import { OperatorFormModal } from "./OperatorFormModal";

const BREADCRUMB = (
  <Breadcrumb items={[{ label: "Produção", href: "/producao" }, { label: "Operadores" }]} />
);

export default function OperadoresPage() {
  const registry = useRegistry<DirectoryOperator>("/api/operators", "operators", (o) => o.name);
  const [modalOperator, setModalOperator] = useState<DirectoryOperator | null | "new">(null);
  const [deletingOperator, setDeletingOperator] = useState<DirectoryOperator | null>(null);

  if (registry.loading || !registry.user) {
    return <RegistryLoading breadcrumb={BREADCRUMB} />;
  }

  const showBranch = registry.user.role === "admin";
  const columns = 2 + (showBranch ? 1 : 0) + (registry.canManage ? 1 : 0);

  return (
    <div>
      {BREADCRUMB}

      <div className="px-6 py-6">
        <RegistryTabs />

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Operadores</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Pessoas que podem ser escaladas nos cartões de produção.
            </p>
          </div>
          {registry.canManage && (
            <button
              type="button"
              onClick={() => setModalOperator("new")}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Novo operador
            </button>
          )}
        </div>

        <RegistryToolbar
          search={registry.search}
          onSearchChange={registry.setSearch}
          searchPlaceholder="Buscar operador..."
          showInactive={registry.showInactive}
          onShowInactiveChange={registry.setShowInactive}
          inactiveCount={registry.inactiveCount}
          error={registry.error}
          onDismissError={() => registry.setError(null)}
        />

        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Nome</th>
                {showBranch && (
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Filial</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                {registry.canManage && (
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {registry.visible.length === 0 && (
                <RegistryEmptyRow
                  colSpan={columns}
                  message={
                    registry.items.length === 0
                      ? "Nenhum operador cadastrado ainda."
                      : "Nenhum operador encontrado."
                  }
                />
              )}
              {registry.visible.map((operator) => (
                <tr key={operator.id} className={operator.active ? "" : "text-zinc-400"}>
                  <td className="px-4 py-3 font-medium">{operator.name}</td>
                  {showBranch && (
                    <td className="px-4 py-3 text-zinc-500">{branchName(operator.branchId)}</td>
                  )}
                  <td className="px-4 py-3">
                    <StatusBadge active={operator.active} />
                  </td>
                  {registry.canManage && (
                    <td className="px-4 py-3">
                      <RegistryActions
                        active={operator.active}
                        canManage={registry.canManage}
                        canDelete={registry.canDelete}
                        onEdit={() => setModalOperator(operator)}
                        onToggleActive={() => registry.toggleActive(operator)}
                        onDelete={() => setDeletingOperator(operator)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOperator !== null && (
        <OperatorFormModal
          editingOperator={modalOperator === "new" ? null : modalOperator}
          currentUser={registry.user}
          onClose={() => setModalOperator(null)}
          onSaved={() => {
            setModalOperator(null);
            registry.reload();
          }}
        />
      )}

      {deletingOperator && (
        <DeleteImpactModal
          title="Excluir operador"
          question={
            <>
              Excluir o operador <strong>{deletingOperator.name}</strong>? Os cartões em que
              ele foi escalado continuam, sem os registros dele.
            </>
          }
          url={`/api/operators/${deletingOperator.id}`}
          deactivateHint="Para quem saiu da empresa, prefira Desativar."
          onClose={() => setDeletingOperator(null)}
          onDeleted={() => {
            setDeletingOperator(null);
            registry.reload();
          }}
        />
      )}
    </div>
  );
}
