"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "../../../components/Breadcrumb";
import { DirectoryProduct } from "../../../lib/api";
import { UserRole } from "../../../types";
import { ProductFormModal } from "./ProductFormModal";

const MANAGE_ROLES: UserRole[] = ["manager", "analyst", "admin"];

export default function ProdutosPage() {
  const router = useRouter();
  const [canManage, setCanManage] = useState(false);
  const [products, setProducts] = useState<DirectoryProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState<DirectoryProduct | null | "new">(null);

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
        setCanManage(MANAGE_ROLES.includes(data.user.role));
        return loadProducts().then(() => {
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

  async function handleDelete(product: DirectoryProduct) {
    if (!window.confirm(`Excluir o produto "${product.commercialName}"?`)) return;

    const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    if (response.ok) {
      loadProducts();
    } else {
      const body = await response.json().catch(() => null);
      window.alert(body?.message ?? "Nao foi possivel excluir o produto.");
    }
  }

  function handleSaved() {
    setModalProduct(null);
    loadProducts();
  }

  if (loading || !products) {
    return (
      <div>
        <Breadcrumb items={[{ label: "Produção", href: "/producao" }, { label: "Produtos" }]} />
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-sm text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Produção", href: "/producao" }, { label: "Produtos" }]} />

      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Produtos</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Produtos utilizados nas ordens de produção.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setModalProduct("new")}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Novo produto
            </button>
          )}
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Nome comercial</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Versão</th>
                {canManage && (
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 text-zinc-900">{product.sku}</td>
                  <td className="px-4 py-3 text-zinc-500">{product.commercialName}</td>
                  <td className="px-4 py-3 text-zinc-500">{product.version ?? "-"}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setModalProduct(product)}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
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

      {modalProduct !== null && (
        <ProductFormModal
          editingProduct={modalProduct === "new" ? null : modalProduct}
          onClose={() => setModalProduct(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
