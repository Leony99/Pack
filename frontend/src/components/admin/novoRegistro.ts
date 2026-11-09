import type { AdminRecord } from "@/lib/api";
import type { AdminData, AdminView } from "./tipos";

/** Registro em branco para o botão "NOVO ..." de cada tela. */
export function newRecord(view: AdminView, data: AdminData): AdminRecord {
  if (view === "products")
    return {
      id: "",
      name: "",
      price: 0,
      // começa com a primeira imagem da biblioteca, para o produto já ter uma capa
      image: data.products[0]?.image ?? "",
      images: [data.products[0]?.image ?? ""],
      color: "BLACK",
      styles: ["treino"],
      type: "camisetas",
      tags: [],
      stock: { PP: 0, P: 0, M: 0, G: 0, GG: 0 },
      active: true,
      description: "",
    };
  if (view === "collections") return { id: "", name: "", tag: "", description: "" };
  if (view === "coupons") return { code: "", discount: 10, type: "percent", validUntil: null };
  return { id: "", name: "", email: "", role: "operacao", active: true };
}

/** Rótulo do botão "NOVO ..." nas telas que têm cadastro. */
export const NOVO: Partial<Record<AdminView, string>> = {
  products: "PRODUTO",
  collections: "COLEÇÃO",
  coupons: "CUPOM",
  staff: "COLABORADOR",
};
