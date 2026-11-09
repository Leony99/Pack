import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { CouponField } from "@/components/cart/CouponField";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";

/** Duração da animação de abrir e fechar (a mesma do duration-300 das classes). */
const ANIMACAO_MS = 300;

/**
 * Gaveta lateral do carrinho. Para animar também ao fechar, ela fica montada até a animação
 * terminar: "montada" controla se existe na página, "visivel" controla a posição e a opacidade.
 */
export function CartDrawer() {
  const { cart, cartCount, cartOpen, setCartOpen, updateQty, removeItem } = useCart();
  const [montada, setMontada] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (cartOpen) {
      setMontada(true);
      // no quadro seguinte, para o navegador desenhar a posição inicial antes de animar
      requestAnimationFrame(() => setVisivel(true));
    } else if (montada) {
      setVisivel(false);
      const timer = setTimeout(() => setMontada(false), ANIMACAO_MS);
      return () => clearTimeout(timer);
    }
  }, [cartOpen, montada]);

  if (!montada) return null;
  const fechar = () => setCartOpen(false);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300 ${
          visivel ? "opacity-100" : "opacity-0"
        }`}
        onClick={fechar}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out ${
          visivel ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <p className="font-display text-xl tracking-wider">CARRINHO ({cartCount})</p>
          <button onClick={fechar} className="cursor-pointer" aria-label="Fechar carrinho">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
            </div>
          ) : (
            <ul>
              {cart.map((i) => (
                <li key={i.id + i.size} className="flex gap-4 border-b border-border p-6">
                  <img src={i.image} alt={i.name} className="h-28 w-24 object-cover" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium">{i.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tam. {i.size} · {i.color}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(i.id, i.size)}
                        className="cursor-pointer text-muted-foreground hover:text-foreground"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => updateQty(i.id, i.size, -1)}
                          className="cursor-pointer px-2 py-1"
                          aria-label="Diminuir"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 text-sm">{i.qty}</span>
                        <button
                          onClick={() => updateQty(i.id, i.size, 1)}
                          className="cursor-pointer px-2 py-1"
                          aria-label="Aumentar"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-medium">R$ {i.qty * i.price}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-border p-6">
            <CouponField />
            <OrderSummary />
            <p className="mt-1 text-xs text-muted-foreground">Frete calculado no checkout.</p>
            <Button asChild className="mt-5 h-12 w-full">
              <Link to="/checkout" onClick={fechar}>
                FINALIZAR COMPRA
              </Link>
            </Button>
            <Link
              to="/carrinho"
              onClick={fechar}
              className="mt-4 block text-center text-xs underline"
            >
              VER CARRINHO COMPLETO
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
