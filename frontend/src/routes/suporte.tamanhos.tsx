import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getSizeChart } from "@/lib/api";
import { pageHead } from "@/lib/metadata";
import tee from "@/assets/product-tee.jpg";
import { PageLayout } from "@/components/layout/PageLayout";
import { CardAviso, ROTULO } from "@/components/layout/PaginaTopo";
import { createFileRoute } from "@tanstack/react-router";

const COMO_MEDIR = [
  ["PEITO", "Meça na parte mais larga, com a fita paralela ao chão."],
  ["CINTURA", "Meça na altura do umbigo, sem apertar."],
  ["COMPRIMENTO", "Medido do ombro até a barra da peça."],
] as const;

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
    <PageLayout
      title="TAMANHOS"
      eyebrow="SUPORTE / TAMANHOS"
      imagem={tee}
      texto="Medidas em centímetros. Nossas peças são construídas com corte oversized — se estiver entre dois tamanhos, escolha o menor."
      lado={
        <>
          <CardAviso rotulo="CORTE" valor="OVERSIZED" texto="na dúvida, o menor" />
          <CardAviso escuro rotulo="MEDIDAS" valor="CM" texto="peito, cintura e comprimento" />
        </>
      }
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-x-auto border border-ink/10">
          <table className="w-full text-sm">
            <thead className="bg-ink text-[10px] uppercase tracking-[0.3em] text-paper">
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
                  <td className="px-6 py-4 font-display text-xl">{r.size}</td>
                  <td className="px-6 py-4">{r.chest}</td>
                  <td className="px-6 py-4">{r.waist}</td>
                  <td className="px-6 py-4">{r.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* como medir: um card por medida */}
        <ul className="grid gap-3 self-start">
          {COMO_MEDIR.map(([medida, como], i) => (
            <li key={medida} className="border border-ink/10 p-5">
              <p className={`${ROTULO} flex items-center justify-between text-ink/50`}>
                COMO MEDIR <span>[0{i + 1}]</span>
              </p>
              <p className="mt-3 font-display text-2xl">{medida}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{como}</p>
            </li>
          ))}
        </ul>
      </div>
    </PageLayout>
  );
}
