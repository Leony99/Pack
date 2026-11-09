import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";
import type { ItemType, Style } from "@/data/types";
import { AnnouncementBar } from "./header/AnnouncementBar";
import { DesktopNav } from "./header/DesktopNav";
import { MobileMenu } from "./header/MobileMenu";
import { SearchBar } from "./header/SearchBar";
import type { MENU_SUPORTE } from "./navegacao";

/**
 * Topo de todas as páginas: faixa de avisos, cabeçalho fixo (menus, logo, busca, conta e carrinho),
 * a barra de busca, o menu do celular e a gaveta do carrinho.
 */
export function SiteHeader() {
  const { customer } = useSession();
  const { setCartOpen, cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const abrirCategoria = (style: Style, type: ItemType) => {
    setMenuOpen(false);
    void navigate({ to: "/catalogo/$style/$type", params: { style, type } });
  };
  const abrirLink = (to: "/catalogo" | (typeof MENU_SUPORTE)[number]["to"]) => {
    setMenuOpen(false);
    void navigate({ to });
  };

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
          <button
            onClick={() => setMenuOpen(true)}
            className="cursor-pointer md:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <DesktopNav onCategory={abrirCategoria} onLink={abrirLink} />

          <Link
            to="/"
            className="cursor-pointer font-display text-3xl tracking-[0.3em] md:text-4xl"
          >
            PACK
          </Link>

          <div className="flex items-center gap-5">
            <button
              onClick={() => setSearchOpen((aberta) => !aberta)}
              className="cursor-pointer hover:opacity-60"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              to={customer ? "/conta" : "/login"}
              className="cursor-pointer hover:opacity-60"
              aria-label="Profile"
            >
              <User className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative cursor-pointer hover:opacity-60"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-foreground text-[10px] font-bold text-background">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
      </header>

      {menuOpen && (
        <MobileMenu
          onClose={() => setMenuOpen(false)}
          onCatalog={() => abrirLink("/catalogo")}
          onCategory={abrirCategoria}
          onLink={abrirLink}
        />
      )}

      <CartDrawer />
    </>
  );
}
