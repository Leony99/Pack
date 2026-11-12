import { useState, type MouseEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import type { Product } from "@/data/types";

/** Tamanho que o "ADICIONAR" põe no carrinho: o M, se tiver estoque; senão, o primeiro disponível. */
function tamanhoDisponivel(p: Product): string | undefined {
  const tamanhos = Object.entries(p.stock ?? {});
  return (
    tamanhos.find(([size, qty]) => size === "M" && qty > 0)?.[0] ??
    tamanhos.find(([, qty]) => qty > 0)?.[0]
  );
}

const SETA =
  "absolute top-1/2 flex h-8 w-8 p-0 rounded-none -translate-y-1/2 cursor-pointer items-center justify-center bg-background/80 opacity-0 backdrop-blur transition hover:bg-background group-hover:opacity-100";

/**
 * Card de produto das listagens: galeria com setas, botões de adicionar e comprar (que aparecem
 * ao passar o mouse no computador) e nome, tipo, cor e preço.
 */
export function ProductCard({ p }: { p: Product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const tamanho = tamanhoDisponivel(p);
  const imgs = p.images.length ? p.images : [p.image];

  // as setas ficam dentro do link do produto: sem isso, o clique também abriria a página
  const trocarImagem = (e: MouseEvent, passo: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + passo + imgs.length) % imgs.length);
  };

  return (
    <article className="group">
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <Link to="/produto/$id" params={{ id: p.id }} className="block h-full w-full">
          {imgs.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={p.name}
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover grayscale transition-all duration-700 ${
                i === idx ? "opacity-100" : "opacity-0"
              } group-hover:scale-105`}
            />
          ))}
        </Link>

        {p.section === "novo-drop" && (
          <span className="pointer-events-none absolute left-3 top-3 bg-destaque px-2 py-1 text-[10px] font-semibold tracking-[0.2em] text-destaque-foreground">
            NOVO
          </span>
        )}

        {imgs.length > 1 && (
          <>
            <Button
              type="button"
              onClick={(e) => trocarImagem(e, -1)}
              aria-label="Imagem anterior"
              className={`left-2 ${SETA}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={(e) => trocarImagem(e, 1)}
              aria-label="Próxima imagem"
              className={`right-2 ${SETA}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 gap-1">
              {imgs.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 w-4 transition ${i === idx ? "bg-destaque" : "bg-foreground/30"}`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-100 transition md:translate-y-2 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
          <Button
            type="button"
            disabled={!tamanho}
            onClick={(e) => {
              e.preventDefault();
              if (tamanho) addToCart(p, tamanho);
            }}
            className="h-11 min-w-0 flex-1 rounded-none px-2 cursor-pointer border border-foreground bg-background py-3 text-xs font-medium tracking-wider text-foreground transition hover:bg-secondary"
          >
            {tamanho ? "ADICIONAR" : "ESGOTADO"}
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              void navigate({ to: "/produto/$id", params: { id: p.id } });
            }}
            className="h-11 min-w-0 flex-1 rounded-none px-2 cursor-pointer bg-foreground py-3 text-xs font-medium tracking-wider text-background transition hover:bg-foreground/90"
          >
            COMPRAR
          </Button>
        </div>
      </div>

      <Link
        to="/produto/$id"
        params={{ id: p.id }}
        className="mt-6 flex flex-wrap items-start justify-between gap-3"
      >
        <div>
          <h3 className="text-sm font-normal uppercase tracking-[0.12em]">{p.name}</h3>
          <p className="mt-2 text-[10px] font-normal uppercase tracking-[0.2em] text-muted-foreground">
            {p.type} · {p.color}
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium tracking-tight">R$ {p.price}</p>
      </Link>
    </article>
  );
}
