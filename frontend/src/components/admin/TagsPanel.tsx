import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FormField } from "@/components/common/FormField";
import { selectClass } from "@/components/common/classes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  canStaff,
  contarProdutosPorTag,
  deleteTag,
  getProducts,
  getTags,
  nomeDaOpcao,
  normalizarTag,
  saveTag,
  USA_API,
  type FiltroDaTag,
  type TagDaLoja,
} from "@/lib/api";
import { useSession } from "@/lib/session";
import { AdminRow, AdminTable } from "./AdminTable";
import { RowActions } from "./RowActions";

/** Como cada filtro aparece no painel. */
const NOME_DO_FILTRO: Record<FiltroDaTag | "nenhum", string> = {
  ESTILO: "Estilo",
  CATEGORIA: "Categoria",
  COLECAO: "Coleção (drop)",
  nenhum: "Sem filtro (só busca)",
};
const nomeDoFiltro = (t: TagDaLoja) => NOME_DO_FILTRO[t.filtro ?? "nenhum"];

const NOVA: TagDaLoja = { id: "", tag: "", filtro: null, fixa: false };

/**
 * Aba Tags do painel: todas as tags, o filtro do catálogo em que cada uma aparece (estilo,
 * categoria, coleção ou nenhum) e quantos produtos a usam. Criar, editar e apagar. A curadoria
 * (destaques e novidades) não usa tag.
 */
