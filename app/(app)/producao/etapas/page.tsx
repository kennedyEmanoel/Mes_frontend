"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "../../../components/Breadcrumb";
import { DirectoryStepTemplate } from "../../../lib/api";
import { UserRole } from "../../../types";
import { StepTemplateFormModal } from "./StepTemplateFormModal";

const MANAGE_ROLES: UserRole[] = ["manager", "analyst", "admin"];

export default function EtapasPage() {
  const router = useRouter();
  const [canManage, setCanManage] = useState(false);
  const [stepTemplates, setStepTemplates] = useState<DirectoryStepTemplate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalStepTemplate, setModalStepTemplate] = useState<
    DirectoryStepTemplate | null | "new"
  >(null);

  function loadStepTemplates() {
    return fetch("/api/step-templates")
      .then((response) => {
        if (!response.ok) throw new Error("failed to load step templates");
        return response.json();
      })
      .then((data) => setStepTemplates(data.stepTemplates));
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
        setCanManage(MANAGE_ROLES.includes(data.user.role));
        return loadStepTemplates().then(() => {
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

  async function handleDelete(stepTemplate: DirectoryStepTemplate) {
    if (!window.confirm(`Excluir o modelo de etapa "${stepTemplate.name}"?`)) return;

    const response = await fetch(`/api/step-templates/${stepTemplate.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      loadStepTemplates();
    } else {
      const body = await response.json().catch(() => null);
      window.alert(body?.message ?? "Nao foi possivel excluir o modelo de etapa.");
    }
  }

  function handleSaved() {
    setModalStepTemplate(null);
    loadStepTemplates();
  }

  if (loading || !stepTemplates) {
    return (
      <div>
        <Breadcrumb items={[{ label: "Produção", href: "/producao" }, { label: "Etapas" }]} />
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-sm text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Produção", href: "/producao" }, { label: "Etapas" }]} />

      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Etapas</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Modelos de etapa reutilizáveis para as ordens de produção.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setModalStepTemplate("new")}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Novo modelo de etapa
            </button>
          )}
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Descrição</th>
                {canManage && (
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stepTemplates.map((stepTemplate) => (
                <tr key={stepTemplate.id}>
                  <td className="px-4 py-3 text-zinc-900">{stepTemplate.name}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {stepTemplate.description ?? "-"}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setModalStepTemplate(stepTemplate)}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(stepTemplate)}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalStepTemplate !== null && (
        <StepTemplateFormModal
          editingStepTemplate={modalStepTemplate === "new" ? null : modalStepTemplate}
          onClose={() => setModalStepTemplate(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
