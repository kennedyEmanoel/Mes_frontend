"use client";

import { Fragment, useState } from "react";
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
import { DirectoryStepTemplate } from "../../../lib/api";
import { useRegistry } from "../../../lib/useRegistry";
import { StepTemplateFormModal } from "./StepTemplateFormModal";
import { StepVariationsRow } from "./StepVariationsRow";

const BREADCRUMB = (
  <Breadcrumb items={[{ label: "Produção", href: "/producao" }, { label: "Etapas" }]} />
);

export default function EtapasPage() {
  const registry = useRegistry<DirectoryStepTemplate>(
    "/api/step-templates",
    "stepTemplates",
    (s) => `${s.name} ${s.description ?? ""} ${s.variations.map((v) => v.name).join(" ")}`,
  );
  const [modalStepTemplate, setModalStepTemplate] = useState<
    DirectoryStepTemplate | null | "new"
  >(null);
  const [deletingStepTemplate, setDeletingStepTemplate] =
    useState<DirectoryStepTemplate | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (registry.loading) {
    return <RegistryLoading breadcrumb={BREADCRUMB} />;
  }

  const columns = 5 + (registry.canManage ? 1 : 0);

  function toggleExpanded(id: number) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {BREADCRUMB}

      <div className="px-6 py-6">
        <RegistryTabs />

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Etapas</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Etapas do processo e suas variações (ex.: Soldagem → Cabos, Retrabalho). A ordem
              de cadastro é a ordem de exibição.
            </p>
          </div>
          {registry.canManage && (
            <button
              type="button"
              onClick={() => setModalStepTemplate("new")}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Nova etapa
            </button>
          )}
        </div>

        <RegistryToolbar
          search={registry.search}
          onSearchChange={registry.setSearch}
          searchPlaceholder="Buscar etapa ou variação..."
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
                <th className="w-10 px-2 py-3" />
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Descrição</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Variações</th>
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
                      ? "Nenhuma etapa cadastrada ainda."
                      : "Nenhuma etapa encontrada."
                  }
                />
              )}
              {registry.visible.map((stepTemplate) => {
                const isExpanded = expanded.has(stepTemplate.id);
                const activeVariations = stepTemplate.variations.filter((v) => v.active);
                return (
                  <Fragment key={stepTemplate.id}>
                    <tr className={stepTemplate.active ? "" : "text-zinc-400"}>
                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(stepTemplate.id)}
                          aria-label={isExpanded ? "Recolher variações" : "Ver variações"}
                          aria-expanded={isExpanded}
                          className="h-6 w-6 rounded-md text-zinc-500 hover:bg-zinc-100"
                        >
                          <span
                            className={`inline-block transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          >
                            ▸
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium">{stepTemplate.name}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-zinc-500">
                        {stepTemplate.description ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {activeVariations.length > 0
                          ? activeVariations.map((v) => v.name).join(", ")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge active={stepTemplate.active} />
                      </td>
                      {registry.canManage && (
                        <td className="px-4 py-3">
                          <RegistryActions
                            active={stepTemplate.active}
                            canManage={registry.canManage}
                            canDelete={registry.canDelete}
                            onEdit={() => setModalStepTemplate(stepTemplate)}
                            onToggleActive={() => registry.toggleActive(stepTemplate)}
                            onDelete={() => setDeletingStepTemplate(stepTemplate)}
                          />
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <tr className="bg-zinc-50">
                        <td colSpan={columns} className="px-6 py-4">
                          <StepVariationsRow
                            stepTemplate={stepTemplate}
                            canManage={registry.canManage}
                            canDelete={registry.canDelete}
                            onChanged={registry.reload}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalStepTemplate !== null && (
        <StepTemplateFormModal
          editingStepTemplate={modalStepTemplate === "new" ? null : modalStepTemplate}
          onClose={() => setModalStepTemplate(null)}
          onSaved={() => {
            setModalStepTemplate(null);
            registry.reload();
          }}
        />
      )}

      {deletingStepTemplate && (
        <DeleteImpactModal
          title="Excluir etapa"
          question={
            <>
              Excluir a etapa <strong>{deletingStepTemplate.name}</strong>? As variações e os
              cartões dela também serão apagados.
            </>
          }
          url={`/api/step-templates/${deletingStepTemplate.id}`}
          deactivateHint="Para apenas tirá-la das listas, use Desativar."
          onClose={() => setDeletingStepTemplate(null)}
          onDeleted={() => {
            setDeletingStepTemplate(null);
            registry.reload();
          }}
        />
      )}
    </div>
  );
}
