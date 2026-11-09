import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Barra de busca que desce por baixo do cabeçalho. Fechada, fica com altura zero e "inert"
 * (fora do Tab e do leitor de tela). Buscar leva a /busca?q=termo.
 */
export function SearchBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [termo, setTermo] = useState("");
  const navigate = useNavigate();

  return (
    <div
      inert={!open}
      className={`overflow-hidden border-border bg-background transition-all duration-300 ease-out ${
        open ? "max-h-24 border-t opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
          void navigate({ to: "/busca", search: { q: termo.trim() } });
        }}
        className="mx-auto flex max-w-[1400px] items-center gap-3 px-6 py-4"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          autoFocus={open}
          aria-label="Buscar produtos"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          type="text"
          placeholder="Buscar produtos..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" variant="ghost" size="icon" aria-label="Buscar">
          <Search />
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label="Fechar busca"
        >
          <X className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
