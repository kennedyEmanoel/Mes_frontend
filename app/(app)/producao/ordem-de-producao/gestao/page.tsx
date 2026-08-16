"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "../../../../components/Breadcrumb";
import { DirectoryProduct, DirectoryProductionOrder } from "../../../../lib/api";
import { SessionUser, UserRole } from "../../../../types";
import { ProductionOrderFormModal } from "./ProductionOrderFormModal";

const MANAGE_ROLES: UserRole[] = ["manager", "analyst", "admin"];

export default function GestaoPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [orders, setOrders] = useState<DirectoryProductionOrder[] | null>(null);
  const [products, setProducts] = useState<DirectoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOrder, setModalOrder] = useState<DirectoryProductionOrder | null | "new">(null);

  function loadOrders() {
    return fetch("/api/production-orders")
      .then((response) => {
        if (!response.ok) throw new Error("failed to load production orders");
        return response.json();
      })
      .then((data) => setOrders(data.productionOrders));
  }

  function loadProducts() {
    return fetch("/api/products")
      .then((response) => {
        if (!response.ok) throw new Error("failed to load products");
        return response.json();
      })
      .then((data) => setProducts(data.products));
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
        setCurrentUser(data.user);
        return Promise.all([loadOrders(), loadProducts()]).then(() => {
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

  async function handleDelete(order: DirectoryProductionOrder) {
    if (!window.confirm(`Excluir a ordem de produção "${order.opNumber}"?`)) return;

    const response = await fetch(`/api/production-orders/${order.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      loadOrders();
    } else {
      const body = await response.json().catch(() => null);
      window.alert(body?.message ?? "Nao foi possivel excluir a ordem de producao.");
    }
  }

  function handleSaved() {
    setModalOrder(null);
    loadOrders();
  }

  const breadcrumbItems = [
    { label: "Produção", href: "/producao" },
    { label: "Ordem de Produção", href: "/producao/ordem-de-producao" },
    { label: "Gestão" },
  ];

  if (loading || !orders || !currentUser) {
    return (
      <div>
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-sm text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  const canManage = MANAGE_ROLES.includes(currentUser.role);

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />

      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Ordens de Produção</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Gerencie as ordens de produção com controle de etapas e status.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setModalOrder("new")}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Nova ordem de produção
            </button>
          )}
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Nº OP</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Produto</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Filial</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Qtd. alvo</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 text-zinc-900">{order.opNumber}</td>
                  <td className="px-4 py-3 text-zinc-500">{order.product.commercialName}</td>
                  <td className="px-4 py-3 text-zinc-500">{order.branch.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{order.targetQuantity}</td>
                  <td className="px-4 py-3 text-zinc-500">{order.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/producao/ordem-de-producao/gestao/${order.id}`}
                        className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                      >
                        Ver etapas
                      </Link>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModalOrder(order)}
                            className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(order)}
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOrder !== null && (
        <ProductionOrderFormModal
          editingOrder={modalOrder === "new" ? null : modalOrder}
          currentUser={currentUser}
          products={products}
          onClose={() => setModalOrder(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
