import { useEffect, useRef, useState, type PointerEvent as EventoPonteiro } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, ChevronDown, Search, ShoppingBag, User, X } from "lucide-react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { abertura } from "@/lib/abertura";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";
import { usePresenca } from "@/hooks/usePresenca";
import { MENU_SUPORTE } from "./navegacao";

/** Barras do menu: pontas quadradas, em branco e preto, soltas da tela por uma sombra. */
const BARRA =
  "flex items-stretch border border-ink/10 bg-paper text-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]";
const ITEM_MENU =
  "flex cursor-pointer items-center gap-1 px-2 py-3 text-[10px] font-medium tracking-[0.15em] transition-colors md:px-5 md:py-[15px] md:text-[12px] md:tracking-[0.2em]";
const ITEM_ATIVO = "bg-ink text-paper";
const ITEM_NORMAL = "hover:bg-ink/5";
const ICONE =
  "relative grid w-9 cursor-pointer place-items-center transition-colors hover:bg-ink/5 md:w-11";
/** Cada botão da direita (busca, conta e carrinho) é uma caixa própria, separada das outras. */
const BOTAO =
  "pointer-events-auto relative grid h-[42px] cursor-pointer place-items-center border border-ink/10 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] transition-colors w-[36px] md:h-[50px] md:w-[64px]";
/** Como os itens da barra da esquerda: marcado fica preto com a bordinha branca; no hover, cinza. */
const botao = (marcado: boolean) =>
  `${BOTAO} ${
    marcado
      ? "border-paper bg-ink text-paper"
      : "bg-paper text-ink hover:bg-[color-mix(in_oklab,var(--color-ink)_5%,var(--color-paper))]"
  }`;

/**
 * A rolagem desce (some) ou sobe (aparece)? Perto do topo, o menu sempre aparece. Ignora tremidas
 * de poucos pixels.
 */
function useRolandoParaBaixo(): boolean {
  const [descendo, setDescendo] = useState(false);
  useEffect(() => {
    let ultimo = window.scrollY;
    const conferir = () => {
      const y = window.scrollY;
      if (y < 80) setDescendo(false);
      else if (y > ultimo + 6) setDescendo(true);
      else if (y < ultimo - 6) setDescendo(false);
      else return;
      ultimo = y;
    };
    window.addEventListener("scroll", conferir, { passive: true });
    return () => window.removeEventListener("scroll", conferir);
  }, []);
  return descendo;
}

/**
 * O menu fica escondido enquanto o pré-loader da home roda e aparece quando ele avisa que
 * terminou. Entrando por outra página (ou com "reduzir movimento", sem pré-loader), aparece logo.
 */
function useAberturaFeita(): boolean {
  const [feita, setFeita] = useState(false);
  useEffect(() => {
    if (abertura.feita() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFeita(true);
      return;
    }
    return abertura.aoConcluir(() => setFeita(true));
  }, []);
  return feita;
}

/**
 * Menu de todas as páginas, solto por cima delas: à esquerda, HOME, CATÁLOGO e SUPORTE; à direita,
 * busca, conta e carrinho em ícones, cada um na sua caixa. Some ao rolar para baixo e volta ao
 * rolar para cima.
 * Tem o próprio nome de View Transition (`menu-flutuante`, no styles.css): quando a página arrasta
 * para o lado (entre as páginas do menu), só o que está atrás se move e o menu fica parado na frente.
 */
