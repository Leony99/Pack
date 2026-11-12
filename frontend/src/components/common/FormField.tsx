import type { InputHTMLAttributes } from "react";

/** Campo de texto com o rótulo em cima, no visual dos formulários da loja. */
export function FormField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
      <input
        {...props}
        className="h-11 w-full border border-input bg-background px-3 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
