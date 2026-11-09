import { selectClass } from "@/components/common/classes";
import { FormField } from "@/components/common/FormField";
import type { StaffMember } from "@/data/dashboard";

/** Campos do colaborador: dados, cargo (com o que cada um acessa) e se o acesso está ativo. */
export function StaffForm({
  value,
  set,
}: {
  value: StaffMember;
  set: (patch: Partial<StaffMember>) => void;
}) {
  return (
    <>
      <FormField
        label="Nome"
        value={value.name}
        required
        onChange={(e) => set({ name: e.target.value })}
      />
      <FormField
        label="E-mail"
        type="email"
        value={value.email}
        required
        onChange={(e) => set({ email: e.target.value })}
      />
      <label>
        <span className="mb-2 block text-xs">Cargo</span>
        <select
          className={selectClass}
          value={value.role}
          onChange={(e) => set({ role: e.target.value as StaffMember["role"] })}
        >
          <option value="admin">Administrador · acesso completo</option>
          <option value="operacao">Operação · produtos, coleções, estoque e pedidos</option>
          <option value="atendimento">Atendimento · pedidos, clientes, mensagens e trocas</option>
        </select>
      </label>
      <label className="flex gap-3 text-sm">
        <input
          type="checkbox"
          checked={value.active}
          onChange={(e) => set({ active: e.target.checked })}
        />
        Colaborador ativo
      </label>
    </>
  );
}