export function MenuFlutuante() {
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  const { customer } = useSession();
  const { setCartOpen, cartCount } = useCart();
  const navigate = useNavigate();
  const [suporteAberto, setSuporteAberto] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const suporte = useRef<HTMLDivElement>(null);
  const fecharSuporte = useRef<number | undefined>(undefined);
  const peloMouse = useRef(false);

  const descendo = useRolandoParaBaixo();
  const pronto = useAberturaFeita();
  // com a busca ou o suporte abertos, o menu não some no meio do uso
  const suporteNaTela = usePresenca(suporteAberto, 200);
  const buscaNaTela = usePresenca(buscaAberta, 200);
  const escondido = !pronto || (descendo && !buscaAberta && !suporteAberto);

  // trocando de página, fecha o que estiver aberto
  useEffect(() => {
    setSuporteAberto(false);
    setBuscaAberta(false);
  }, [caminho]);

  // no computador, o suporte abre com o mouse em cima e fecha um instante depois que ele sai
  // (a folga deixa passar do botão para as opções sem fechar)
  const entrarNoSuporte = (e: EventoPonteiro) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(fecharSuporte.current);
    setSuporteAberto(true);
  };
  const sairDoSuporte = (e: EventoPonteiro) => {
    if (e.pointerType !== "mouse") return;
    fecharSuporte.current = window.setTimeout(() => setSuporteAberto(false), 150);
  };
  useEffect(() => () => window.clearTimeout(fecharSuporte.current), []);

  // fecha o menu de suporte ao clicar fora dele ou apertar Esc
  useEffect(() => {
    if (!suporteAberto) return;
    const fora = (e: PointerEvent) => {
      if (!suporte.current?.contains(e.target as Node)) setSuporteAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSuporteAberto(false);
    };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [suporteAberto]);

  const ativo = {
    home: caminho === "/",
    catalogo: caminho.startsWith("/catalogo"),
    suporte: caminho.startsWith("/suporte"),
    conta: caminho.startsWith("/conta") || caminho.startsWith("/login"),
  };

  return (
    <>
      <header
        inert={escondido}
        className={`pointer-events-none fixed inset-x-4 top-4 z-50 flex items-start justify-between gap-2 md:gap-3 transition duration-500 ease-out [view-transition-name:menu-flutuante] md:inset-x-6 md:top-6 ${
          escondido ? "-translate-y-[calc(100%+2rem)] opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <nav aria-label="Menu principal" className={`${BARRA} pointer-events-auto`}>
          <Link
            to="/"
            className={`${ITEM_MENU} ${ativo.home ? ITEM_ATIVO : ITEM_NORMAL}`}
            aria-current={ativo.home ? "page" : undefined}
          >
            HOME
          </Link>
          <Link
            to="/catalogo"
            className={`${ITEM_MENU} ${ativo.catalogo ? ITEM_ATIVO : ITEM_NORMAL}`}
            aria-current={ativo.catalogo ? "page" : undefined}
          >
            CATÁLOGO
          </Link>
          <div
            ref={suporte}
            className="relative flex"
            onPointerEnter={entrarNoSuporte}
            onPointerLeave={sairDoSuporte}
          >
            {/* com o mouse, quem abre é o hover (o clique não fecha); no toque e no teclado, o clique */}
            <button
              onPointerDown={(e) => (peloMouse.current = e.pointerType === "mouse")}
              onClick={() => {
                if (peloMouse.current) {
                  peloMouse.current = false;
                  setSuporteAberto(true);
                } else setSuporteAberto((aberto) => !aberto);
              }}
              aria-expanded={suporteAberto}
              className={`${ITEM_MENU} ${ativo.suporte ? ITEM_ATIVO : ITEM_NORMAL}`}
            >
              SUPORTE
              <ChevronDown className={`h-3 w-3 transition ${suporteAberto ? "rotate-180" : ""}`} />
            </button>
            {/* abre descendo e some subindo; as opções entram em sequência */}
            {suporteNaTela.montado && (
              <div
                className={`absolute left-0 top-full mt-1 min-w-full origin-top before:absolute before:inset-x-0 before:-top-[5px] before:h-[5px] border border-ink/10 bg-paper text-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] duration-200 ${
                  suporteNaTela.saindo
                    ? "animate-out fade-out slide-out-to-top-2 fill-mode-forwards"
                    : "animate-in fade-in slide-in-from-top-2"
                }`}
              >
                {MENU_SUPORTE.map((item, n) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    style={{ animationDelay: `${60 + n * 50}ms` }}
                    className="block whitespace-nowrap px-4 py-3 text-[11px] md:px-5 md:text-[12px] tracking-[0.2em] transition-[background-color,padding] duration-200 fill-mode-both animate-in fade-in slide-in-from-left-2 hover:bg-ink/5 hover:pl-5"
                  >
                    {item.label.toUpperCase()}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex flex-col items-end">
          <div className="flex gap-1 md:gap-2">
            <button
              onClick={() => setBuscaAberta((aberta) => !aberta)}
              className={botao(buscaAberta)}
              aria-label="Buscar"
              aria-expanded={buscaAberta}
            >
              {/* o ícone troca girando */}
              <span
                key={String(buscaAberta)}
                className="duration-300 animate-in spin-in-90 fade-in"
              >
                {buscaAberta ? (
                  <X className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                ) : (
                  <Search className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                )}
              </span>
            </button>
            <Link
              to={customer ? "/conta" : "/login"}
              className={botao(ativo.conta)}
              aria-current={ativo.conta ? "page" : undefined}
              aria-label="Área do cliente"
            >
              <User className="h-4 w-4 md:h-[18px] md:w-[18px]" />
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className={botao(false)}
              aria-label="Carrinho"
            >
              <ShoppingBag className="h-4 w-4 md:h-[18px] md:w-[18px]" />
              {cartCount > 0 && (
                // muda de número com um pulo (a chave nova remonta e reinicia a animação)
                <span
                  key={cartCount}
                  className="absolute -right-1.5 -top-1.5 flex duration-300 animate-in zoom-in-50 h-4 min-w-4 items-center justify-center border border-paper bg-ink px-0.5 text-[9px] font-bold text-paper"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* a busca desce de baixo dos botões e sobe ao fechar */}
          {buscaNaTela.montado && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setBuscaAberta(false);
                void navigate({ to: "/busca", search: { q: termo.trim() } });
              }}
              className={`${BARRA} pointer-events-auto mt-2 w-[min(300px,calc(100vw-2rem))] origin-top-right duration-200 ${
                buscaNaTela.saindo
                  ? "animate-out fade-out slide-out-to-top-2 fill-mode-forwards"
                  : "animate-in fade-in slide-in-from-top-2 zoom-in-95"
              }`}
            >
              <input
                autoFocus
                aria-label="Buscar produtos"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar produtos..."
                onKeyDown={(e) => {
                  if (e.key === "Escape") setBuscaAberta(false);
                }}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-xs outline-none placeholder:text-ink/40"
              />
              <button
                type="submit"
                className={`${ICONE} border-l border-ink/10`}
                aria-label="Buscar"
              >
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </header>

      <CartDrawer />
    </>
  );
}
