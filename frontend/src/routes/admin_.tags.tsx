import { createFileRoute } from "@tanstack/react-router";
import { TagsPanel } from "@/components/admin/TagsPanel";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/admin_/tags")({
  head: () =>
    pageHead("Administrar tags", "Administração das tags e dos filtros do catálogo da loja PACK.", {
      robots: "noindex, nofollow",
    }),
  component: Page,
});
function Page() {
  return <TagsPanel />;
}
