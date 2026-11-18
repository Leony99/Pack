import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Coupon, Product, VarianteDoProduto } from "@/data/types";
import {
  adicionarAoCarrinhoNaApi,
  carrinhoDaApi,
  esvaziarCarrinhoNaApi,
  mudarQuantidadeNaApi,
  removerDoCarrinhoNaApi,
  USA_API,
} from "./api";
import { chaveDaLinha } from "./checkout";
import { useSession } from "./session";

/**
 * Uma linha do carrinho: o produto, o tamanho escolhido e a quantidade. Com a API, também a variante
 * (tamanho + cor), a cor e, no carrinho do cliente logado, o id do item na API.
 */
export type CartItem = Product & {
  size: string;
  qty: number;
  variantId?: string;
  cor?: string;
  itemId?: string;
};


type CartContext = {
  cart: CartItem[];
  /** Gaveta lateral do carrinho aberta. */
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  /** Com a API, a variante escolhida (tamanho + cor) é a peça que vai para o carrinho. */
  addToCart: (product: Product, size?: string, variante?: VarianteDoProduto) => Promise<void>;
  updateQty: (chave: string, delta: number) => Promise<void>;
  removeItem: (chave: string) => Promise<void>;
  /** Total de peças (soma das quantidades). */
  cartCount: number;
  /** Subtotal dos produtos, sem desconto nem frete. */
  cartTotal: number;
  /** Cupom aplicado: a gaveta, o carrinho e o checkout mostram o mesmo. */
  coupon: Coupon | null;
  setCoupon: (coupon: Coupon | null) => void;
  clearCart: () => Promise<void>;
  /** O último aviso do carrinho (ex.: estoque insuficiente na API), ou "". */
  aviso: string;
};

const Context = createContext<CartContext | null>(null);

/** Onde o carrinho do visitante fica guardado no navegador (só com a API). */
const CHAVE_LOCAL = "pack-carrinho";

function lerLocal(): CartItem[] {
  if (!USA_API) return [];
  try {
    const salvo = JSON.parse(window.localStorage.getItem(CHAVE_LOCAL) ?? "[]") as unknown;
    return Array.isArray(salvo) ? (salvo as CartItem[]) : [];
  } catch {
    return [];
  }
}

function guardarLocal(itens: CartItem[]) {
  if (!USA_API) return;
  try {
    if (itens.length) window.localStorage.setItem(CHAVE_LOCAL, JSON.stringify(itens));
    else window.localStorage.removeItem(CHAVE_LOCAL);
  } catch {
    // navegador sem armazenamento (aba anônima, bloqueio): o carrinho vale só nesta página
  }
}

const mensagem = (e: unknown) =>
  e instanceof Error ? e.message : "Não foi possível atualizar o carrinho.";

