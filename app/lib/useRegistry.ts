"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionUser, UserRole } from "../types";
import { matchesSearch } from "./text";

const MANAGE_ROLES: UserRole[] = ["manager", "analyst", "admin"];
const DELETE_ROLES: UserRole[] = ["manager", "admin"];

interface RegistryItem {
  id: number;
  active: boolean;
}

/**
 * Estado comum das telas de cadastro: carrega a lista completa (com inativos) por `url`,
 * filtra por busca sem acento e por "mostrar inativos", e alterna ativo/inativo.
 */
export function useRegistry<T extends RegistryItem>(
  url: string,
  listKey: string,
  searchText: (item: T) => string,
) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [items, setItems] = useState<T[] | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const response = await fetch(`${url}?include_inactive=true`);
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.message ?? "Não foi possível carregar a lista.");
      return;
    }
    setItems(body[listKey]);
  }, [url, listKey]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/me")
      .then((response) => {
        if (!response.ok) throw new Error("unauthenticated");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setUser(data.user);
        return reload();
      })
      .catch(() => {
        if (!cancelled) router.push("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router, reload]);

  async function toggleActive(item: T) {
    setError(null);
    const response = await fetch(`${url}/${item.id}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Não foi possível alterar o cadastro.");
      return;
    }
    await reload();
  }

  const all = items ?? [];
  const role = user?.role;

  return {
    user,
    loading: !user || !items,
    items: all,
    visible: all.filter(
      (item) => (showInactive || item.active) && matchesSearch(searchText(item), search),
    ),
    inactiveCount: all.filter((item) => !item.active).length,
    search,
    setSearch,
    showInactive,
    setShowInactive,
    error,
    setError,
    reload,
    toggleActive,
    canManage: role !== undefined && MANAGE_ROLES.includes(role),
    canDelete: role !== undefined && DELETE_ROLES.includes(role),
  };
}
