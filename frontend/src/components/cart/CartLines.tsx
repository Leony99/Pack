import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { chaveDaLinha } from "@/lib/checkout";
import { money } from "@/lib/checkout";

/**
 * Itens do carrinho (página do carrinho e resumo do checkout). Com "editable", mostra os botões de
 * quantidade e de remover; sem ele, só a quantidade.
 */
export function CartLines({ editable = true }: { editable?: boolean }) {
  const { cart, updateQty, removeItem, aviso } = useCart();
  return (
    <>
      {aviso && (
        <p role="alert" className="mt-4 border border-border p-3 text-xs">
          {aviso}
        </p>
      )}
      <ul className="divide-y divide-border">
        {cart.map((item) => (
          <li key={chaveDaLinha(item)} className="flex gap-4 py-6">
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
                {item.cor ?? item.color} / TAM. {item.size}
              </p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                {editable ? (
                  <div className="flex items-center border border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Diminuir ${item.name}`}
                      onClick={() => void updateQty(chaveDaLinha(item), -1)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.qty}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Aumentar ${item.name}`}
                      onClick={() => void updateQty(chaveDaLinha(item), 1)}
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
                onClick={() => void removeItem(chaveDaLinha(item))}
              >
                <Trash2 />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
