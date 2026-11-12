import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentCustomer, getCurrentStaff, logout } from "./api";
import type { CustomerProfile, StaffMember } from "@/data/dashboard";

type SessionContext = {
  customer: CustomerProfile | null;
  staff: StaffMember | null;
  /** false até a primeira consulta de quem está logado terminar. */
  ready: boolean;
  /** Consulta de novo quem está logado (depois de entrar ou de mudar os dados). */
  refresh: () => Promise<void>;
  signOut: (kind: "customer" | "staff") => Promise<void>;
};

const Context = createContext<SessionContext | null>(null);

/**
 * Quem está logado: o cliente e o colaborador são sessões separadas (dá para estar nas duas).
 * Ao sair, os dados em cache da conta e do painel são descartados, para não aparecerem para outra pessoa.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  async function refresh() {
    const [cliente, colaborador] = await Promise.all([getCurrentCustomer(), getCurrentStaff()]);
    setCustomer(cliente);
    setStaff(colaborador);
    setReady(true);
  }

  async function signOut(kind: "customer" | "staff") {
    await logout(kind);
    await queryClient.cancelQueries();
    queryClient.removeQueries({
      predicate: (q) => ["account", "admin", "my-order"].includes(String(q.queryKey[0])),
    });
    await refresh();
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <Context.Provider value={{ customer, staff, ready, refresh, signOut }}>
      {children}
    </Context.Provider>
  );
}

export function useSession(): SessionContext {
  const value = useContext(Context);
  if (!value) throw new Error("useSession precisa estar dentro do SessionProvider");
  return value;
}
