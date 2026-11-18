import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { selectClass } from "@/components/common/classes";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { SENHA_MAXIMA, SENHA_MINIMA } from "@/lib/api";
import { painel, todasAsPaginas, type ColaboradorDaApi, type PapelDaApi } from "@/lib/api/painel";
import { useSession } from "@/lib/session";
import { AdminRow, AdminTable } from "../AdminTable";
import { RowActions } from "../RowActions";
import { Estado, Janela, type PropsDaAba } from "./comum";

type Rascunho = { id?: string; nome: string; email: string; senha: string; roleId: string };

/**
 * Colaboradores: a equipe, o papel de cada um (com as permissões dele) e o cadastro. A senha só é
 * definida no cadastro; depois, cada um troca a própria. Ninguém exclui a si mesmo nem tira de si o
 * acesso à equipe (a API recusa).
 */
export function Equipe({ busy, run }: PropsDaAba) {
  const { staff } = useSession();
  const equipe = useQuery({
    queryKey: ["painel", "equipe"],
    queryFn: () => todasAsPaginas<ColaboradorDaApi>("/staff"),
  });
  const papeis = useQuery({
    queryKey: ["painel", "papeis"],
    queryFn: () => painel<PapelDaApi[]>("GET", "/roles"),
  });
  const [aberto, setAberto] = useState<Rascunho | null>(null);

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button
          className="h-11 rounded-none"
          onClick={() =>
            setAberto({ nome: "", email: "", senha: "", roleId: papeis.data?.[0]?.id ?? "" })
          }
        >
          <Plus /> NOVO COLABORADOR
        </Button>
      </div>
      <Estado carregando={equipe.isPending} erro={equipe.error} />
      {equipe.data && (
        <AdminTable
          exportName="colaboradores"
          filters={[{ key: "papel", label: "Papel" }]}
          headers={["Nome", "E-mail", "Papel", "Permissões", "Ações"]}
        >
          {equipe.data.map((s) => (
            <AdminRow
              key={s.id}
              values={[s.nome, s.email, s.role.nome]}
              filters={{ papel: s.role.nome }}
            >
              <td>{s.nome}</td>
              <td>{s.email}</td>
              <td>{s.role.nome}</td>
              <td className="text-xs text-muted-foreground">
                {(s.role.permissoes ?? []).map((p) => p.nome).join(", ")}
              </td>
              <td>
                <RowActions
                  disabled={busy}
                  onEdit={() =>
                    setAberto({
                      id: s.id,
                      nome: s.nome,
                      email: s.email,
                      senha: "",
                      roleId: s.role.id,
                    })
                  }
                  onDelete={() => {
                    if (s.id === staff?.id)
                      return window.alert("Você não pode excluir a própria conta.");
                    if (window.confirm(`Excluir ${s.nome}? O acesso dele acaba na hora.`))
                      void run(() => painel("DELETE", `/staff/${s.id}`), "Colaborador excluído.");
                  }}
                />
              </td>
            </AdminRow>
          ))}
        </AdminTable>
      )}
      <Janela
        titulo={aberto?.id ? "EDITAR COLABORADOR" : "NOVO COLABORADOR"}
        aberta={!!aberto}
        fechar={() => setAberto(null)}
      >
        {aberto && (
          <Formulario
            inicial={aberto}
            papeis={papeis.data ?? []}
            busy={busy}
            salvar={(r) =>
              void run(
                () =>
                  r.id
                    ? painel("PUT", `/staff/${r.id}`, {
                        nome: r.nome,
                        email: r.email,
                        roleId: r.roleId,
                      })
                    : painel("POST", "/staff", {
                        nome: r.nome,
                        email: r.email,
                        senha: r.senha,
                        roleId: r.roleId,
                      }),
                "Colaborador salvo.",
              ).then((ok) => ok && setAberto(null))
            }
          />
        )}
      </Janela>
    </>
  );
}

function Formulario({
  inicial,
  papeis,
  busy,
  salvar,
}: {
  inicial: Rascunho;
  papeis: PapelDaApi[];
  busy: boolean;
  salvar: (r: Rascunho) => void;
}) {
  const [r, setR] = useState(inicial);
  const papel = papeis.find((p) => p.id === r.roleId);
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        salvar(r);
      }}
    >
      <FormField
        label="Nome"
        value={r.nome}
        maxLength={100}
        required
        onChange={(e) => setR({ ...r, nome: e.target.value })}
      />
      <FormField
        label="E-mail"
        type="email"
        value={r.email}
        maxLength={254}
        required
        onChange={(e) => setR({ ...r, email: e.target.value })}
      />
      {!r.id && (
        <FormField
          label="Senha inicial"
          type="password"
          autoComplete="new-password"
          minLength={SENHA_MINIMA}
          maxLength={SENHA_MAXIMA}
          required
          value={r.senha}
          onChange={(e) => setR({ ...r, senha: e.target.value })}
        />
      )}
      <label>
        <span className="mb-2 block text-xs">Papel</span>
        <select
          aria-label="Papel"
          className={selectClass}
          value={r.roleId}
          required
          onChange={(e) => setR({ ...r, roleId: e.target.value })}
        >
          {papeis.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      {papel && (
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Pode: {papel.permissoes.map((p) => p.nome).join(", ") || "nada ainda"}
        </p>
      )}
      <Button disabled={busy} className="rounded-none sm:col-span-2">
        SALVAR
      </Button>
    </form>
  );
}
