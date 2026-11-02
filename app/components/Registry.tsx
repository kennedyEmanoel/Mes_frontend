"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/producao/operadores", label: "Operadores" },
  { href: "/producao/produtos", label: "Produtos" },
  { href: "/producao/etapas", label: "Etapas" },
];

export function RegistryTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-zinc-200">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

interface RegistryToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  showInactive: boolean;
  onShowInactiveChange: (value: boolean) => void;
  inactiveCount: number;
  error: string | null;
  onDismissError: () => void;
}

export function RegistryToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  showInactive,
  onShowInactiveChange,
  inactiveCount,
  error,
  onDismissError,
}: RegistryToolbarProps) {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full max-w-xs rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
        />
        <label className="flex select-none items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => onShowInactiveChange(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Mostrar inativos{inactiveCount > 0 ? ` (${inactiveCount})` : ""}
        </label>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Fechar aviso"
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      Ativo
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
      Inativo
    </span>
  );
}

interface RegistryActionsProps {
  active: boolean;
  canManage: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export function RegistryActions({
  active,
  canManage,
  canDelete,
  onEdit,
  onToggleActive,
  onDelete,
}: RegistryActionsProps) {
  return (
    <div className="flex gap-3 whitespace-nowrap">
      {canManage && (
        <>
          <button
            type="button"
            onClick={onEdit}
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onToggleActive}
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            {active ? "Desativar" : "Reativar"}
          </button>
        </>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          Excluir
        </button>
      )}
    </div>
  );
}

export function RegistryEmptyRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-zinc-400">
        {message}
      </td>
    </tr>
  );
}

export function RegistryLoading({ breadcrumb }: { breadcrumb: React.ReactNode }) {
  return (
    <div>
      {breadcrumb}
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </div>
    </div>
  );
}
