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
import { DirectoryProduct, productLabel } from "../../../lib/api";
import { useRegistry } from "../../../lib/useRegistry";
import { ProductFormModal } from "./ProductFormModal";

const BREADCRUMB = (
  <Breadcrumb items={[{ label: "Produção", href: "/producao" }, { label: "Produtos" }]} />
);

export default function ProdutosPage() {
  const registry = useRegistry<DirectoryProduct>(
    "/api/products",
    "products",
    (p) => `${p.sku} ${p.commercialName} ${p.version ?? ""} ${p.description ?? ""}`,
  );
  const [modalProduct, setModalProduct] = useState<DirectoryProduct | null | "new">(null);
  const [deletingProduct, setDeletingProduct] = useState<DirectoryProduct | null>(null);

  if (registry.loading) {
    return <RegistryLoading breadcrumb={BREADCRUMB} />;
  }

  const columns = 5 + (registry.canManage ? 1 : 0);

  return (
    <div>
      {BREADCRUMB}

      <div className="px-6 py-6">
        <RegistryTabs />

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Produtos</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Produtos fabricados, usados nos cartões e nas ordens de produção.
            </p>
          </div>
          {registry.canManage && (
            <button
              type="button"
              onClick={() => setModalProduct("new")}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Novo produto
            </button>
          )}
        </div>

        <RegistryToolbar
          search={registry.search}
          onSearchChange={registry.setSearch}
          searchPlaceholder="Buscar produto..."
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
                <th className="px-4 py-3 text-left font-medium text-zinc-500">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Nome comercial</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Versão</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Descrição</th>
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
                      ? "Nenhum produto cadastrado ainda."
                      : "Nenhum produto encontrado."
                  }
                />
              )}
              {registry.visible.map((product) => (
                <tr key={product.id} className={product.active ? "" : "text-zinc-400"}>
                  <td className="px-4 py-3">{product.sku}</td>
                  <td className="px-4 py-3 font-medium">{product.commercialName}</td>
                  <td className="px-4 py-3 text-zinc-500">{product.version ?? "-"}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-500">
                    {product.description ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={product.active} />
                  </td>
                  {registry.canManage && (
                    <td className="px-4 py-3">
                      <RegistryActions
                        active={product.active}
                        canManage={registry.canManage}
                        canDelete={registry.canDelete}
                        onEdit={() => setModalProduct(product)}
                        onToggleActive={() => registry.toggleActive(product)}
                        onDelete={() => setDeletingProduct(product)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalProduct !== null && (
        <ProductFormModal
          editingProduct={modalProduct === "new" ? null : modalProduct}
          onClose={() => setModalProduct(null)}
          onSaved={() => {
            setModalProduct(null);
            registry.reload();
          }}
        />
      )}

      {deletingProduct && (
        <DeleteImpactModal
          title="Excluir produto"
          question={
            <>
              Excluir o produto <strong>{productLabel(deletingProduct)}</strong>?
            </>
          }
          url={`/api/products/${deletingProduct.id}`}
          deactivateHint="Para produto descontinuado, prefira Desativar."
          onClose={() => setDeletingProduct(null)}
          onDeleted={() => {
            setDeletingProduct(null);
            registry.reload();
          }}
        />
      )}
    </div>
  );
}
