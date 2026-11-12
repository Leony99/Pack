import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/checkout";

/**
 * Itens do carrinho (página do carrinho e resumo do checkout). Com "editable", mostra os botões de
 * quantidade e de remover; sem ele, só a quantidade.
 */
export function CartLines({ editable = true }: { editable?: boolean }) {
  const { cart, updateQty, removeItem } = useCart();
  return (
    <ul className="divide-y divide-border">
      {cart.map((item) => (
        <li key={item.id + item.size} className="flex gap-4 py-6">
          <Link to="/produto/$id" params={{ id: item.id }} className="shrink-0">
            <img
              src={item.image}
              alt={item.name}
              className="h-28 w-20 bg-secondary object-cover grayscale md:w-24"
            />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Link to="/produto/$id" params={{ id: item.id }} className="text-sm font-medium">
              {item.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {item.color} / TAM. {item.size}
            </p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
              {editable ? (
                <div className="flex items-center border border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Diminuir ${item.name}`}
                    onClick={() => updateQty(item.id, item.size, -1)}
                  >
                    <Minus />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.qty}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Aumentar ${item.name}`}
                    onClick={() => updateQty(item.id, item.size, 1)}
                  >
                    <Plus />
                  </Button>
                </div>
              ) : (
                <span className="text-xs">Qtd. {item.qty}</span>
              )}
              <p className="text-sm">{money(item.price * item.qty)}</p>
            </div>
          </div>
          {editable && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remover ${item.name}`}
              onClick={() => removeItem(item.id, item.size)}
            >
              <Trash2 />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
