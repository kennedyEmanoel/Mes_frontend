"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumb } from "../../../../../components/Breadcrumb";
import {
  DirectoryProductionOrder,
  DirectoryStep,
  DirectoryStepTemplate,
  DirectoryUser,
} from "../../../../../lib/api";
import { UserRole } from "../../../../../types";
import { StepFormModal } from "./StepFormModal";
import { AssignOperatorModal } from "./AssignOperatorModal";

const MANAGE_ROLES: UserRole[] = ["manager", "analyst", "admin"];

export default function OrdemDeProducaoDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);

  const [canManage, setCanManage] = useState(false);
  const [order, setOrder] = useState<DirectoryProductionOrder | null>(null);
  const [steps, setSteps] = useState<DirectoryStep[] | null>(null);
  const [stepTemplates, setStepTemplates] = useState<DirectoryStepTemplate[]>([]);
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalStep, setModalStep] = useState<DirectoryStep | null | "new">(null);
  const [assigningStep, setAssigningStep] = useState<DirectoryStep | null>(null);

  function loadOrder() {
    return fetch(`/api/production-orders/${orderId}`)
      .then((response) => {
        if (!response.ok) throw new Error("failed to load production order");
        return response.json();
      })
      .then((data) => setOrder(data.productionOrder));
  }

  function loadSteps() {
    return fetch("/api/steps")
      .then((response) => {
        if (!response.ok) throw new Error("failed to load steps");
        return response.json();
      })
      .then((data) =>
        setSteps(
          (data.steps as DirectoryStep[])
            .filter((step) => step.productionOrderId === orderId)
            .sort((a, b) => a.orderIndex - b.orderIndex),
        ),
      );
  }

  function loadStepTemplates() {
    return fetch("/api/step-templates")
      .then((response) => {
        if (!response.ok) throw new Error("failed to load step templates");
        return response.json();
      })
      .then((data) => setStepTemplates(data.stepTemplates));
  }

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
        setCanManage(MANAGE_ROLES.includes(data.user.role));
        return Promise.all([
          loadOrder(),
          loadSteps(),
          loadStepTemplates(),
          loadUsers(),
        ]).then(() => {
          if (!cancelled) setLoading(false);
        });
      })
      .catch(() => {
        if (!cancelled) router.push("/login");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, orderId]);

  async function handleDelete(step: DirectoryStep) {
    if (!window.confirm(`Excluir a etapa "${step.stepTemplate.name}"?`)) return;

    const response = await fetch(`/api/steps/${step.id}`, { method: "DELETE" });
    if (response.ok) {
      loadSteps();
    } else {
      const body = await response.json().catch(() => null);
      window.alert(body?.message ?? "Nao foi possivel excluir a etapa.");
    }
  }

  function handleSaved() {
    setModalStep(null);
    loadSteps();
  }

  async function handleAssignmentsChanged() {
    await loadSteps();
    setAssigningStep((current) => {
      if (!current) return current;
      return steps?.find((step) => step.id === current.id) ?? current;
    });
  }

  const breadcrumbItems = [
    { label: "Produção", href: "/producao" },
    { label: "Ordem de Produção", href: "/producao/ordem-de-producao" },
    { label: "Gestão", href: "/producao/ordem-de-producao/gestao" },
    { label: order ? order.opNumber : "..." },
  ];

  if (loading || !order || !steps) {
    return (
      <div>
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-sm text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  const branchUsers = users.filter((user) => user.branch?.id === order.branch.id);
  const activeAssigningStep = assigningStep
    ? (steps.find((step) => step.id === assigningStep.id) ?? assigningStep)
    : null;

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />

      <div className="px-6 py-6">
        <h1 className="text-base font-semibold text-zinc-900">{order.opNumber}</h1>
        <dl className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase text-zinc-400">Produto</dt>
            <dd className="text-zinc-700">{order.product.commercialName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-zinc-400">Filial</dt>
            <dd className="text-zinc-700">{order.branch.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-zinc-400">Qtd. alvo</dt>
            <dd className="text-zinc-700">{order.targetQuantity}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-zinc-400">Status</dt>
            <dd className="text-zinc-700">{order.status}</dd>
          </div>
        </dl>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Etapas</h2>
          {canManage && (
            <button
              type="button"
              onClick={() => setModalStep("new")}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Nova etapa
            </button>
          )}
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Ordem</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Qtd. alvo</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Operadores</th>
                {canManage && (
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {steps.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-4 py-6 text-center text-zinc-400">
                    Nenhuma etapa cadastrada.
                  </td>
                </tr>
              )}
              {steps.map((step) => (
                <tr key={step.id}>
                  <td className="px-4 py-3 text-zinc-500">{step.orderIndex}</td>
                  <td className="px-4 py-3 text-zinc-900">{step.stepTemplate.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{step.targetQuantity}</td>
                  <td className="px-4 py-3">
                    {step.assignments.length === 0 ? (
                      <span className="text-zinc-400">-</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {step.assignments.map((assignment) => (
                          <span
                            key={assignment.id}
                            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
                          >
                            {assignment.user.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setAssigningStep(step)}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          Atribuir
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalStep(step)}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(step)}
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

      {modalStep !== null && (
        <StepFormModal
          editingStep={modalStep === "new" ? null : modalStep}
          productionOrderId={orderId}
          stepTemplates={stepTemplates}
          onClose={() => setModalStep(null)}
          onSaved={handleSaved}
        />
      )}

      {activeAssigningStep && (
        <AssignOperatorModal
          step={activeAssigningStep}
          availableUsers={branchUsers}
          onClose={() => setAssigningStep(null)}
          onChanged={handleAssignmentsChanged}
        />
      )}
    </div>
  );
}
