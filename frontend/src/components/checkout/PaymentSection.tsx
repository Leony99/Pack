import type { getPaymentMethods } from "@/lib/api";

type Metodo = Awaited<ReturnType<typeof getPaymentMethods>>[number];

/** Etapa 03 do checkout: escolher Pix ou cartão. Os dados do cartão nunca passam por aqui. */
export function PaymentSection({
  methods,
  value,
  onChange,
}: {
  methods: readonly Metodo[];
  value: Metodo["id"];
  onChange: (id: Metodo["id"]) => void;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-6 border-b border-border pb-4 text-2xl">03 / PAGAMENTO</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {methods.map((method) => (
          <label
            key={method.id}
            className="flex cursor-pointer items-center gap-3 border border-input p-4"
          >
            <input
              type="radio"
              name="payment"
              checked={value === method.id}
              onChange={() => onChange(method.id)}
              className="accent-foreground"
            />
            <span className="text-sm">
              {method.label}
              <span className="mt-1 block text-xs text-muted-foreground">{method.detail}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Não informe dados de cartão. O pagamento real será realizado em ambiente seguro após a
        integração.
      </p>
    </section>
  );
}
