import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/catalog/ProductCard";
import { selectClass } from "@/components/common/classes";
import { ROTULO } from "@/components/layout/PaginaTopo";
import { Button } from "@/components/ui/button";
import { getCollections, getProducts } from "@/lib/api";
import { catalogFilters, type CatalogSearch } from "./filtros";

/** Quantos produtos aparecem de cada vez (o "CARREGAR MAIS" mostra o próximo lote). */
const LOTE = 8;

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
  const query = useQuery({ queryKey: ["products", filters], queryFn: () => getProducts(filters) });
  const collections = useQuery({ queryKey: ["collections"], queryFn: getCollections });
  const [limit, setLimit] = useState(LOTE);
  const [stockOnly, setStockOnly] = useState(false);
  const products = (query.data ?? []).filter(
    (p) => !stockOnly || Object.values(p.stock ?? {}).some((qtd) => qtd > 0),
  );

  // mudou o filtro, volta a mostrar só o primeiro lote
  function filtrar(patch: CatalogSearch) {
    setLimit(LOTE);
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
                ["casual", "Casual"],
                ["treino", "Treino"],
              ]}
              onChange={(v) => filtrar({ style: v })}
            />
            <Select
              label="CATEGORIA"
              value={search.type ?? "all"}
              options={[
                ["all", "Todas"],
                ["camisetas", "Camisetas"],
                ["bermudas", "Bermudas"],
                ["conjuntos", "Conjuntos"],
              ]}
              onChange={(v) => filtrar({ type: v })}
            />
            <Select
              label="CURADORIA"
              value={search.section ?? "all"}
              options={[
                ["all", "Todas"],
                ["destaques", "Destaques"],
                ["novo-drop", "Novo drop"],
              ]}
              onChange={(v) => filtrar({ section: v })}
            />
            <Select
              label="COLEÇÃO"
              value={search.collection ?? "all"}
              options={[["all", "Todas"], ...(collections.data ?? []).map((c) => [c.tag, c.name])]}
              onChange={(v) => filtrar({ collection: v })}
            />
          </>
        )}
      </div>
      <div className="my-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className={`${ROTULO} mb-3 flex items-center gap-2`}>
            <span className="h-1.5 w-1.5 bg-destaque" /> {String(products.length).padStart(2, "0")}{" "}
            PEÇAS
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="h-4 w-4 accent-ink"
              checked={stockOnly}
              onChange={(e) => {
                setStockOnly(e.target.checked);
                setLimit(LOTE);
              }}
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
        <p role="alert">Não foi possível carregar os produtos.</p>
      ) : !products.length ? (
        <div className="py-16 text-center">
          <h2 className="font-display text-4xl">NENHUMA PEÇA</h2>
          <p className="mt-4 text-sm text-muted-foreground">Tente ajustar os filtros.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {products.slice(0, limit).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          {products.length > limit && (
            <div className="mt-10 text-center">
              <Button
                variant="outline"
                className="h-12 rounded-none px-8 text-[11px] tracking-[0.2em]"
                onClick={() => setLimit((n) => n + LOTE)}
              >
                CARREGAR MAIS
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
