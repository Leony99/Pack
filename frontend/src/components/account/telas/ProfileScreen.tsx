import { useState } from "react";
import { Save } from "lucide-react";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { changePassword, updateProfile } from "@/lib/api";
import type { AccountData, AccountScreenProps } from "../tipos";

type Perfil = AccountData["customer"];

const CAMPOS_DO_PERFIL = [
  { campo: "name", rotulo: "Nome completo", tipo: "text", obrigatorio: true },
  { campo: "email", rotulo: "E-mail", tipo: "email", obrigatorio: true },
  { campo: "phone", rotulo: "Telefone (opcional)", tipo: "tel", obrigatorio: false },
] as const;

/** Dados pessoais e troca de senha. */
export function ProfileScreen({
  data,
  busy,
  run,
  onError,
}: AccountScreenProps & { onError: (mensagem: string) => void }) {
  return (
    <div className="max-w-2xl">
      <ProfileForm
        // a key recria o formulário quando os dados salvos mudam
        key={data.customer.id + data.customer.name + data.customer.email}
        profile={data.customer}
        busy={busy}
        onSave={(value) =>
          void run(() => updateProfile(value), "Dados atualizados na demonstração.")
        }
      />
      <form
        className="mt-10 pt-6"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const campos = new FormData(form);
          if (campos.get("next") !== campos.get("confirm")) {
            onError("As novas senhas não coincidem.");
            return;
          }
          void run(async () => {
            await changePassword(String(campos.get("current")), String(campos.get("next")));
            form.reset();
          }, "Alteração de senha simulada; nenhuma credencial foi armazenada.");
        }}
      >
        <h2 className="mb-5 text-2xl">ALTERAR SENHA</h2>
        <div className="grid gap-4">
          <FormField
            label="Senha atual (demonstração)"
            name="current"
            type="password"
            autoComplete="current-password"
            required
          />
          <FormField
            label="Nova senha"
            name="next"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <FormField
            label="Confirmar nova senha"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <Button disabled={busy} className="mt-5 rounded-none">
          ALTERAR SENHA
        </Button>
      </form>
    </div>
  );
}

function ProfileForm({
  profile,
  busy,
  onSave,
}: {
  profile: Perfil;
  busy: boolean;
  onSave: (perfil: Perfil) => void;
}) {
  const [value, setValue] = useState(profile);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(value);
      }}
    >
      <h2 className="mb-5 text-2xl">SEU PERFIL</h2>
      <div className="grid gap-4">
        {CAMPOS_DO_PERFIL.map(({ campo, rotulo, tipo, obrigatorio }) => (
          <FormField
            key={campo}
            label={rotulo}
            type={tipo}
            value={value[campo]}
            required={obrigatorio}
            onChange={(e) => setValue({ ...value, [campo]: e.target.value })}
          />
        ))}
      </div>
      <label className="my-5 flex gap-3 text-sm">
        <input
          type="checkbox"
          checked={value.newsletter}
          onChange={(e) => setValue({ ...value, newsletter: e.target.checked })}
        />
        Receber novidades da PACK
      </label>
      <Button disabled={busy} className="rounded-none">
        <Save /> SALVAR DADOS
      </Button>
    </form>
  );
}
