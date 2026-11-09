import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Product } from "@/data/types";

const SETA =
  "absolute top-1/2 flex h-10 w-10 p-0 rounded-none -translate-y-1/2 cursor-pointer items-center justify-center bg-background/80 backdrop-blur transition hover:bg-background";

/**
 * Galeria da página do produto: miniaturas ao lado (embaixo no celular), a foto grande com setas e a
 * janela "AMPLIAR". Devolve as duas colunas da grade da página (miniaturas e foto) e a janela.
 */
export function ProductGallery({ product }: { product: Product }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const imgs = product.images.length ? product.images : [product.image];
  const anterior = () => setIdx((i) => (i - 1 + imgs.length) % imgs.length);
  const proxima = () => setIdx((i) => (i + 1) % imgs.length);

  return (
    <>
      {imgs.length > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col md:overflow-visible">
          {imgs.map((src, i) => (
            <Button
              key={i}
              aria-label={`Ver imagem ${i + 1}`}
              variant="ghost"
              onClick={() => setIdx(i)}
              className={`aspect-square h-20 w-20 p-0 rounded-none shrink-0 cursor-pointer overflow-hidden border ${
                i === idx ? "border-foreground" : "border-border"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </Button>
          ))}
        </div>
      )}

      <div className={`order-1 md:order-2 ${imgs.length > 1 ? "" : "md:col-span-2"}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          {imgs.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={product.name}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                i === idx ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <Button
            variant="outline"
            className="absolute bottom-3 right-3 rounded-none"
            onClick={() => setZoom(true)}
          >
            AMPLIAR
          </Button>
          {imgs.length > 1 && (
            <>
              <Button onClick={anterior} className={`left-3 ${SETA}`} aria-label="Anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button onClick={proxima} className={`right-3 ${SETA}`} aria-label="Próxima">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-h-[90svh] rounded-none sm:max-w-3xl">
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            Imagem {idx + 1} de {imgs.length}
          </DialogDescription>
          <img src={imgs[idx]} alt={product.name} className="max-h-[65svh] w-full object-contain" />
          <div className="flex justify-between">
            <Button variant="outline" onClick={anterior}>
              ANTERIOR
            </Button>
            <Button variant="outline" onClick={proxima}>
              PRÓXIMA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
