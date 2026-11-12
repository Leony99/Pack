import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShippingCalc } from "@/components/cart/ShippingCalc";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import type { Product } from "@/data/types";

/** Coleções que ganham link na página do produto (as outras tags são internas). */
const COLECOES_COM_LINK = ["drop-02", "essentials"];

/** Parcelamento sem juros mostrado abaixo do preço. */
const PARCELAS = 6;

const VANTAGENS = [
  ["Frete grátis", "Acima de R$ 200"],
  ["Trocas", "30 dias"],
  ["Parcele", "Até 6x"],
];

/**
 * Coluna de compra da página do produto: nome, preço, tamanhos (esgotados ficam desabilitados),
 * coleções, frete, os botões de compra, a descrição e as vantagens da loja.
 */
export function ProductInfo({ product }: { product: Product }) {
  const { addToCart, setCartOpen } = useCart();
  const navigate = useNavigate();
  const [size, setSize] = useState("M");
  const disponivel = (product.stock?.[size] ?? 0) > 0;

  return (
    <div className="order-3 flex flex-col">
      <p className="text-[10px] font-medium tracking-[0.3em] text-muted-foreground">
        {product.type.toUpperCase()} · {product.color}
      </p>
      <h1 className="mt-2 font-display text-4xl leading-tight md:text-5xl">{product.name}</h1>
      <p className="mt-4 text-2xl font-medium">R$ {product.price}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {/* uma string só: em pedaços, o navegador perde o ajuste de espaço entre "6" e "x" */}
        {`Em até ${PARCELAS}x de R$ ${(product.price / PARCELAS).toFixed(2)} sem juros`}
      </p>

      <div className="mt-8">
        <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground">TAMANHO</p>
        <div className="mt-3 flex gap-2">
          {Object.keys(product.stock ?? {}).map((s) => (
            <Button
              key={s}
              variant="outline"
              disabled={(product.stock?.[s] ?? 0) === 0}
              onClick={() => setSize(s)}
              className={`h-11 w-11 p-0 rounded-none cursor-pointer border text-sm font-medium transition ${
                size === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground"
              }`}
            >
              {s}
            </Button>
          ))}
        </div>
        <Link
          to="/suporte/tamanhos"
          className="mt-3 inline-block cursor-pointer text-xs text-muted-foreground underline"
        >
          Guia de tamanhos
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {(product.tags ?? [])
          .filter((tag) => COLECOES_COM_LINK.includes(tag))
          .map((tag) => (
            <Link
              key={tag}
              to="/colecao/$slug"
              params={{ slug: tag }}
              className="text-xs uppercase underline"
            >
              {tag}
            </Link>
          ))}
      </div>
      <ShippingCalc price={product.price} />

      <div className="mt-8 flex flex-col gap-3">
        <Button
          disabled={!disponivel}
          onClick={() => addToCart(product, size)}
          className="h-12 rounded-none cursor-pointer bg-destaque py-4 text-sm font-semibold tracking-wider text-destaque-foreground transition hover:bg-destaque/90"
        >
          {disponivel ? "ADICIONAR AO CARRINHO" : "TAMANHO ESGOTADO"}
        </Button>
        <Button
          type="button"
          disabled={!disponivel}
          onClick={() => {
            // vai direto ao checkout, sem abrir a gaveta do carrinho
            addToCart(product, size);
            setCartOpen(false);
            void navigate({ to: "/checkout" });
          }}
          className="h-12 rounded-none cursor-pointer bg-foreground py-4 text-sm font-medium tracking-wider text-background transition hover:bg-foreground/90"
        >
          COMPRAR AGORA
        </Button>
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground">DESCRIÇÃO</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6 text-xs">
        {VANTAGENS.map(([titulo, detalhe]) => (
          <div key={titulo}>
            <p className="font-medium">{titulo}</p>
            <p className="mt-1 text-muted-foreground">{detalhe}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
