import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import heroRetrato from "@/assets/hero.jpg";
import hero from "@/assets/pack-hero-athlete.png";
import { SectionRow } from "@/components/catalog/SectionRow";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { DropHorizontal } from "@/components/home/DropHorizontal";
import { HeroSection } from "@/components/home/HeroSection";
import { PreLoader } from "@/components/home/PreLoader";
import { StyleCards } from "@/components/home/StyleCards";
import { getDropEmDestaque, getSection } from "@/lib/api";
import { useRevelar } from "@/hooks/useRevelar";
import { pageHead } from "@/lib/metadata";

/**
 * Produtos da home. Se a API falhar, a home abre mesmo assim, sem as linhas de produtos (o topo, os
 * estilos e a newsletter não dependem deles); o catálogo é que mostra o erro.
 */
const sectionsQuery = queryOptions({
  queryKey: ["products", "home"],
  queryFn: async () => {
    try {
      // o drop em destaque é o da peça mais recente com tag de drop (null: EM BREVE)
      const [destaques, drop] = await Promise.all([getSection("destaques"), getDropEmDestaque()]);
      return { destaques, drop };
    } catch (erro) {
      console.error("Home sem produtos:", erro);
      return { destaques: [], drop: null };
    }
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      ...pageHead(
        "Treino e casual",
        "PACK: roupas de treino e casual em preto e branco. Conheça os destaques e o novo drop.",
      ).meta,
      // a foto do destaque é a imagem do link compartilhado nas redes
      { property: "og:image", content: hero },
      { name: "twitter:image", content: hero },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sectionsQuery),
  component: Index,
});

/**
 * Home: abertura (pré-loader, só na primeira visita), o topo com menus nas laterais, estilos, destaques,
 * o último drop em rolagem lateral e newsletter.
 */
function Index() {
  const {
    data: { destaques, drop },
  } = useSuspenseQuery(sectionsQuery);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PreLoader imagem={hero} retrato={heroRetrato} />
      <HeroSection imagem={hero} retrato={heroRetrato} drop={drop} />
      <StyleCards />

      <SectionRow
        eyebrow="FEATURED"
        title="DESTAQUES"
        items={destaques}
        viewAllSearch={{ section: "destaques" }}
      />
      <DropHorizontal drop={drop} />

      <Newsletter />
    </div>
  );
}

/** Newsletter, logo depois da seção preta do drop; o conteúdo sobe de leve ao aparecer. */
function Newsletter() {
  const ref = useRevelar<HTMLElement>();
  return (
    <section ref={ref} id="newsletter" className="scroll-mt-24 bg-secondary">
      <div className="mx-auto max-w-[1400px] px-6 py-20 text-center">
        <h2 data-revela className="font-display text-4xl md:text-6xl">
          JOIN THE PACK
        </h2>
        <p data-revela className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Acesso antecipado a drops, edições limitadas e conteúdo de treino.
        </p>
        <div data-revela>
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}
