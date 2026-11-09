import { useState } from "react";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { FormField } from "@/components/common/FormField";
import { AddressText } from "@/components/order/AddressText";
import { Button } from "@/components/ui/button";
import { deleteAddress, saveAddress } from "@/lib/api";
import type { SavedAddress } from "@/data/dashboard";
import type { AccountScreenProps } from "../tipos";

/** Campos do formulário de endereço, na ordem da tela, com o rótulo de cada um. */
const CAMPOS = [
  ["label", "Identificação"],
  ["name", "Destinatário"],
  ["cep", "CEP"],
  ["street", "Rua / Avenida"],
  ["number", "Número"],
  ["complement", "Complemento"],
  ["neighborhood", "Bairro"],
  ["city", "Cidade"],
  ["state", "UF"],
] as const;

type CampoDeEndereco = (typeof CAMPOS)[number][0];

/** CEP só com números e UF em maiúsculas, já enquanto digita. */
function normalizar(campo: CampoDeEndereco, valor: string): string {
  if (campo === "cep") return valor.replace(/\D/g, "");
  if (campo === "state") return valor.toUpperCase();
  return valor;
}

/** Endereços do cliente: lista, cadastro, edição, exclusão e escolha do principal. */
export function AddressesScreen({ data, busy, run }: AccountScreenProps) {
  const [editing, setEditing] = useState<SavedAddress | null>(null);

  const novo = (): SavedAddress => ({
    id: "",
    label: "Casa",
    primary: !data.addresses.length,
    name: data.customer.name,
    email: data.customer.email,
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  return (
    <>
      <Button className="mb-6 rounded-none" onClick={() => setEditing(novo())}>
        <Plus /> NOVO ENDEREÇO
      </Button>
      {editing && (
        <form
          className="mb-8 bg-secondary p-6"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await saveAddress(editing);
              setEditing(null);
            }, "Endereço salvo na demonstração.");
          }}
        >
          <h2 className="mb-6 text-2xl">{editing.id ? "EDITAR" : "NOVO"} ENDEREÇO</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {CAMPOS.map(([campo, rotulo]) => (
              <FormField
                key={campo}
                label={rotulo}
                value={editing[campo]}
                required={campo !== "complement"}
                maxLength={campo === "state" ? 2 : campo === "cep" ? 8 : 160}
                onChange={(e) =>
                  setEditing({ ...editing, [campo]: normalizar(campo, e.target.value) })
                }
              />
            ))}
          </div>
          <label className="my-5 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={editing.primary}
              onChange={(e) => setEditing({ ...editing, primary: e.target.checked })}
            />
            Endereço principal
          </label>
          <div className="flex gap-3">
            <Button disabled={busy} className="rounded-none">
              <Save /> SALVAR ENDEREÇO
            </Button>
            <Button
              variant="outline"
              type="button"
              className="rounded-none"
              onClick={() => setEditing(null)}
            >
              CANCELAR
            </Button>
          </div>
        </form>
      )}
      {!data.addresses.length && (
        <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        {data.addresses.map((a) => (
          <article key={a.id} className="bg-secondary p-5">
            <div className="mb-4 flex justify-between">
              <h2 className="text-xl">{a.label.toUpperCase()}</h2>
              {a.primary && <span className="text-xs">PRINCIPAL</span>}
            </div>
            <AddressText address={a} />
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label={`Editar ${a.label}`}
                className="rounded-none"
                onClick={() => setEditing(a)}
              >
                <Pencil />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={`Excluir ${a.label}`}
                disabled={busy}
                className="rounded-none"
                onClick={() => {
                  if (window.confirm("Excluir este endereço?"))
                    void run(() => deleteAddress(a.id), "Endereço excluído.");
                }}
              >
                <Trash2 />
              </Button>
              {!a.primary && (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () => saveAddress({ ...a, primary: true }),
                      "Endereço principal atualizado.",
                    )
                  }
                >
                  TORNAR PRINCIPAL
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
