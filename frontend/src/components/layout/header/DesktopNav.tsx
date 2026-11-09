import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { MENU_CATEGORIAS, MENU_ESTILOS, MENU_SUPORTE } from "../navegacao";
import type { ItemType, Style } from "@/data/types";

type Aberto = Style | "suporte" | null;

const ITEM =
  "block w-full cursor-pointer px-5 py-3 text-left text-sm tracking-wider hover:bg-secondary";

/** Menu do computador: catálogo e os menus suspensos de estilos e suporte, que abrem com o mouse. */
export function DesktopNav({
  onCategory,
  onLink,
}: {
  onCategory: (style: Style, type: ItemType) => void;
  onLink: (to: (typeof MENU_SUPORTE)[number]["to"]) => void;
}) {
  const [aberto, setAberto] = useState<Aberto>(null);

  return (
    <nav className="hidden gap-2 text-sm font-medium tracking-wider md:flex">
      <Link to="/catalogo" className="cursor-pointer px-3 py-2 hover:opacity-60">
        CATÁLOGO
      </Link>

      {MENU_ESTILOS.map((g) => (
        <Dropdown
          key={g.style}
          label={g.label}
          open={aberto === g.style}
          onOpen={setAberto}
          id={g.style}
        >
          {MENU_CATEGORIAS.map((t) => (
            <button
              key={t.type}
              onClick={() => {
                setAberto(null);
                onCategory(g.style, t.type);
              }}
              className={ITEM}
            >
              {t.label}
            </button>
          ))}
        </Dropdown>
      ))}

      <Dropdown label="SUPORTE" open={aberto === "suporte"} onOpen={setAberto} id="suporte">
        {MENU_SUPORTE.map((l) => (
          <button
            key={l.to}
            onClick={() => {
              setAberto(null);
              onLink(l.to);
            }}
            className={ITEM}
          >
            {l.label}
          </button>
        ))}
      </Dropdown>
    </nav>
  );
}

function Dropdown({
  id,
  label,
  open,
  onOpen,
  children,
}: {
  id: Exclude<Aberto, null>;
  label: string;
  open: boolean;
  onOpen: (aberto: Aberto) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative" onMouseEnter={() => onOpen(id)} onMouseLeave={() => onOpen(null)}>
      <button className="flex cursor-pointer items-center gap-1 px-3 py-2 hover:opacity-60">
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full min-w-[200px] animate-in fade-in slide-in-from-top-2 border border-border bg-background shadow-lg duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
