import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import hoodie from "@/assets/product-hoodie.jpg";
import shorts from "@/assets/product-shorts.jpg";

const ESTILOS = [
  { style: "casual", img: hoodie, title: "CASUAL", desc: "Off-duty. Peso, textura, silêncio." },
  { style: "treino", img: shorts, title: "TREINO", desc: "Performance, mobilidade, repetição." },
] as const;

/** Dois cards grandes, um por estilo, que abrem as camisetas daquele estilo. */
export function StyleCards() {
  return (
    <section className="mx-auto grid max-w-[1400px] grid-cols-1 gap-px bg-border md:grid-cols-2">
      {ESTILOS.map((c) => (
        <Link
          key={c.style}
          to="/catalogo/$style/$type"
          params={{ style: c.style, type: "camisetas" }}
          className="group relative aspect-[4/3] overflow-hidden bg-background"
        >
          <img
            src={c.img}
            alt={c.title}
            className="absolute inset-0 h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 md:p-12">
            <p className="font-display text-5xl text-paper md:text-7xl">{c.title}</p>
            <p className="mt-2 text-sm text-paper/70">{c.desc}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-paper">
              EXPLORAR <ArrowRight className="h-4 w-4" />
            </p>
          </div>
        </Link>
      ))}
    </section>
  );
}
