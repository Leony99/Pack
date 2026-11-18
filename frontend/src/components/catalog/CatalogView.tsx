import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/catalog/ProductCard";
import { selectClass } from "@/components/common/classes";
import { ROTULO } from "@/components/layout/PaginaTopo";
import { Vazio } from "@/components/common/Vazio";
import { Button } from "@/components/ui/button";
import { getCollections, getOpcoesDoCatalogo } from "@/lib/api";
import { catalogoQuery } from "./consulta";
import { catalogFilters, type CatalogSearch } from "./filtros";

const SEM_FILTROS: CatalogSearch = {
  style: "all",
  type: "all",
  section: "all",
  collection: "all",
  sort: "recent",
};

/**
 * Grade do catálogo com filtros e ordenação. Os filtros ficam na URL (a rota é dona deles e recebe
 * as mudanças por onChange). "locked" esconde os filtros nas páginas que já são um recorte fixo
 * (categoria/estilo, coleção), deixando só a ordenação.
 * Os produtos vêm em páginas de 8 (consulta.ts): o "CARREGAR MAIS" pede a próxima à API, e o total
 * de peças vem junto da primeira.
 */
export function CatalogView({
  search,
  onChange,
  locked = false,
}: {
  search: CatalogSearch;
  onChange: (patch: CatalogSearch) => void;
  locked?: boolean;
}) {
  const filters = catalogFilters(search);
  const [stockOnly, setStockOnly] = useState(false);
  const query = useInfiniteQuery(catalogoQuery(filters, stockOnly));
  const collections = useQuery({ queryKey: ["collections"], queryFn: getCollections });
  // as opções de estilo e categoria são as tags da API com esses filtros (aba Tags do painel)
  const opcoes = useQuery({ queryKey: ["collections", "opcoes"], queryFn: getOpcoesDoCatalogo });
  const products = query.data?.pages.flatMap((p) => p.produtos) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  // vazio por causa de um filtro (dá para limpar) ou porque ainda não há nada cadastrado
  const filtrado =
    stockOnly || Object.entries(filters).some(([chave, valor]) => chave !== "sort" && valor);

  // mudou o filtro: a consulta muda junto e começa da primeira página
  function filtrar(patch: CatalogSearch) {
    onChange(patch);
  }

  return (
    <section className="px-4 py-10 md:px-6 md:py-12">
      <div
        className={`grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-2 ${locked ? "hidden" : "lg:grid-cols-4"}`}
      >
        {!locked && (
          <>
            <Select
              label="ESTILO"
              value={search.style ?? "all"}
              options={[
                ["all", "Todos"],
                ...(opcoes.data?.estilos ?? []).map((o) => [o.valor, o.nome] as [string, string]),
              ]}
              onChange={(v) => filtrar({ style: v })}
            />
            <Select
              label="CATEGORIA"
              value={search.type ?? "all"}
              options={[
                ["all", "Todas"],
                ...(opcoes.data?.categorias ?? []).map(
                  (o) => [o.valor, o.nome] as [string, string],
                ),
              ]}
              onChange={(v) => filtrar({ type: v })}
            />
            <Select
              label="COLEÇÃO"
              value={search.collection ?? "all"}
              options={[["all", "Todas"], ...(collections.data ?? []).map((c) => [c.tag, c.name])]}
              onChange={(v) => filtrar({ collection: v })}
            />
            {/* a curadoria não vem das tags: destaques são os mais vendidos; novidades, os cadastros
                dos últimos 3 meses */}
            <Select
              label="CURADORIA"
              value={search.section ?? "all"}
              options={[
                ["all", "Todas"],
                ["destaques", "Destaques"],
                ["novo-drop", "Novidades"],
              ]}
              onChange={(v) => filtrar({ section: v })}
            />
          </>
        )}
      </div>
      <div className="my-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className={`${ROTULO} mb-3 flex items-center gap-2`}>
            <span className="h-1.5 w-1.5 bg-destaque" /> {String(total).padStart(2, "0")} PEÇAS
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="h-4 w-4 accent-ink"
              checked={stockOnly}
              onChange={(e) => setStockOnly(e.target.checked)}
            />
            Somente disponíveis
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Select
            solto
            label="ORDENAR"
            value={search.sort ?? "recent"}
            options={[
              ["recent", "Recentes"],
              ["price-asc", "Menor preço"],
              ["price-desc", "Maior preço"],
              ["name", "Nome A–Z"],
            ]}
            onChange={(v) => filtrar({ sort: v })}
          />
          {!locked && (
            <Button
              variant="outline"
              className="h-11 rounded-none text-[11px] tracking-[0.2em]"
              onClick={() => {
                setStockOnly(false);
                onChange(SEM_FILTROS);
              }}
            >
              LIMPAR FILTROS
            </Button>
          )}
        </div>
      </div>
      {query.isPending ? (
        <p role="status" className="py-12">
          Carregando peças...
        </p>
      ) : query.error ? (
        <div role="alert" className="py-16 text-center">
          <h2 className="font-display text-4xl">NÃO FOI POSSÍVEL CARREGAR</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            {query.error.message || "Tente de novo em instantes."}
          </p>
          <Button
            variant="outline"
            className="mt-6 h-11 rounded-none text-[11px] tracking-[0.2em]"
            onClick={() => void query.refetch()}
          >
            TENTAR DE NOVO
          </Button>
        </div>
      ) : !products.length ? (
        filtrado && !locked ? (
          <Vazio
            titulo="Nenhuma peça"
            texto="Nenhuma peça combina com esses filtros."
            acao={
              <Button
                variant="outline"
                className="h-11 rounded-none text-[11px] tracking-[0.2em]"
                onClick={() => {
                  setStockOnly(false);
                  onChange(SEM_FILTROS);
                }}
              >
                LIMPAR FILTROS
              </Button>
            }
          />
        ) : (
          <Vazio
            titulo="Em breve"
            texto={
              locked
                ? "Ainda não há peças aqui. Volte em breve."
                : "O catálogo ainda está sendo montado. As primeiras peças chegam em breve."
            }
            acao={
              locked && (
                <Link
                  to="/catalogo"
                  className="border border-ink px-6 py-3 text-[11px] font-medium tracking-[0.2em] transition-colors hover:bg-ink hover:text-paper"
                >
                  VER O CATÁLOGO
                </Link>
              )
            }
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          {query.hasNextPage && (
            <div className="mt-10 text-center">
              <Button
                variant="outline"
                className="h-12 rounded-none px-8 text-[11px] tracking-[0.2em]"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? "CARREGANDO..." : "CARREGAR MAIS"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/**
 * Seletor com o rótulo em cima. Na faixa de filtros, fica numa caixa branca; `solto` (a ordenação)
 * fica sem a caixa. Cada opção é [valor, texto].
 */
function Select({
  label,
  value,
  options,
  onChange,
  solto = false,
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
  solto?: boolean;
}) {
  return (
    <label className={`block min-w-0 ${solto ? "w-[200px]" : "bg-paper p-4"}`}>
      <span className={`${ROTULO} mb-3 block text-ink/50`}>{label}</span>
      <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, texto]) => (
          <option key={v} value={v}>
            {texto}
          </option>
        ))}
      </select>
    </label>
  );
}
