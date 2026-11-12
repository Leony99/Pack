import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { Metric } from "@/components/common/Metric";
import { AddressText } from "@/components/order/AddressText";
import { OrderList } from "@/components/order/OrderList";
import { Button } from "@/components/ui/button";
import { FINALIZADO } from "@/lib/dominio";
import type { AccountData } from "../tipos";

/** Visão geral da conta: números, últimos 3 pedidos e endereço principal. */
export function AccountOverview({ data }: { data: AccountData }) {
  const primeiroNome = data.customer.name.split(" ")[0].toUpperCase();
  const emAndamento = data.orders.filter((o) => !FINALIZADO.includes(o.status)).length;
  const principal = data.addresses.find((a) => a.primary);

  return (
    <>
      <h2 className="mb-6 text-3xl">OLÁ, {primeiroNome}.</h2>
      <div className="grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-3">
        <Metric label="PEDIDOS" value={String(data.orders.length)} />
        <Metric label="EM ANDAMENTO" value={String(emAndamento)} />
        <Metric label="ENDEREÇOS" value={String(data.addresses.length)} />
      </div>
      <div className="mt-10 flex justify-between">
        <h2 className="text-2xl">ÚLTIMOS PEDIDOS</h2>
        <Button asChild variant="link">
          <Link to="/conta/pedidos">
            VER TODOS <ArrowRight />
          </Link>
        </Button>
      </div>
      <OrderList orders={data.orders.slice(-3).reverse()} />
      <div className="mt-8 border border-ink/10 p-5">
        <h2 className="mb-4 text-2xl">ENDEREÇO PRINCIPAL</h2>
        {principal ? (
          <AddressText address={principal} />
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum endereço salvo.</p>
        )}
        <Button asChild variant="link" className="mt-3">
          <Link to="/conta/enderecos">
            GERENCIAR ENDEREÇOS <MapPin />
          </Link>
        </Button>
      </div>
    </>
  );
}
