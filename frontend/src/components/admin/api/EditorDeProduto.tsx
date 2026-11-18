import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Upload } from "lucide-react";
import { selectClass } from "@/components/common/classes";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import {
  enviarFoto,
  painel,
  type CorDaApi,
  type ProdutoDaApi,
  type TagDaApi,
  type TamanhoDaApi,
} from "@/lib/api/painel";
import { money } from "@/lib/checkout";
import type { PropsDaAba } from "./comum";

const tituloDaSecao = "mb-3 mt-8 border-b border-border pb-2 text-xl";

/**
 * O editor de um produto da API, em quatro partes: os dados (nome, preço, descrição e tags), as
 * variantes (tamanho + cor + SKU, com o estoque inicial), as fotos (enviadas para o bucket, já
 * reduzidas pelo navegador) e, para um produto novo, só os dados: as outras partes aparecem depois de
 * criado. O estoque de uma variante que já existe muda pela aba Estoque (cada mudança é um movimento).
 */
export function EditorDeProduto({
  id,
  busy,
  run,
  aoCriar,
}: PropsDaAba & { id?: string; aoCriar: (id: string) => void }) {
  const produto = useQuery({
    queryKey: ["painel", "produto", id],
    queryFn: () => painel<ProdutoDaApi>("GET", `/products/${id}`),
    enabled: !!id,
  });
  const tags = useQuery({
    queryKey: ["painel", "tags"],
    queryFn: () => painel<TagDaApi[]>("GET", "/tags"),
  });
  if (id && produto.isPending) return <p role="status">Carregando...</p>;
  return (
    <>
      <Dados
        key={produto.data?.id ?? "novo"}
        produto={produto.data}
        tags={tags.data ?? []}
        busy={busy}
        run={run}
        aoCriar={aoCriar}
      />
      {produto.data && (
        <>
          <Variantes produto={produto.data} busy={busy} run={run} />
          <Fotos produto={produto.data} busy={busy} run={run} />
        </>
      )}
    </>
  );
}

