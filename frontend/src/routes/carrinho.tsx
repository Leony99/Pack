import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { CartLines } from "@/components/cart/CartLines";
import { CouponField } from "@/components/cart/CouponField";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/carrinho")({
  head: () =>
    pageHead(
      "Seu carrinho",
      "Revise suas peças PACK, tamanhos, quantidades e cupom antes de finalizar a compra.",
    ),
  component: CartPage,
});
function CartPage() {
  const { cartCount } = useCart();
  return (
    <PageLayout title={`SEU CARRINHO (${cartCount})`} eyebrow="CARRINHO">
      {cartCount === 0 ? (
        <div className="py-12">
          <ShoppingBag className="mb-6 h-10 w-10" />
          <h2 className="text-2xl">AINDA SEM PEÇAS POR AQUI.</h2>
          <Button asChild className="mt-6 h-12">
            <Link to="/catalogo">
              EXPLORAR CATÁLOGO <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <div className="border-t border-border">
            <CartLines />
            <Link to="/catalogo" className="mt-6 inline-block text-sm underline">
              Continuar comprando
            </Link>
          </div>
          <aside className="border-t border-border pt-6">
            <h2 className="mb-6 text-2xl">RESUMO</h2>
            <CouponField />
            <OrderSummary />
            <Button asChild className="mt-8 h-12 w-full">
              <Link to="/checkout">
                IR PARA O CHECKOUT <ArrowRight />
              </Link>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Compra demonstrativa. Nenhuma cobrança será realizada.
            </p>
          </aside>
        </div>
      )}
    </PageLayout>
  );
}
