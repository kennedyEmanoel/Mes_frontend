"use client";

import { createContext, ReactNode, Suspense, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionUser } from "../types";

const PanelUserContext = createContext<SessionUser | null>(null);

function Loading() {
  return (
    <main className="flex h-screen items-center justify-center bg-zinc-100">
      <p className="text-sm text-zinc-500">Carregando...</p>
    </main>
  );
}

/** Verifica o login (qualquer papel lê os painéis, inclusive a conta da TV) e expõe o usuário aos painéis. */
export function PanelSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/me")
      .then((response) => {
        if (!response.ok) throw new Error("unauthenticated");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) router.push("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!user) return <Loading />;

  return (
    <PanelUserContext.Provider value={user}>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </PanelUserContext.Provider>
  );
}

export function usePanelUser(): SessionUser {
  const user = useContext(PanelUserContext);
  if (!user) throw new Error("usePanelUser fora de PanelSession");
  return user;
}