function Dados({
  produto,
  tags,
  busy,
  run,
  aoCriar,
}: PropsDaAba & { produto?: ProdutoDaApi; tags: TagDaApi[]; aoCriar: (id: string) => void }) {
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [preco, setPreco] = useState(String(produto?.preco ?? ""));
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [escolhidas, setEscolhidas] = useState<string[]>((produto?.tags ?? []).map((t) => t.id));
  const doFiltro = (filtro: string) => tags.filter((t) => t.filtro === filtro);
  const categoria = doFiltro("CATEGORIA").find((t) => escolhidas.includes(t.id))?.id ?? "";

  const marcar = (tagId: string, sim: boolean) =>
    setEscolhidas((atual) => (sim ? [...atual, tagId] : atual.filter((t) => t !== tagId)));

  function salvar(e: FormEvent) {
    e.preventDefault();
    const corpo = { nome, preco: Number(preco), descricao: descricao || null, tagIds: escolhidas };
    void run(
      async () => {
        if (produto) await painel("PUT", `/products/${produto.id}`, corpo);
        else {
          const novo = await painel<ProdutoDaApi>("POST", "/products", corpo);
          aoCriar(novo.id);
        }
      },
      produto
        ? "Produto salvo."
        : "Produto criado (inativo). Agora cadastre as variantes e as fotos.",
    );
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nome"
          value={nome}
          maxLength={150}
          required
          onChange={(e) => setNome(e.target.value)}
        />
        <FormField
          label="Preço (R$)"
          type="number"
          min="0.01"
          step="0.01"
          value={preco}
          required
          onChange={(e) => setPreco(e.target.value)}
        />
      </div>
      <label className="block">
        <span className="mb-2 block text-xs">Descrição</span>
        <textarea
          value={descricao}
          rows={3}
          maxLength={2000}
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full border border-input bg-background p-3 text-sm"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-xs">Estilos (pelo menos um)</legend>
        <div className="flex flex-wrap gap-5">
          {doFiltro("ESTILO").map((t) => (
            <label key={t.id} className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={escolhidas.includes(t.id)}
                onChange={(e) => marcar(t.id, e.target.checked)}
              />
              {t.tag}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-2 block text-xs">Categoria</span>
        <select
          aria-label="Categoria"
          className={selectClass}
          value={categoria}
          required
          onChange={(e) =>
            setEscolhidas((atual) => [
              ...atual.filter((t) => !doFiltro("CATEGORIA").some((c) => c.id === t)),
              e.target.value,
            ])
          }
        >
          <option value="">Escolha</option>
          {doFiltro("CATEGORIA").map((t) => (
            <option key={t.id} value={t.id}>
              {t.tag}
            </option>
          ))}
        </select>
      </label>
      {doFiltro("COLECAO").length > 0 && (
        <fieldset>
          <legend className="mb-2 text-xs">Coleções</legend>
          <div className="flex flex-wrap gap-5">
            {doFiltro("COLECAO").map((t) => (
              <label key={t.id} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={escolhidas.includes(t.id)}
                  onChange={(e) => marcar(t.id, e.target.checked)}
                />
                {t.tag}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <Button disabled={busy} className="rounded-none">
        {produto ? "SALVAR DADOS" : "CRIAR PRODUTO"}
      </Button>
    </form>
  );
}

function Variantes({ produto, busy, run }: PropsDaAba & { produto: ProdutoDaApi }) {
  const tamanhos = useQuery({
    queryKey: ["painel", "tamanhos"],
    queryFn: () => painel<TamanhoDaApi[]>("GET", "/sizes"),
  });
  const cores = useQuery({
    queryKey: ["painel", "cores"],
    queryFn: () => painel<CorDaApi[]>("GET", "/colors"),
  });
  const [nova, setNova] = useState({ sizeId: "", colorId: "", sku: "", preco: "", quant: "0" });
  const [novaCor, setNovaCor] = useState({ nome: "", hex: "#000000" });
  const [novoTamanho, setNovoTamanho] = useState("");

  function criar(e: FormEvent) {
    e.preventDefault();
    void run(
      () =>
        painel("POST", `/products/${produto.id}/variants`, {
          sizeId: nova.sizeId,
          colorId: nova.colorId,
          sku: nova.sku,
          preco: nova.preco ? Number(nova.preco) : null,
          quant: Number(nova.quant),
        }),
      "Variante criada.",
    ).then((ok) => ok && setNova({ ...nova, sku: "", quant: "0" }));
  }

  return (
    <section>
      <h3 className={tituloDaSecao}>VARIANTES</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        A peça que vai para o carrinho é a variante (tamanho + cor). O estoque de uma variante
        criada muda pela aba Estoque.
      </p>
      <ul className="divide-y divide-border text-sm">
        {(produto.variantes ?? []).map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 py-2">
            <span>
              {v.size?.label} · {v.color?.nome} · <span className="font-mono text-xs">{v.sku}</span>
            </span>
            <span className="text-muted-foreground">
              {money(Number(v.precoEfetivo))} · {v.quant} un.
            </span>
            <Button
              size="icon"
              variant="outline"
              aria-label={`Excluir a variante ${v.sku}`}
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    `Excluir a variante ${v.sku}? Só funciona se ela nunca esteve em um pedido.`,
                  )
                )
                  void run(() => painel("DELETE", `/variants/${v.id}`), "Variante excluída.");
              }}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <form onSubmit={criar} className="mt-4 grid gap-3 sm:grid-cols-3">
        <label>
          <span className="mb-2 block text-xs">Tamanho</span>
          <select
            aria-label="Tamanho"
            className={selectClass}
            required
            value={nova.sizeId}
            onChange={(e) => setNova({ ...nova, sizeId: e.target.value })}
          >
            <option value="">Escolha</option>
            {(tamanhos.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-xs">Cor</span>
          <select
            aria-label="Cor"
            className={selectClass}
            required
            value={nova.colorId}
            onChange={(e) => setNova({ ...nova, colorId: e.target.value })}
          >
            <option value="">Escolha</option>
            {(cores.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <FormField
          label="SKU"
          value={nova.sku}
          required
          maxLength={50}
          onChange={(e) => setNova({ ...nova, sku: e.target.value })}
        />
        <FormField
          label="Preço próprio (opcional)"
          type="number"
          min="0.01"
          step="0.01"
          value={nova.preco}
          onChange={(e) => setNova({ ...nova, preco: e.target.value })}
        />
        <FormField
          label="Estoque inicial"
          type="number"
          min="0"
          step="1"
          value={nova.quant}
          onChange={(e) => setNova({ ...nova, quant: e.target.value })}
        />
        <Button disabled={busy} className="self-end rounded-none">
          ADICIONAR VARIANTE
        </Button>
      </form>
      <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
        <div className="flex items-end gap-2">
          <FormField
            label="Novo tamanho"
            value={novoTamanho}
            maxLength={10}
            onChange={(e) => setNovoTamanho(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy || !novoTamanho.trim()}
            onClick={() =>
              void run(
                () => painel("POST", "/sizes", { label: novoTamanho.trim() }),
                "Tamanho criado.",
              ).then((ok) => ok && setNovoTamanho(""))
            }
          >
            CRIAR
          </Button>
        </div>
        <div className="flex items-end gap-2">
          <FormField
            label="Nova cor"
            value={novaCor.nome}
            maxLength={50}
            onChange={(e) => setNovaCor({ ...novaCor, nome: e.target.value })}
          />
          <input
            type="color"
            aria-label="Cor"
            value={novaCor.hex}
            onChange={(e) => setNovaCor({ ...novaCor, hex: e.target.value })}
            className="h-12 w-12 border border-input"
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy || !novaCor.nome.trim()}
            onClick={() =>
              void run(
                () => painel("POST", "/colors", { nome: novaCor.nome.trim(), hex: novaCor.hex }),
                "Cor criada.",
              ).then((ok) => ok && setNovaCor({ nome: "", hex: "#000000" }))
            }
          >
            CRIAR
          </Button>
        </div>
      </div>
    </section>
  );
}

function Fotos({ produto, busy, run }: PropsDaAba & { produto: ProdutoDaApi }) {
  const fotos = [...(produto.imagens ?? [])].sort((a, b) => a.ordem - b.ordem);
  const [enviando, setEnviando] = useState(false);

  async function enviar(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    setEnviando(true);
    await run(
      async () => {
        for (const arquivo of Array.from(arquivos)) await enviarFoto(produto.id, arquivo);
      },
      arquivos.length > 1 ? "Fotos enviadas." : "Foto enviada.",
    );
    setEnviando(false);
  }

  return (
    <section>
      <h3 className={tituloDaSecao}>FOTOS</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        A primeira é a capa. As fotos são reduzidas para até 1600 px em WebP antes de enviar.
      </p>
      <div className="flex flex-wrap gap-3">
        {fotos.map((f, i) => (
          <figure key={f.id} className="relative">
            <img src={f.url} alt={`Foto ${i + 1}`} className="h-28 w-24 object-cover" />
            <Button
              size="icon"
              variant="outline"
              aria-label={`Excluir a foto ${i + 1}`}
              className="absolute right-1 top-1 h-7 w-7 bg-background"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Excluir esta foto?"))
                  void run(() => painel("DELETE", `/images/${f.id}`), "Foto excluída.");
              }}
            >
              <Trash2 />
            </Button>
          </figure>
        ))}
        <label className="flex h-28 w-24 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-input text-xs">
          <Upload className="h-5 w-5" />
          {enviando ? "ENVIANDO..." : "ENVIAR"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="sr-only"
            disabled={busy || enviando}
            onChange={(e) => {
              void enviar(e.currentTarget.files);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
    </section>
  );
}
