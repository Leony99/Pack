import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getSizeChart } from "@/lib/api";
import { pageHead } from "@/lib/metadata";
import { PageLayout } from "@/components/layout/PageLayout";
import { createFileRoute } from "@tanstack/react-router";

const sizesQuery = queryOptions({ queryKey: ["sizes"], queryFn: getSizeChart });
export const Route = createFileRoute("/suporte/tamanhos")({
  head: () =>
    pageHead(
      "Guia de tamanhos",
      "Confira as medidas de peito, cintura e comprimento das peças PACK.",
    ),
  loader: ({ context }) => context.queryClient.ensureQueryData(sizesQuery),
  component: Tamanhos,
});

function Tamanhos() {
  const { data: rows } = useSuspenseQuery(sizesQuery);
  return (
    <PageLayout title="TAMANHOS" eyebrow="SUPORTE / TAMANHOS">
      <div className="max-w-3xl">
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Medidas em centímetros. Nossas peças são construídas com corte oversized — se estiver
          entre dois tamanhos, escolha o menor.
        </p>

        <div className="mt-10 overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="px-6 py-4 text-left">Tamanho</th>
                <th className="px-6 py-4 text-left">Peito (cm)</th>
                <th className="px-6 py-4 text-left">Cintura (cm)</th>
                <th className="px-6 py-4 text-left">Comprimento (cm)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.size} className="border-t border-border">
                  <td className="px-6 py-4 font-medium">{r.size}</td>
                  <td className="px-6 py-4">{r.chest}</td>
                  <td className="px-6 py-4">{r.waist}</td>
                  <td className="px-6 py-4">{r.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Peito:</strong> meça na parte mais larga, com fita
            paralela ao chão.
          </p>
          <p>
            <strong className="text-foreground">Cintura:</strong> meça na altura do umbigo, sem
            apertar.
          </p>
          <p>
            <strong className="text-foreground">Comprimento:</strong> medido do ombro até a barra da
            peça.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
