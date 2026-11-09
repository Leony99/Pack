import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import hero from "@/assets/pack-hero-athlete.png";
import { SectionRow } from "@/components/catalog/SectionRow";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { HeroSection } from "@/components/home/HeroSection";
import { StyleCards } from "@/components/home/StyleCards";
import { WordsMarquee } from "@/components/home/WordsMarquee";
import { getSection } from "@/lib/api";
import { pageHead } from "@/lib/metadata";

const sectionsQuery = queryOptions({
  queryKey: ["products", "home"],
  queryFn: async () => ({
    destaques: await getSection("destaques"),
    novoDrop: await getSection("novo-drop"),
  }),
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

/** Home: destaque principal, faixa de palavras, estilos, destaques, novo drop e newsletter. */
function Index() {
  const {
    data: { destaques, novoDrop },
  } = useSuspenseQuery(sectionsQuery);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection imageUrl={hero} />
      <WordsMarquee />
      <StyleCards />

      <SectionRow
        eyebrow="FEATURED"
        title="DESTAQUES"
        items={destaques}
        viewAllSearch={{ section: "destaques" }}
      />
      <SectionRow
        eyebrow="DROP 02 / SS26"
        title="NOVO DROP"
        items={novoDrop}
        viewAllSearch={{ section: "novo-drop" }}
      />

      <section className="border-t border-border bg-secondary">
        <div className="mx-auto max-w-[1400px] px-6 py-20 text-center">
          <h2 className="font-display text-4xl md:text-6xl">JOIN THE PACK</h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            Acesso antecipado a drops, edições limitadas e conteúdo de treino.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
