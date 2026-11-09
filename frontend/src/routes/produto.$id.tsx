import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SectionRow } from "@/components/catalog/SectionRow";
import { NotFoundPage } from "@/components/layout/RouteBoundary";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { getProduct, getRelated } from "@/lib/api";
import { pageHead } from "@/lib/metadata";

/** O produto e os relacionados vêm juntos; produto inexistente vira a página 404. */
const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["products", id],
    queryFn: async () => {
      const product = await getProduct(id);
      if (!product) throw notFound();
      return { product, related: await getRelated(id) };
    },
  });

export const Route = createFileRoute("/produto/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.id)),
  head: ({ loaderData }) =>
    pageHead(
      loaderData?.product.name ?? "Produto indisponível",
      "Confira detalhes, imagens e tamanhos das peças PACK.",
    ),
  notFoundComponent: NotFoundPage,
  component: ProductPage,
});

/** Página do produto: trilha de navegação, galeria, compra e produtos relacionados. */
function ProductPage() {
  const { id } = Route.useParams();
  const {
    data: { product, related },
  } = useSuspenseQuery(productQuery(id));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <p className="mb-8 text-xs font-medium tracking-[0.3em] text-muted-foreground">
          <Link to="/" className="cursor-pointer hover:text-foreground">
            PACK
          </Link>
          {" / "}
          <Link
            to="/catalogo/$style/$type"
            params={{ style: product.styles[0], type: product.type }}
            className="cursor-pointer hover:text-foreground"
          >
            {product.type.toUpperCase()}
          </Link>
          {" / "}
          {product.name.toUpperCase()}
        </p>

        <div className="grid gap-8 md:grid-cols-[80px_1fr_1fr] md:gap-10">
          <ProductGallery key={product.id} product={product} />
          <ProductInfo key={product.id} product={product} />
        </div>
      </div>

      <div className="border-t border-border">
        <SectionRow
          eyebrow="VOCÊ TAMBÉM PODE GOSTAR"
          title="PRODUTOS RELACIONADOS"
          items={related}
          viewAllSearch={{ type: product.type }}
        />
      </div>
    </div>
  );
}
