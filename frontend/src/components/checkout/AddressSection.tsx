import type { SavedAddress } from "@/data/dashboard";
import type { CheckoutAddress } from "@/data/types";

type Campo = {
  key: keyof CheckoutAddress;
  label: string;
  type?: string;
  autoComplete?: string;
  maxLength?: number;
  pattern?: string;
  inputMode?: "numeric";
  /** Ajusta o valor enquanto a pessoa digita. */
  normalizar?: (valor: string) => string;
};

const CAMPOS: Campo[] = [
  { key: "name", label: "Nome completo", autoComplete: "name" },
  { key: "email", label: "E-mail", type: "email", autoComplete: "email" },
  {
    key: "cep",
    label: "CEP",
    autoComplete: "postal-code",
    maxLength: 9,
    pattern: "[0-9]{8}",
    inputMode: "numeric",
    normalizar: (v) => v.replace(/\D/g, "").slice(0, 8),
  },
  { key: "street", label: "Rua / Avenida", autoComplete: "address-line1" },
  { key: "number", label: "Número" },
  { key: "complement", label: "Complemento (opcional)", autoComplete: "address-line2" },
  { key: "neighborhood", label: "Bairro" },
  { key: "city", label: "Cidade", autoComplete: "address-level2" },
  {
    key: "state",
    label: "UF",
    autoComplete: "address-level1",
    maxLength: 2,
    pattern: "[A-Za-z]{2}",
    normalizar: (v) => v.toUpperCase(),
  },
];

/** Etapa 01 do checkout: dados e endereço, com a opção de usar um endereço salvo da conta. */
export function AddressSection({
  address,
  onChange,
  saved,
  onUseSaved,
}: {
  address: CheckoutAddress;
  onChange: (key: keyof CheckoutAddress, valor: string) => void;
  saved?: SavedAddress[];
  onUseSaved: (address: SavedAddress) => void;
}) {
  return (
    <section>
      <h2 className="mb-6 border-b border-border pb-4 text-2xl">01 / SEUS DADOS E ENDEREÇO</h2>
      {!!saved?.length && (
        <label className="mb-6 block">
          <span className="mb-2 block text-xs">Usar endereço salvo</span>
          <select
            aria-label="Usar endereço salvo"
            className="h-12 w-full border border-input bg-background px-3 text-sm"
            defaultValue=""
            onChange={(e) => {
              const escolhido = saved.find((a) => a.id === e.target.value);
              if (escolhido) onUseSaved(escolhido);
            }}
          >
            <option value="">Preencher novo endereço</option>
            {saved.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} · {a.street}, {a.number}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {CAMPOS.map((campo) => (
          <label key={campo.key} className={campo.key === "street" ? "sm:col-span-2" : ""}>
            <span className="mb-2 block text-xs">{campo.label}</span>
            <input
              name={campo.key}
              autoComplete={campo.autoComplete}
              type={campo.type ?? "text"}
              required={campo.key !== "complement"}
              maxLength={campo.maxLength ?? 160}
              pattern={campo.pattern}
              inputMode={campo.inputMode}
              value={address[campo.key]}
              onChange={(e) =>
                onChange(campo.key, campo.normalizar?.(e.target.value) ?? e.target.value)
              }
              className="h-12 w-full border border-input bg-background px-3 text-sm outline-none focus:border-foreground"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