export function TagsPanel() {
  const { staff } = useSession();
  const queryClient = useQueryClient();
  const allowed = !!staff && canStaff(staff.role, "tags");
  const tags = useQuery({ queryKey: ["admin", "tags"], queryFn: getTags, enabled: allowed });
  const produtos = useQuery({
    queryKey: ["products", "painel-tags"],
    queryFn: () => getProducts(),
    enabled: allowed,
  });
  const [editing, setEditing] = useState<TagDaLoja | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const contagem = contarProdutosPorTag(produtos.data ?? []);
  const produtosDa = (t: TagDaLoja) =>
    contagem.get(normalizarTag(t.tag)) ?? contagem.get(t.tag) ?? 0;

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      // as tags mudam os filtros do catálogo, as coleções e a home
      await Promise.all(
        ["admin", "products", "collections"].map((chave) =>
          queryClient.invalidateQueries({ queryKey: [chave] }),
        ),
      );
      setMessage(success);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function remove(t: TagDaLoja) {
    if (window.confirm(`Apagar a tag "${t.tag}"? Os produtos continuam, só perdem a tag.`))
      void run(() => deleteTag(t.id), "Tag apagada.");
  }

  return (
    <DashboardLayout kind="staff" title="TAGS">
      {USA_API && (
        <p className="mb-5 border border-ink/10 p-4 text-sm">
          As tags vêm da Pack API. Para criar, editar ou apagar, a API pede o login da equipe com a
          permissão de catálogo (CATALOG_WRITE).
        </p>
      )}
      {(error || tags.error) && (
        <p role="alert" className="mb-5 bg-secondary p-4 text-sm">
          {error || String(tags.error)}
        </p>
      )}
      {message && (
        <p role="status" className="mb-5 bg-secondary p-4 text-sm">
          {message}
        </p>
      )}
      {!allowed && staff && (
        <p className="py-10 text-sm">Este cargo não tem acesso a esta seção.</p>
      )}
      {tags.isPending && allowed && <p role="status">Carregando tags...</p>}
      {tags.data && allowed && (
        <>
          <div className="mb-6 flex justify-end">
            <Button
              className="h-11 rounded-none"
              onClick={() => {
                setError("");
                setEditing({ ...NOVA });
              }}
            >
              <Plus /> NOVA TAG
            </Button>
          </div>
          <AdminTable
            filters={[
              { key: "filtro", label: "Filtro", options: Object.values(NOME_DO_FILTRO) },
              { key: "uso", label: "Produtos", options: ["Com produtos", "Sem produtos"] },
            ]}
            headers={["Tag", "Filtro", "Produtos", "Ações"]}
            exportName="tags"
          >
            {tags.data.map((t) => (
              <AdminRow
                key={t.id}
                values={[t.tag, nomeDoFiltro(t), produtosDa(t)]}
                filters={{
                  filtro: nomeDoFiltro(t),
                  uso: produtosDa(t) > 0 ? "Com produtos" : "Sem produtos",
                }}
                search={[t.tag, nomeDoFiltro(t)].join(" ")}
              >
                <td>{t.tag}</td>
                <td>{nomeDoFiltro(t)}</td>
                <td>{produtosDa(t)}</td>
                <td>
                  {/* os estilos fixos (casual e treino) não mudam nem saem */}
                  {t.fixa ? (
                    <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground">
                      FIXA
                    </span>
                  ) : (
                    <RowActions
                      onEdit={() => {
                        setError("");
                        setEditing({ ...t });
                      }}
                      onDelete={() => remove(t)}
                      disabled={busy}
                    />
                  )}
                </td>
              </AdminRow>
            ))}
          </AdminTable>
        </>
      )}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85svh] overflow-y-auto rounded-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editing?.id ? "EDITAR TAG" : "NOVA TAG"}
            </DialogTitle>
            <DialogDescription>
              O filtro diz onde a tag aparece no catálogo. Sem filtro, ela só vale na busca.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm">
              {error}
            </p>
          )}
          {editing && (
            <TagForm
              value={editing}
              set={(patch) => setEditing({ ...editing, ...patch })}
              busy={busy}
              onSave={() =>
                void run(
                  () =>
                    saveTag({
                      id: editing.id || undefined,
                      tag: editing.tag,
                      filtro: editing.filtro,
                    }),
                  editing.id ? "Tag atualizada." : "Tag criada.",
                ).then((ok) => ok && setEditing(null))
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

/** Nome e filtro da tag (a própria tag é a opção do filtro). */
function TagForm({
  value,
  set,
  busy,
  onSave,
}: {
  value: TagDaLoja;
  set: (patch: Partial<TagDaLoja>) => void;
  busy: boolean;
  onSave: () => void;
}) {
  function submit(e: FormEvent) {
    e.preventDefault();
    onSave();
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <FormField
        label="Tag"
        value={value.tag}
        maxLength={50}
        required
        onChange={(e) => set({ tag: e.target.value })}
      />
      <label className="block text-xs font-medium uppercase tracking-[0.15em]">
        Filtro do catálogo
        <select
          className={`${selectClass} mt-2 normal-case tracking-normal`}
          value={value.filtro ?? ""}
          onChange={(e) => set({ filtro: (e.target.value || null) as FiltroDaTag | null })}
        >
          <option value="">{NOME_DO_FILTRO.nenhum}</option>
          <option value="ESTILO">{NOME_DO_FILTRO.ESTILO}</option>
          <option value="CATEGORIA">{NOME_DO_FILTRO.CATEGORIA}</option>
          <option value="COLECAO">{NOME_DO_FILTRO.COLECAO}</option>
        </select>
      </label>
      {(value.filtro === "ESTILO" || value.filtro === "CATEGORIA") && (
        <p className="text-xs text-muted-foreground">
          A tag vira a opção &quot;{nomeDaOpcao(normalizarTag(value.tag) || "nome-da-tag")}&quot; do
          filtro de {value.filtro === "ESTILO" ? "estilo" : "categoria"} no catálogo. Todo produto
          tem pelo menos uma tag de estilo e exatamente uma de categoria; o filtro só muda numa tag
          sem produtos.
        </p>
      )}
      {value.filtro === "COLECAO" && (
        <p className="text-xs text-muted-foreground">
          A tag vira a coleção /colecao/{normalizarTag(value.tag) || "nome-da-tag"}. A coleção da
          peça cadastrada mais recentemente é o drop em destaque da home.
        </p>
      )}
      <Button disabled={busy} className="h-12 w-full rounded-none text-[11px] tracking-[0.2em]">
        {busy ? "SALVANDO..." : "SALVAR"}
      </Button>
    </form>
  );
}
