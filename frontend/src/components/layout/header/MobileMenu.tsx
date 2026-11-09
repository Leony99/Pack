import { X } from "lucide-react";
import { MENU_CATEGORIAS, MENU_ESTILOS, MENU_SUPORTE } from "../navegacao";
import type { ItemType, Style } from "@/data/types";

const SUBITEM = "cursor-pointer text-left text-lg text-muted-foreground";

/** Menu do celular, em tela cheia, com os mesmos destinos do menu do computador. */
export function MobileMenu({
  onClose,
  onCatalog,
  onCategory,
  onLink,
}: {
  onClose: () => void;
  onCatalog: () => void;
  onCategory: (style: Style, type: ItemType) => void;
  onLink: (to: (typeof MENU_SUPORTE)[number]["to"]) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 animate-in fade-in bg-background p-6 duration-200 md:hidden">
      <div className="flex items-center justify-between">
        <p className="font-display text-3xl tracking-[0.3em]">PACK</p>
        <button onClick={onClose} className="cursor-pointer" aria-label="Fechar menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="mt-12 flex flex-col gap-8">
        <button onClick={onCatalog} className="cursor-pointer text-left font-display text-4xl">
          CATÁLOGO
        </button>
        {MENU_ESTILOS.map((g) => (
          <div key={g.style}>
            <p className="font-display text-4xl">{g.label}</p>
            <div className="mt-3 flex flex-col gap-2 pl-1">
              {MENU_CATEGORIAS.map((t) => (
                <button
                  key={t.type}
                  onClick={() => onCategory(g.style, t.type)}
                  className={SUBITEM}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <p className="font-display text-4xl">SUPORTE</p>
          <div className="mt-3 flex flex-col gap-2 pl-1">
            {MENU_SUPORTE.map((l) => (
              <button key={l.to} onClick={() => onLink(l.to)} className={SUBITEM}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
