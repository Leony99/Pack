import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { selectClass } from "@/components/common/classes";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { painel, todasAsPaginas, type ProdutoDaApi, type TagDaApi } from "@/lib/api/painel";
import { Estado, type PropsDaAba } from "./comum";

/**
 * Coleções: na API, uma coleção é uma tag com o filtro Coleção, e as peças dela são os produtos com
 * essa tag. Aqui a equipe cria e renomeia coleções, vê as peças de cada uma (ativas e inativas) e põe
 * ou tira peças. Apagar só vale para uma coleção sem peças.
 */
export function Colecoes({ busy, run }: PropsDaAba) {
  const colecoes = useQuery({
    queryKey: ["painel", "colecoes"],
    queryFn: () => painel<TagDaApi[]>("GET", "/tags/colecoes"),
  });
  const [aberta, setAberta] = useState<string | null>(null);
  const [nova, setNova] = useState("");
  const atual = colecoes.data?.find((c) => c.id === aberta);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside>
        <form
          className="mb-5 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () => painel("POST", "/tags", { tag: nova.trim().toLowerCase(), filtro: "COLECAO" }),
              "Coleção criada.",
            ).then((ok) => ok && setNova(""));
          }}
        >
          <FormField
            label="Nova coleção"
            value={nova}
            maxLength={50}
            required
            onChange={(e) => setNova(e.target.value)}
          />
          <Button size="icon" aria-label="Criar coleção" disabled={busy}>
            <Plus />
          </Button>
        </form>
        <Estado carregando={colecoes.isPending} erro={colecoes.error} />
        <ul className="border border-ink/10">
          {(colecoes.data ?? []).map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setAberta(c.id)}
                className={`block w-full px-4 py-3 text-left text-xs tracking-[0.2em] ${
                  aberta === c.id ? "bg-ink text-paper" : "hover:bg-secondary"
                }`}
              >
                {c.tag.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          A primeira é a da peça mais nova: é o drop em destaque da home.
        </p>
      </aside>
      <section>
        {atual ? (
          <Colecao
            key={atual.id}
            colecao={atual}
            busy={busy}
            run={run}
            aoApagar={() => setAberta(null)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Escolha uma coleção para ver as peças dela.
          </p>
        )}
      </section>
    </div>
  );
}

function Colecao({
  colecao,
  busy,
  run,
  aoApagar,
}: PropsDaAba & { colecao: TagDaApi; aoApagar: () => void }) {
  const pecas = useQuery({
    queryKey: ["painel", "colecao", colecao.tag],
    queryFn: () =>
      todasAsPaginas<ProdutoDaApi>(`/products/painel?tag=${encodeURIComponent(colecao.tag)}`),
  });
  const todos = useQuery({
    queryKey: ["painel", "produtos"],
    queryFn: () => todasAsPaginas<ProdutoDaApi>("/products/painel"),
  });
  const [nome, setNome] = useState(colecao.tag);
  const [adicionar, setAdicionar] = useState("");
  const naColecao = new Set((pecas.data ?? []).map((p) => p.id));

  return (
    <>
      <form
        className="mb-6 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            () =>
              painel("PUT", `/tags/${colecao.id}`, {
                tag: nome.trim().toLowerCase(),
                filtro: "COLECAO",
              }),
            "Coleção renomeada.",
          );
        }}
      >
        <FormField
          label="Nome da coleção"
          value={nome}
          maxLength={50}
          required
          onChange={(e) => setNome(e.target.value)}
        />
        <Button variant="outline" disabled={busy}>
          RENOMEAR
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy || naColecao.size > 0}
          title={naColecao.size > 0 ? "Tire as peças antes de apagar" : undefined}
          onClick={() => {
            if (window.confirm(`Apagar a coleção ${colecao.tag}?`))
              void run(() => painel("DELETE", `/tags/${colecao.id}`), "Coleção apagada.").then(
                (ok) => ok && aoApagar(),
              );
          }}
        >
          <Trash2 /> APAGAR
        </Button>
      </form>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="min-w-64 flex-1">
          <span className="mb-2 block text-xs">Pôr uma peça na coleção</span>
          <select
            aria-label="Pôr uma peça na coleção"
            className={selectClass}
            value={adicionar}
            onChange={(e) => setAdicionar(e.target.value)}
          >
            <option value="">Escolha um produto</option>
            {(todos.data ?? [])
              .filter((p) => !naColecao.has(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                  {p.ativo === false ? " (inativo)" : ""}
                </option>
              ))}
          </select>
        </label>
        <Button
          disabled={busy || !adicionar}
          onClick={() =>
            void run(
              () => painel("POST", `/products/${adicionar}/tags`, { tagId: colecao.id }),
              "Peça adicionada à coleção.",
            ).then((ok) => ok && setAdicionar(""))
          }
        >
          ADICIONAR
        </Button>
      </div>
      <Estado carregando={pecas.isPending} erro={pecas.error} />
      {pecas.data && !pecas.data.length && (
        <p className="text-sm">Nenhuma peça nesta coleção ainda.</p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(pecas.data ?? []).map((p) => {
          const capa = [...(p.imagens ?? [])].sort((a, b) => a.ordem - b.ordem)[0]?.url;
          return (
            <li key={p.id} className="flex items-center gap-3 border border-ink/10 p-3">
              {capa ? (
                <img src={capa} alt="" className="h-16 w-12 object-cover" />
              ) : (
                <span className="h-16 w-12 bg-secondary" />
              )}
              <span className="min-w-0 flex-1 text-sm">
                {p.nome}
                {p.ativo === false && (
                  <span className="block text-xs text-muted-foreground">inativo</span>
                )}
              </span>
              <Button
                size="icon"
                variant="outline"
                aria-label={`Tirar ${p.nome} da coleção`}
                disabled={busy}
                onClick={() =>
                  void run(
                    () => painel("DELETE", `/products/${p.id}/tags/${colecao.id}`),
                    "Peça tirada da coleção.",
                  )
                }
              >
                <X />
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
