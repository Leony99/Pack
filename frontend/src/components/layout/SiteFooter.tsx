import { Link } from "@tanstack/react-router";
import { MENU_CATEGORIAS, MENU_ESTILOS, MENU_SUPORTE } from "./navegacao";

const POLITICAS = [
  { label: "Política de troca", to: "/politicas/troca" },
  { label: "Política de envio", to: "/politicas/envio" },
  { label: "Política de privacidade", to: "/politicas/privacidade" },
  { label: "Termos de uso", to: "/politicas/termos" },
] as const;

/** Colunas de links simples (suporte e políticas). */
const COLUNAS = [
  { title: "SUPORTE", links: MENU_SUPORTE },
  { title: "POLÍTICAS", links: POLITICAS },
];

const TITULO_DA_COLUNA = "text-xs font-medium tracking-[0.3em] text-muted-foreground";
const LINK = "cursor-pointer hover:opacity-60";

/** Rodapé: marca e newsletter, as categorias de cada estilo, suporte e políticas. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="px-4 py-16 md:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div>
            {/* o nome na altura de uma linha de título, para os links ficarem na mesma linha dos
                das outras colunas */}
            <p className="font-display text-2xl leading-4 tracking-[0.3em]">PACK</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/newsletter" search={{ confirmed: false }} className={LINK}>
                  Newsletter
                </Link>
              </li>
            </ul>
          </div>
          {MENU_ESTILOS.map((estilo) => (
            <div key={estilo.style}>
              <p className={TITULO_DA_COLUNA}>{estilo.label}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {MENU_CATEGORIAS.map((categoria) => (
                  <li key={categoria.label}>
                    <Link
                      to="/catalogo/$style/$type"
                      params={{ style: estilo.style, type: categoria.type }}
                      className={LINK}
                    >
                      {categoria.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {COLUNAS.map((coluna) => (
            <div key={coluna.title}>
              <p className={TITULO_DA_COLUNA}>{coluna.title}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {coluna.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className={LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:justify-between">
          <p>© 2026 PACK. Todos os direitos reservados.</p>
          <p className="tracking-wider">BUILT IN BLACK · MADE IN BR</p>
        </div>
      </div>
    </footer>
  );
}
