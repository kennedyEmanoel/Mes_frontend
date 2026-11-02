"use client";

import { ReactNode, useEffect, useState } from "react";
import { DeleteImpact } from "../lib/api";

function plural(count: number, singular: string, pluralText: string) {
  return `${count} ${count === 1 ? singular : pluralText}`;
}

export function impactLines(impact: DeleteImpact): string[] {
  const lines: string[] = [];
  if (impact.cards > 0) {
    lines.push(plural(impact.cards, "cartão de produção", "cartões de produção"));
  }
  if (impact.cardOperators > 0) {
    lines.push(plural(impact.cardOperators, "escala de operador", "escalas de operador"));
  }
  if (impact.hourlyRecords > 0) {
    lines.push(plural(impact.hourlyRecords, "registro hora a hora", "registros hora a hora"));
  }
  if (impact.variations > 0) {
    lines.push(plural(impact.variations, "variação", "variações"));
  }
  return lines;
}

interface DeleteImpactModalProps {
  title: string;
  question: ReactNode;
  /** Rota do item (ex.: "/api/products/5"); o impacto vem de `${url}/impact`. */
  url: string;
  deactivateHint?: string;
  onDeleted: () => void;
  onClose: () => void;
}

export function DeleteImpactModal({
  title,
  question,
  url,
  deactivateHint,
  onDeleted,
  onClose,
}: DeleteImpactModalProps) {
  const [impact, setImpact] = useState<DeleteImpact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${url}/impact`).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (cancelled) return;
      if (response.ok) {
        setImpact(body);
      } else {
        setError(body?.message ?? "Não foi possível calcular o impacto da exclusão.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);

    const response = await fetch(url, { method: "DELETE" });
    if (response.ok) {
      onDeleted();
      return;
    }

    const body = await response.json().catch(() => null);
    setError(body?.message ?? "Não foi possível excluir.");
    setDeleting(false);
  }

  const lines = impact ? impactLines(impact) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <p className="mt-3 text-sm text-zinc-700">{question}</p>

        {!impact && !error && (
          <p className="mt-3 text-sm text-zinc-500">Calculando o que será apagado...</p>
        )}

        {impact && lines.length > 0 && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900">
            <p className="font-medium">Também será apagado, definitivamente:</p>
            <ul className="mt-1 list-disc pl-5">
              {lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-red-700">
              Não há como desfazer.{deactivateHint ? ` ${deactivateHint}` : ""}
            </p>
          </div>
        )}

        {impact && lines.length === 0 && (
          <p className="mt-3 text-sm text-zinc-500">
            Nada mais depende deste cadastro. Esta ação não pode ser desfeita.
          </p>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!impact || deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
