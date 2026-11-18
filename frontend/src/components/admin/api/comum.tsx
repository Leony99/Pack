import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Roda uma alteração no painel: mostra o resultado no topo e devolve se deu certo. */
export type Run = (acao: () => Promise<unknown>, sucesso: string) => Promise<boolean>;

/** O que as abas que alteram dados recebem do PainelDaApi. */
export type PropsDaAba = { busy: boolean; run: Run };

/** "Carregando" e "erro" das listas do painel. */
export function Estado({ carregando, erro }: { carregando: boolean; erro: unknown }) {
  if (carregando) return <p role="status">Carregando...</p>;
  if (erro)
    return (
      <p role="alert" className="text-sm">
        {erro instanceof Error ? erro.message : "Não foi possível carregar."}
      </p>
    );
  return null;
}

/** A janela de edição do painel. */
export function Janela({
  titulo,
  aberta,
  fechar,
  children,
}: {
  titulo: string;
  aberta: boolean;
  fechar: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={aberta} onOpenChange={(open) => !open && fechar()}>
      <DialogContent className="max-h-[85svh] overflow-y-auto rounded-none sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{titulo}</DialogTitle>
          <DialogDescription>As alterações valem na loja assim que forem salvas.</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/** Um número da visão geral. */
export function Numero({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div className="bg-background p-5">
      <p className="text-[10px] tracking-[0.3em] text-muted-foreground">{rotulo}</p>
      <p className="mt-2 font-display text-3xl">{valor}</p>
    </div>
  );
}
