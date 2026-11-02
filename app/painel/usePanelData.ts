"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardData, TimeSlot } from "../lib/api";
import { currentSlot, localToday } from "../lib/production";

const REFRESH_MS = 30_000;
const CAROUSEL_MS = 60_000;

export interface PanelParams {
  /** null = acompanha o dia de hoje (a TV ligada vira o dia sozinha). */
  date: string | null;
  productId: number | null;
  /** null = acompanha o relógio pela grade do dia. */
  timeSlot: string | null;
  branchId: number | null;
}

/** Configuração do painel na URL: ?date=&product_id=&time_slot=&branch_id= */
export function usePanelParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params: PanelParams = {
    date: searchParams.get("date") || null,
    productId: Number(searchParams.get("product_id")) || null,
    timeSlot: searchParams.get("time_slot") || null,
    branchId: Number(searchParams.get("branch_id")) || null,
  };

  function setParams(patch: Partial<PanelParams>) {
    const next = { ...params, ...patch };
    const query = new URLSearchParams();
    if (next.date && next.date !== localToday()) query.set("date", next.date);
    if (next.productId) query.set("product_id", String(next.productId));
    if (next.timeSlot) query.set("time_slot", next.timeSlot);
    if (next.branchId) query.set("branch_id", String(next.branchId));
    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname);
  }

  return { params, setParams };
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export interface PanelSnapshot {
  key: string;
  slots: TimeSlot[];
  /** Faixa usada na consulta (fixada na URL ou a atual pelo relógio); null se o dia não tem grade. */
  slot: string | null;
  /** Totais do dia inteiro. */
  day: DashboardData;
  /** Totais da faixa (igual a `day` quando não há faixa). */
  bySlot: DashboardData;
  updatedAt: number;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw Object.assign(new Error(body?.message ?? "Falha ao consultar o servidor."), {
      status: response.status,
    });
  }
  return body as T;
}

/**
 * Dados dos painéis: consulta a cada 30 s (sem WebSocket), pausa com a aba oculta e
 * reconsulta ao voltar. A faixa atual vem da mesma grade (time_slots) da tela de controle.
 */
export function usePanelData(params: PanelParams, today: string) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<PanelSnapshot | null>(null);
  const [failure, setFailure] = useState<{ message: string; at: number } | null>(null);

  const date = params.date ?? today;
  const { productId, branchId, timeSlot: fixedSlot } = params;
  const key = `${date}|${productId}|${branchId}|${fixedSlot}`;

  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams({ date });
      if (productId) query.set("product_id", String(productId));
      if (branchId) query.set("branch_id", String(branchId));

      const slots = await getJson<TimeSlot[]>(`/api/time-slots?date=${date}`);
      const slot = fixedSlot ?? currentSlot(slots)?.label ?? null;
      const slotQuery = new URLSearchParams(query);
      if (slot) slotQuery.set("time_slot", slot);

      const [day, bySlot] = await Promise.all([
        getJson<DashboardData>(`/api/dashboard?${query.toString()}`),
        slot ? getJson<DashboardData>(`/api/dashboard?${slotQuery.toString()}`) : null,
      ]);
      setSnapshot({ key, slots, slot, day, bySlot: bySlot ?? day, updatedAt: Date.now() });
      setFailure(null);
    } catch (error) {
      if ((error as { status?: number }).status === 401) {
        router.push("/login");
        return;
      }
      setFailure({
        message: error instanceof Error ? error.message : "Falha ao consultar o servidor.",
        at: Date.now(),
      });
    }
  }, [date, productId, branchId, fixedSlot, key, router]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      load();
      timer = setInterval(load, REFRESH_MS);
    };
    const onVisibilityChange = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [load]);

  return {
    date,
    snapshot: snapshot?.key === key ? snapshot : null,
    failure,
  };
}

/**
 * Carrossel de etapas: troca a cada 60 s; selecionar uma etapa a fixa até "retomar".
 * As atualizações de dados não reiniciam a rotação (a posição é guardada pelo id do cartão).
 */
export function useCarousel(ids: number[]) {
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const idsKey = ids.join(",");

  useEffect(() => {
    if (pinned || idsKey === "") return;
    const list = idsKey.split(",").map(Number);
    const timer = setInterval(() => {
      setCurrentId((id) => {
        const index = list.indexOf(id ?? list[0]);
        return list[(index + 1) % list.length];
      });
    }, CAROUSEL_MS);
    return () => clearInterval(timer);
  }, [pinned, idsKey]);

  const selectedId = currentId !== null && ids.includes(currentId) ? currentId : (ids[0] ?? null);

  return {
    selectedId,
    rotating: !pinned && ids.length > 1,
    pinned,
    select: (id: number) => {
      setCurrentId(id);
      setPinned(true);
    },
    resume: () => setPinned(false),
  };
}

/** Tela cheia com F ou F11 (fora de campos de formulário). */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "F11" || event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggle();
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, [toggle]);

  return { isFullscreen, toggle };
}
