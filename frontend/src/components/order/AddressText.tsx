import type { SavedAddress } from "@/data/dashboard";

/** Endereço em quatro linhas: destinatário, rua, bairro/cidade e CEP. */
export function AddressText({ address }: { address?: SavedAddress }) {
  if (!address) return null;
  return (
    <p className="text-sm leading-7">
      {address.name}
      <br />
      {address.street}, {address.number} {address.complement}
      <br />
      {address.neighborhood} · {address.city}/{address.state}
      <br />
      CEP {address.cep}
    </p>
  );
}
