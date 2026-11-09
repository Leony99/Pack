import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Botões de editar e excluir de uma linha das tabelas do painel. */
export function RowActions({
  onEdit,
  onDelete,
  disabled,
}: {
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Editar registro"
        title="Editar"
        disabled={disabled}
        onClick={onEdit}
      >
        <Pencil />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Excluir registro"
        title="Excluir"
        disabled={disabled}
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
