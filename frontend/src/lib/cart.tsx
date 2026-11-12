import { createContext, useContext, useState, type ReactNode } from "react";
import type { Coupon, Product } from "@/data/types";

/** Uma linha do carrinho: o produto, o tamanho escolhido e a quantidade. */
export type CartItem = Product & { size: string; qty: number };

type CartContext = {
  cart: CartItem[];
  /** Gaveta lateral do carrinho aberta. */
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, size?: string) => void;
  updateQty: (id: string, size: string, delta: number) => void;
  removeItem: (id: string, size: string) => void;
  /** Total de peças (soma das quantidades). */
  cartCount: number;
  /** Subtotal dos produtos, sem desconto nem frete. */
  cartTotal: number;
  /** Cupom aplicado: a gaveta, o carrinho e o checkout mostram o mesmo. */
  coupon: Coupon | null;
  setCoupon: (coupon: Coupon | null) => void;
  clearCart: () => void;
};

const Context = createContext<CartContext | null>(null);

const mesmaLinha = (item: CartItem, id: string, size: string) =>
  item.id === id && item.size === size;

/**
 * Carrinho, guardado só na memória da página (recarregar esvazia).
 * Nunca passa do estoque do tamanho: somar além dele mantém a quantidade no máximo disponível.
 * BACKEND: com cliente logado, carregar com getCart() e sincronizar com syncCart() a cada mudança.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  const addToCart = (product: Product, size = "M") => {
    const estoque = product.stock?.[size] ?? 0;
    if (estoque <= 0) return;
    setCart((atual) => {
      const existente = atual.find((i) => mesmaLinha(i, product.id, size));
      if (!existente) return [...atual, { ...product, size, qty: 1 }];
      return atual.map((i) => (i === existente ? { ...i, qty: Math.min(i.qty + 1, estoque) } : i));
    });
    setCartOpen(true);
  };

  /** Soma (ou subtrai) da quantidade; chegando a zero, a linha sai do carrinho. */
  const updateQty = (id: string, size: string, delta: number) =>
    setCart((atual) =>
      atual
        .map((i) =>
          mesmaLinha(i, id, size)
            ? { ...i, qty: Math.min(i.qty + delta, i.stock?.[size] ?? 0) }
            : i,
        )
        .filter((i) => i.qty > 0),
    );

  const removeItem = (id: string, size: string) =>
    setCart((atual) => atual.filter((i) => !mesmaLinha(i, id, size)));

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
    setCartOpen(false);
  };

  const cartCount = cart.reduce((soma, i) => soma + i.qty, 0);
  const cartTotal = cart.reduce((soma, i) => soma + i.qty * i.price, 0);

  return (
    <Context.Provider
      value={{
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        updateQty,
        removeItem,
        cartCount,
        cartTotal,
        coupon,
        setCoupon,
        clearCart,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useCart(): CartContext {
  const context = useContext(Context);
  if (!context) throw new Error("useCart precisa estar dentro do CartProvider");
  return context;
}
