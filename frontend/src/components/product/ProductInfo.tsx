import { useState } from "react";
import { TAMANHOS } from "@/lib/dominio";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShippingCalc } from "@/components/cart/ShippingCalc";
import { Button } from "@/components/ui/button";
import { colecoesDoProduto } from "@/lib/api";
import { useCart } from "@/lib/cart";
import type { Product, VarianteDoProduto } from "@/data/types";

/** Coleções que ganham link na página do produto: os drops ("drop-02") e estas; as outras tags são internas. */
const COLECOES_COM_LINK = ["essentials"];

/** Parcelamento sem juros mostrado abaixo do preço. */
const PARCELAS = 6;

const VANTAGENS = [
  ["Frete grátis", "Acima de R$ 200"],
  ["Trocas", "30 dias"],
  ["Parcele", "Até 6x"],
];

/** Ordem dos tamanhos na tela: os conhecidos (PP a GG) primeiro, os outros depois, como vieram. */
function emOrdem(tamanhos: string[]): string[] {
  const posicao = (t: string) => {
    const i = (TAMANHOS as readonly string[]).indexOf(t);
    return i < 0 ? TAMANHOS.length : i;
  };
  return [...tamanhos].sort((a, b) => posicao(a) - posicao(b));
}

/**
 * Coluna de compra da página do produto: nome, preço, cores (com a API, quando há mais de uma),
 * tamanhos (esgotados ficam desabilitados), coleções, frete, os botões de compra, a descrição e as
 * vantagens da loja. Com a API, a peça que vai para o carrinho é a variante (tamanho + cor), e o
 * estoque de cada tamanho é o da cor escolhida.
 */
export function ProductInfo({ product }: { product: Product }) {
  const { addToCart, setCartOpen } = useCart();
  const navigate = useNavigate();
  const variantes = product.variantes ?? [];
  const cores = [...new Map(variantes.map((v) => [v.cor, v.corHex])).entries()];
  const [cor, setCor] = useState(
    () => variantes.find((v) => v.estoque > 0)?.cor ?? variantes[0]?.cor ?? "",
  );
  // estoque por tamanho: da cor escolhida (API) ou do produto (demonstração)
  const estoque: Record<string, number> = variantes.length
    ? Object.fromEntries(variantes.filter((v) => v.cor === cor).map((v) => [v.tamanho, v.estoque]))
    : (product.stock ?? {});
  const tamanhos = variantes.length ? emOrdem(Object.keys(estoque)) : Object.keys(estoque);
  const [size, setSize] = useState(
    () => tamanhos.find((t) => (estoque[t] ?? 0) > 0) ?? (variantes.length ? "" : "M"),
  );
  const variante: VarianteDoProduto | undefined = variantes.find(
    (v) => v.cor === cor && v.tamanho === size,
  );
  // inativo: fora da loja (desativado no painel); a página abre, mas sem compra
  const ativo = product.active !== false;
  const disponivel =
    ativo && (variantes.length ? (variante?.estoque ?? 0) > 0 : (estoque[size] ?? 0) > 0);

  /** Troca a cor e fica no mesmo tamanho, se ele existir nela com estoque; senão, no primeiro com estoque. */
  function escolherCor(nova: string) {
    setCor(nova);
    const daCor = variantes.filter((v) => v.cor === nova && v.estoque > 0);
    if (!daCor.some((v) => v.tamanho === size))
      setSize(emOrdem(daCor.map((v) => v.tamanho))[0] ?? "");
  }

  return (
    <div className="order-3 flex flex-col">
      <p className="text-[10px] font-medium tracking-[0.3em] text-muted-foreground">
        {product.type.toUpperCase()} · {cor ? cor.toUpperCase() : product.color}
      </p>
      <h1 className="mt-2 font-display text-4xl leading-tight md:text-5xl">{product.name}</h1>
      <p className="mt-4 text-2xl font-medium">R$ {product.price}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {/* uma string só: em pedaços, o navegador perde o ajuste de espaço entre "6" e "x" */}
        {`Em até ${PARCELAS}x de R$ ${(product.price / PARCELAS).toFixed(2)} sem juros`}
      </p>

      {cores.length > 1 && (
        <div className="mt-8">
          <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground">
            COR · {cor.toUpperCase()}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cores.map(([nome, hex]) => (
              <button
                key={nome}
                type="button"
                aria-label={`Cor ${nome}`}
                aria-pressed={cor === nome}
                onClick={() => escolherCor(nome)}
                className={`flex h-11 cursor-pointer items-center gap-2 border px-3 text-xs transition ${
                  cor === nome ? "border-foreground" : "border-border hover:border-foreground"
                }`}
              >
                <span className="h-4 w-4 border border-border" style={{ backgroundColor: hex }} />
                {nome}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground">TAMANHO</p>
        <div className="mt-3 flex gap-2">
          {tamanhos.map((s) => (
            <Button
              key={s}
              variant="outline"
              disabled={(estoque[s] ?? 0) === 0}
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
          .filter(
            (tag) => colecoesDoProduto(product).includes(tag) || COLECOES_COM_LINK.includes(tag),
          )
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
          onClick={() => void addToCart(product, size, variante)}
          className="h-12 rounded-none cursor-pointer bg-destaque py-4 text-sm font-semibold tracking-wider text-destaque-foreground transition hover:bg-destaque/90"
        >
          {!ativo
            ? "PRODUTO INDISPONÍVEL"
            : disponivel
              ? "ADICIONAR AO CARRINHO"
              : "TAMANHO ESGOTADO"}
        </Button>
        <Button
          type="button"
          disabled={!disponivel}
          onClick={() => {
            // vai direto ao checkout, sem abrir a gaveta do carrinho
            void addToCart(product, size, variante).then(() => {
              setCartOpen(false);
              void navigate({ to: "/checkout" });
            });
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
