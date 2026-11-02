"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "../../../components/Breadcrumb";
import { DayCard, DayWithCards, ProductionCard, ProductionOptions } from "../../../lib/api";
import { BRANCH_OPTIONS } from "../../../lib/branches";
import { localToday, plural } from "../../../lib/production";
import { SessionUser, UserRole } from "../../../types";
import { CardFilters, CardFilterState } from "./CardFilters";
import { CardGrid } from "./CardGrid";
import { DayLists } from "./DayLists";

const EDIT_ROLES: UserRole[] = ["manager", "analyst", "admin"];
const DELETE_ROLES: UserRole[] = ["manager", "admin"];

const BREADCRUMB = (
  <Breadcrumb
    items={[{ label: "Produção", href: "/producao" }, { label: "Controle de produção" }]}
  />
);

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? "Não foi possível carregar os dados.");
  }
  return body as T;
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível completar a operação.";
}

interface DayListsData {
  key: string;
  days: DayWithCards[];
  cards: DayCard[];
}

export default function ControlePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [options, setOptions] = useState<ProductionOptions | null>(null);
  const [filters, setFilters] = useState<CardFilterState>({
    date: localToday(),
    productId: null,
    stepTemplateId: null,
    variationId: null,
    defaultTarget: 40,
  });
  const [lists, setLists] = useState<DayListsData | null>(null);
  const [listsVersion, setListsVersion] = useState(0);
  const [card, setCard] = useState<ProductionCard | null>(null);
  const [cardSession, setCardSession] = useState(0);
  const [cardLoading, setCardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const branchQuery = branchId === null ? "" : `branch_id=${branchId}`;
  const listsKey = `${filters.date}|${branchQuery}|${listsVersion}`;
  const cardOpen = card !== null;

  useEffect(() => {
    let cancelled = false;

    getJson<{ user: SessionUser }>("/api/me")
      .then(({ user: sessionUser }) => {
        if (cancelled) return;
        setUser(sessionUser);
        setBranchId(
          sessionUser.branchId ??
            (sessionUser.role === "admin" ? Number(BRANCH_OPTIONS[0].value) : null),
        );
      })
      .catch(() => {
        if (!cancelled) router.push("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    getJson<ProductionOptions>(`/api/production-cards/options?${branchQuery}`)
      .then((loaded) => {
        if (cancelled) return;
        setOptions(loaded);
        setFilters((current) => {
          const step =
            loaded.stepTemplates.find((s) => s.id === current.stepTemplateId) ??
            loaded.stepTemplates[0] ??
            null;
          return {
            ...current,
            productId:
              loaded.products.find((p) => p.id === current.productId)?.id ??
              loaded.products[0]?.id ??
              null,
            stepTemplateId: step?.id ?? null,
            variationId: step?.variations.some((v) => v.id === current.variationId)
              ? current.variationId
              : (step?.variations[0]?.id ?? null),
          };
        });
      })
      .catch((e) => {
        if (!cancelled) setError(messageOf(e));
      });

    return () => {
      cancelled = true;
    };
  }, [user, branchQuery]);

  // As listas recarregam ao mudar o dia/filial e ao voltar de um cartão (totais atualizados).
  useEffect(() => {
    if (!user || cardOpen) return;
    let cancelled = false;

    Promise.all([
      getJson<DayWithCards[]>(`/api/production-cards/days?limit=14&${branchQuery}`),
      getJson<DayCard[]>(`/api/production-cards/day?date=${filters.date}&${branchQuery}`),
    ])
      .then(([days, cards]) => {
        if (!cancelled) setLists({ key: listsKey, days, cards });
      })
      .catch((e) => {
        if (!cancelled) setError(messageOf(e));
      });

    return () => {
      cancelled = true;
    };
  }, [user, cardOpen, branchQuery, filters.date, listsKey]);

  useEffect(() => {
    if (dirtyCount === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyCount]);

  const updateCard = useCallback(
    (update: (current: ProductionCard) => ProductionCard) =>
      setCard((current) => (current ? update(current) : current)),
    [],
  );

  function showCard(next: ProductionCard | null) {
    setCard(next);
    setDirtyCount(0);
    setCardSession((session) => session + 1);
    if (next) {
      setFilters((current) => ({
        ...current,
        date: next.date,
        productId: next.productId,
        stepTemplateId: next.stepTemplateId,
        variationId: next.variationId,
      }));
    } else {
      setListsVersion((version) => version + 1);
    }
  }

  /** Antes de trocar ou fechar o cartão, pergunta se pode descartar as células não salvas. */
  function guard(action: () => void) {
    if (dirtyCount > 0) setPendingAction(() => action);
    else action();
  }

  async function loadCard(create: boolean) {
    if (filters.productId === null || filters.stepTemplateId === null) {
      setError('Selecione o produto e a etapa. Se a lista estiver vazia, cadastre-os em "Cadastros".');
      return;
    }

    setError(null);
    setNotice(null);
    setCardLoading(true);
    try {
      if (create) {
        const response = await fetch("/api/production-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: filters.date,
            product_id: filters.productId,
            step_template_id: filters.stepTemplateId,
            variation_id: filters.variationId,
            default_hourly_target: filters.defaultTarget,
            branch_id: branchId ?? undefined,
          }),
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message ?? "Não foi possível abrir o cartão.");
        showCard(body.card);
      } else {
        const params = new URLSearchParams({
          date: filters.date,
          product_id: String(filters.productId),
          step_template_id: String(filters.stepTemplateId),
        });
        if (filters.variationId !== null) params.set("variation_id", String(filters.variationId));
        if (branchId !== null) params.set("branch_id", String(branchId));
        const { card: found } = await getJson<{ card: ProductionCard | null }>(
          `/api/production-cards?${params.toString()}`,
        );
        showCard(found);
        if (!found) {
          setNotice('Não há cartão com esses filtros. Use "Abrir / Criar" para começar um novo.');
        }
      }
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setCardLoading(false);
    }
  }

  async function openCardById(id: number) {
    setError(null);
    setNotice(null);
    setCardLoading(true);
    try {
      showCard(await getJson<ProductionCard>(`/api/production-cards/${id}`));
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setCardLoading(false);
    }
  }

  if (!user) {
    return (
      <div>
        {BREADCRUMB}
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-sm text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  const canEdit = EDIT_ROLES.includes(user.role);
  const canDelete = DELETE_ROLES.includes(user.role);
  const listsLoading = lists?.key !== listsKey;

  return (
    <div>
      {BREADCRUMB}

      <div className="px-6 py-6">
        <h1 className="text-base font-semibold text-zinc-900">Controle de produção</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Lance a meta e o realizado de cada operador, faixa a faixa, nos cartões do dia.
        </p>

        <CardFilters
          filters={filters}
          onChange={setFilters}
          options={options}
          branchId={branchId}
          onBranchChange={user.role === "admin" ? setBranchId : null}
          canEdit={canEdit}
          loading={cardLoading}
          onFind={() => guard(() => loadCard(false))}
          onOpen={() => guard(() => loadCard(true))}
        />

        {error && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Fechar aviso"
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {notice && (
          <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-600">
            {notice}
          </div>
        )}

        {cardLoading ? (
          <p className="mt-6 text-sm text-zinc-500">Carregando o cartão...</p>
        ) : card ? (
          <CardGrid
            key={cardSession}
            card={card}
            onCardChange={updateCard}
            operators={options?.operators ?? []}
            canEdit={canEdit}
            canDelete={canDelete}
            onBack={() => guard(() => showCard(null))}
            onDeleted={() => showCard(null)}
            onDirtyChange={setDirtyCount}
          />
        ) : (
          <DayLists
            selectedDate={filters.date}
            days={lists?.days ?? []}
            cards={listsLoading ? [] : (lists?.cards ?? [])}
            loading={listsLoading}
            onSelectDay={(date) => setFilters((current) => ({ ...current, date }))}
            onOpenCard={openCardById}
          />
        )}
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-zinc-900">Descartar alterações?</h2>
            <p className="mt-3 text-sm text-zinc-700">
              {dirtyCount === 1
                ? "Há 1 célula não salva neste cartão. Se continuar, ela será perdida."
                : `Há ${plural(dirtyCount, "célula não salva", "células não salvas")} neste cartão. Se continuar, elas serão perdidas.`}
            </p>
            <div className="flex justify-end gap-3 pt-5">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = pendingAction;
                  setPendingAction(null);
                  action();
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
