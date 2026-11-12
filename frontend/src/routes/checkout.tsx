import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { CartLines } from "@/components/cart/CartLines";
import { CouponField } from "@/components/cart/CouponField";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { AddressSection } from "@/components/checkout/AddressSection";
import { DeliverySection } from "@/components/checkout/DeliverySection";
import { PaymentSection } from "@/components/checkout/PaymentSection";
import { PageLayout } from "@/components/layout/PageLayout";
import { NotFoundPage, RouteError } from "@/components/layout/RouteBoundary";
import { Button } from "@/components/ui/button";
import { createOrder, getAddresses, getPaymentMethods, quoteShipping } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { pageHead } from "@/lib/metadata";
import { useSession } from "@/lib/session";
import type { CheckoutAddress, ShippingOption } from "@/data/types";

const paymentQuery = queryOptions({ queryKey: ["payment-methods"], queryFn: getPaymentMethods });

export const Route = createFileRoute("/checkout")({
  head: () => pageHead("Checkout", "Escolha endereço, entrega e pagamento para seu pedido PACK."),
  loader: ({ context }) => context.queryClient.ensureQueryData(paymentQuery),
  errorComponent: RouteError,
  notFoundComponent: NotFoundPage,
  component: Checkout,
});

/**
 * Checkout em três etapas (endereço, entrega e pagamento) com o resumo do pedido ao lado.
 * O frete calculado vale para o CEP e o subtotal daquele momento: se um dos dois mudar, as opções
 * somem e é preciso calcular de novo. Concluir cria o pedido e leva à confirmação.
 */
function Checkout() {
  const { customer } = useSession();
  const savedAddresses = useQuery({
    queryKey: ["account", "addresses", customer?.id],
    queryFn: getAddresses,
    enabled: !!customer,
  });
  const { data: methods } = useSuspenseQuery(paymentQuery);
  const navigate = useNavigate();
  const { cart, cartCount, cartTotal, coupon, clearCart } = useCart();
  const [address, setAddress] = useState<CheckoutAddress>({
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const [delivery, setDelivery] = useState<ShippingOption[]>([]);
  const [quoteKey, setQuoteKey] = useState("");
  const [selected, setSelected] = useState("");
  const [payment, setPayment] = useState<"pix" | "card">("pix");
  const [busy, setBusy] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState("");

  // o frete calculado só vale para este CEP e este subtotal
  const currentKey = `${address.cep}:${cartTotal}`;
  const freshDelivery = quoteKey === currentKey ? delivery : [];
  const shipping = freshDelivery.find((o) => o.label === selected);

  async function quote() {
    setQuoting(true);
    setError("");
    const key = currentKey;
    try {
      setDelivery(await quoteShipping(address.cep, cartTotal));
      setSelected("");
      setQuoteKey(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível calcular.");
    } finally {
      setQuoting(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!shipping) {
      setError("Calcule o frete e selecione uma opção de entrega.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await createOrder({
        items: cart.map((i) => ({ productId: i.id, size: i.size, qty: i.qty })),
        couponCode: coupon?.code,
        address,
        shipping: shipping.label,
        payment,
      });
      // com a API real, o pagamento acontece na página do provedor
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      await navigate({ to: "/pedido/$id", params: { id: result.orderId } });
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir o pedido.");
    } finally {
      setBusy(false);
    }
  }

  if (!cartCount)
    return (
      <PageLayout title="CHECKOUT" eyebrow="CHECKOUT">
        <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
        <Button asChild className="mt-6">
          <Link to="/catalogo">
            ESCOLHER PEÇAS <ArrowRight />
          </Link>
        </Button>
      </PageLayout>
    );

  return (
    <PageLayout title="CHECKOUT" eyebrow="CARRINHO / CHECKOUT">
      <p className="mb-8 flex items-center gap-2 border-y border-border py-4 text-xs">
        <LockKeyhole className="h-4 w-4" /> AMBIENTE DEMONSTRATIVO — SEM COBRANÇA
      </p>
      <form onSubmit={submit} className="grid gap-12 lg:grid-cols-[1fr_400px]">
        <div>
          <AddressSection
            address={address}
            onChange={(key, valor) => setAddress((a) => ({ ...a, [key]: valor }))}
            saved={savedAddresses.data}
            onUseSaved={(salvo) => {
              setAddress(salvo);
              setSelected("");
            }}
          />
          <DeliverySection
            options={freshDelivery}
            selected={selected}
            onSelect={setSelected}
            onQuote={quote}
            quoting={quoting}
          />
          <PaymentSection methods={methods} value={payment} onChange={setPayment} />
        </div>
        <aside className="border-t border-border pt-6">
          <h2 className="text-2xl">SEU PEDIDO ({cartCount})</h2>
          <CartLines editable={false} />
          <CouponField />
          <OrderSummary shipping={shipping?.price} />
          <label className="mt-6 flex items-start gap-3 text-xs leading-relaxed">
            <input type="checkbox" required className="mt-1 accent-foreground" />
            <span>
              Li os{" "}
              <Link to="/politicas/termos" className="underline">
                termos de uso
              </Link>{" "}
              e entendo que esta compra é simulada.
            </span>
          </label>
          {error && (
            <p role="alert" className="mt-4 text-sm">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={busy || quoting}
            className="mt-6 h-12 w-full font-semibold bg-destaque text-destaque-foreground hover:bg-destaque/90"
          >
            {busy ? "CONCLUINDO..." : "CONCLUIR PEDIDO SIMULADO"}
            <ArrowRight />
          </Button>
          <Link to="/carrinho" className="mt-4 block text-center text-xs underline">
            Voltar ao carrinho
          </Link>
        </aside>
      </form>
    </PageLayout>
  );
}