/**
 * O carrinho, em três modos:
 * - demonstração: só na memória da página (recarregar esvazia);
 * - API, sem login: no navegador (localStorage), para o visitante montar o carrinho antes de entrar;
 * - API, com o cliente logado: o carrinho da API, item por item e por variante. Ao entrar, os itens do
 *   navegador vão para a API (somando com o que já havia lá) e saem do navegador.
 * Nunca passa do estoque do tamanho: somar além dele mantém a quantidade no máximo disponível (com a
 * API, quem confere é ela, e o aviso aparece no carrinho).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { customer, ready } = useSession();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [aviso, setAviso] = useState("");
  const naApi = USA_API && !!customer;
  // o cliente da última carga, para juntar o carrinho do navegador uma vez por login
  const clienteCarregado = useRef<string | null>(null);

  // troca de modo: entrou (junta o do navegador na API e carrega) ou saiu (volta para o do navegador)
  useEffect(() => {
    if (!USA_API || !ready) return;
    if (!customer) {
      clienteCarregado.current = null;
      setCart(lerLocal());
      return;
    }
    if (clienteCarregado.current === customer.id) return;
    clienteCarregado.current = customer.id;
    void (async () => {
      const locais = lerLocal().filter((i) => i.variantId);
      const falhas: string[] = [];
      for (const item of locais) {
        try {
          await adicionarAoCarrinhoNaApi({
            data: { variantId: item.variantId!, quantidade: item.qty },
          });
        } catch (e) {
          falhas.push(`${item.name} (${item.size}): ${mensagem(e)}`);
        }
      }
      guardarLocal([]);
      try {
        setCart(await carrinhoDaApi());
        setAviso(falhas.length ? `Nem tudo entrou no carrinho. ${falhas.join(" ")}` : "");
      } catch (e) {
        setAviso(mensagem(e));
      }
    })();
  }, [customer, ready]);

  // o carrinho do visitante fica guardado a cada mudança
  useEffect(() => {
    if (USA_API && ready && !customer) guardarLocal(cart);
  }, [cart, customer, ready]);

  /** Roda uma mudança no carrinho da API e mostra o carrinho que ela devolveu (ou o aviso). */
  async function naApiFaz(acao: () => Promise<CartItem[]>) {
    setAviso("");
    try {
      setCart(await acao());
    } catch (e) {
      setAviso(mensagem(e));
    }
  }

  const addToCart = async (product: Product, size = "M", variante?: VarianteDoProduto) => {
    if (naApi) {
      if (!variante) return;
      await naApiFaz(() =>
        adicionarAoCarrinhoNaApi({ data: { variantId: variante.id, quantidade: 1 } }),
      );
      setCartOpen(true);
      return;
    }
    const estoque = variante ? variante.estoque : (product.stock?.[size] ?? 0);
    if (estoque <= 0) return;
    const linha: CartItem = {
      ...product,
      price: variante?.preco ?? product.price,
      stock: { [size]: estoque },
      size,
      qty: 1,
      variantId: variante?.id,
      cor: variante?.cor,
    };
    setCart((atual) => {
      const existente = atual.find((i) => chaveDaLinha(i) === chaveDaLinha(linha));
      if (!existente) return [...atual, linha];
      return atual.map((i) => (i === existente ? { ...i, qty: Math.min(i.qty + 1, estoque) } : i));
    });
    setCartOpen(true);
  };

  /** Soma (ou subtrai) da quantidade; chegando a zero, a linha sai do carrinho. */
  const updateQty = async (chave: string, delta: number) => {
    const item = cart.find((i) => chaveDaLinha(i) === chave);
    if (!item) return;
    if (naApi && item.itemId) {
      const nova = item.qty + delta;
      const itemId = item.itemId;
      await naApiFaz(() =>
        nova < 1
          ? removerDoCarrinhoNaApi({ data: itemId })
          : mudarQuantidadeNaApi({ data: { itemId, quantidade: nova } }),
      );
      return;
    }
    setCart((atual) =>
      atual
        .map((i) =>
          chaveDaLinha(i) === chave
            ? { ...i, qty: Math.min(i.qty + delta, i.stock?.[i.size] ?? 0) }
            : i,
        )
        .filter((i) => i.qty > 0),
    );
  };

  const removeItem = async (chave: string) => {
    const item = cart.find((i) => chaveDaLinha(i) === chave);
    if (naApi && item?.itemId) {
      const itemId = item.itemId;
      await naApiFaz(() => removerDoCarrinhoNaApi({ data: itemId }));
      return;
    }
    setCart((atual) => atual.filter((i) => chaveDaLinha(i) !== chave));
  };

  /** Esvazia a tela (depois do pedido, a API já esvaziou o carrinho dela). */
  const clearCart = async () => {
    if (naApi && cart.length) {
      // o checkout da API esvazia o carrinho; aqui só garante, para a tela não voltar a mostrar itens
      try {
        setCart(await carrinhoDaApi());
      } catch {
        await esvaziarCarrinhoNaApi().catch(() => undefined);
        setCart([]);
      }
    } else setCart([]);
    setCoupon(null);
    setCartOpen(false);
    setAviso("");
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
        aviso,
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
