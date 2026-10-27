# Peças de desenho compartilhadas pelos diagramas de fluxo (gen_fluxo_*.py)
#
# Marcação usada nas linhas de código:
#   [a|x] atributo/variável   [m|x] método      [s|x] string
#   [k|x] anotação/keyword    [e|x] exceção     [c|x] comentário
#   "  @@id"  no fim da linha  → seta dessa linha até a caixa "id"
#   "  @@!id" no fim da linha  → seta tracejada (exceção propagada)

import re
import xml.sax.saxutils as su

MONO = "JetBrains Mono, Consolas, monospace"
SANS = "Segoe UI, Helvetica, Arial, sans-serif"
FS, LH, HH = 12, 17, 30          # fonte, altura de linha, altura do cabeçalho
PADT, PADB, PADX = 10, 12, 14
CW, TCW = 7.3, 7.9               # largura aproximada de um caractere (código / título)

BG = "#ffffff"
TXT = "#1f2328"
BORDER = "#3a3f5c"
ARROW = "#3a3f5c"
ARROW_ERR = "#c4122f"
COL = {"a": "#1a7f37", "m": "#0b3fd6", "s": "#c4122f",
       "k": "#8250df", "e": "#b35400", "c": "#6e7781"}
STYLE = {  # (fundo do cabeçalho, cor do título)
    "code":  ("#ececfb", "#1f3fbf"),
    "data":  ("#e6f4ea", "#1a5d2a"),
    "error": ("#fdecec", "#b42318"),
    "pkg":   ("#fff4dc", "#8a5a00"),
}
LEGEND = [("a", "Atributos / variáveis"), ("m", "Métodos"), ("s", "Strings"),
          ("k", "Anotações / palavras-chave"), ("e", "Exceções"), ("c", "Comentários")]

TOK = re.compile(r"\[([amskec])\|(.*?)\]")
TARGET = re.compile(r"\s+@@(!?)(\w+)$")


def plain(s):
    return TOK.sub(lambda m: m.group(2), s)


def spans(s, default):
    out, pos = [], 0
    for m in TOK.finditer(s):
        if m.start() > pos:
            out.append((s[pos:m.start()], default))
        out.append((m.group(2), COL[m.group(1)]))
        pos = m.end()
    if pos < len(s):
        out.append((s[pos:], default))
    return out


def text(x, y, s, default=TXT, size=FS, family=MONO, weight="400", anchor="start"):
    inner = "".join(f'<tspan fill="{c}">{su.escape(t)}</tspan>' for t, c in spans(s, default) if t)
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-size="{size}" '
            f'font-weight="{weight}" text-anchor="{anchor}" xml:space="preserve">{inner}</text>')


def section(x, y, title, subtitle=""):
    out = text(x, y, title, size=17, family=SANS, weight="700")
    if subtitle:
        out += "\n" + text(x, y + 20, subtitle, default=COL["c"], size=13, family=SANS)
    return out


class Box:
    def __init__(self, id, title, lines, style="code"):
        self.id, self.title, self.style = id, title, style
        self.lines, self.targets = [], []
        for i, raw in enumerate(lines):
            m = TARGET.search(raw)
            if m:
                self.targets.append((i, m.group(2), m.group(1) == "!"))
                raw = raw[:m.start()]
            self.lines.append(raw)
        self.need_w = max([len(plain(title)) * TCW + 40] +
                          [len(plain(l)) * CW + 2 * PADX for l in self.lines])
        self.h = HH + PADT + len(self.lines) * LH + PADB
        self.x = self.y = self.w = 0

    @property
    def right(self):  return self.x + self.w
    @property
    def bottom(self): return self.y + self.h
    @property
    def cx(self):     return self.x + self.w / 2
    @property
    def head_mid(self): return self.y + HH / 2

    def line_mid(self, i):
        return self.y + HH + PADT + i * LH + LH / 2 + 1

    def target_line(self, target):
        return next(self.line_mid(i) for i, t, _ in self.targets if t == target)

    def svg(self):
        hb, tc = STYLE[self.style]
        x, y, r, w, h = self.x, self.y, self.right, self.w, self.h
        p = [f'<rect x="{x+2}" y="{y+2}" width="{w}" height="{h}" rx="5" fill="#000" fill-opacity="0.06"/>',
             f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="#fff" stroke="{BORDER}" stroke-width="1.2"/>',
             f'<path d="M{x+0.6},{y+HH} V{y+5} Q{x+0.6},{y+0.6} {x+5},{y+0.6} '
             f'H{r-5} Q{r-0.6},{y+0.6} {r-0.6},{y+5} V{y+HH} Z" fill="{hb}"/>',
             f'<line x1="{x}" y1="{y+HH}" x2="{r}" y2="{y+HH}" stroke="{BORDER}" stroke-width="1"/>',
             text(self.cx, y + 20, self.title, default=tc, size=14, family=SANS, weight="600", anchor="middle")]
        for i, l in enumerate(self.lines):
            p.append(text(x + PADX, y + HH + PADT + i * LH + 12, l))
        return "\n".join(p)


def path(points, error=False):
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in points)
    color, marker = (ARROW_ERR, "arr-err") if error else (ARROW, "arr")
    dash = ' stroke-dasharray="6 4"' if error else ""
    return (f'<path d="{d}" fill="none" stroke="{color}" stroke-width="1.3"{dash} marker-end="url(#{marker})"/>'
            f'<circle cx="{points[0][0]:.1f}" cy="{points[0][1]:.1f}" r="2.6" fill="{color}"/>')


def elbow(x1, y1, x2, y2, lane, error=False):
    """Seta em L: horizontal até o corredor (lane), vertical, horizontal até o destino."""
    if abs(y1 - y2) < 0.5:
        return path([(x1, y1), (x2, y2)], error)
    return path([(x1, y1), (lane, y1), (lane, y2), (x2, y2)], error)


def down(a, b, error=False):
    return path([(a.cx, a.bottom), (b.cx, b.y)], error)


LEGEND_W = 300
LEGEND_H = HH + 12 + (len(LEGEND) + 2) * 22 + 6


def legend(x, y):
    w, h = LEGEND_W, LEGEND_H
    p = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="#fff" stroke="{BORDER}" stroke-width="1.2"/>',
         f'<rect x="{x+0.6}" y="{y+0.6}" width="{w-1.2}" height="{HH}" rx="4.5" fill="#f3f4f6"/>',
         f'<line x1="{x}" y1="{y+HH}" x2="{x+w}" y2="{y+HH}" stroke="{BORDER}"/>',
         text(x + w / 2, y + 20, "LEGENDA", size=13, family=SANS, weight="700", anchor="middle")]
    ry = y + HH + 12
    for k, label in LEGEND:
        c = COL[k]
        p.append(f'<rect x="{x+16}" y="{ry}" width="26" height="14" rx="3" fill="{c}" fill-opacity="0.14" stroke="{c}"/>')
        p.append(text(x + 52, ry + 11, label, default=c, size=13, family=SANS, weight="600"))
        ry += 22
    p.append(path([(x + 18, ry + 7), (x + 42, ry + 7)]))
    p.append(text(x + 52, ry + 11, "chamada / próximo passo", size=13, family=SANS))
    ry += 22
    p.append(path([(x + 18, ry + 7), (x + 42, ry + 7)], error=True))
    p.append(text(x + 52, ry + 11, "exceção propagada", default=ARROW_ERR, size=13, family=SANS))
    return "\n".join(p)


COL_GAP = 110      # corredor entre colunas, onde passam as setas
GAP_SEQ = 44       # espaço entre caixas em sequência (seta para baixo)
GAP_ALIGNED = 18   # espaço mínimo entre caixas alinhadas com quem as chama


def layout(sections, x0=24, y0=34):
    """sections: lista de (título, subtítulo, colunas); colunas = lista de listas de Box.
    As colunas têm a mesma largura em todas as seções. Uma caixa que é alvo de "@@id" fica
    na altura da linha que a chama; as demais ficam em sequência. A legenda ocupa o topo
    da última coluna da primeira seção. Devolve (partes svg, seções de caixas, largura, altura)."""
    ncol = max(len(cols) for _, _, cols in sections)
    widths = []
    for k in range(ncol):
        ws = [b.need_w for _, _, cols in sections if k < len(cols) for b in cols[k]]
        widths.append(max(ws + ([LEGEND_W] if k == ncol - 1 else [])))
    xs, x = [], x0
    for w in widths:
        xs.append(x)
        x += w + COL_GAP
    width = int(x - COL_GAP + x0)

    parts, placed_sections, y = [], [], y0
    for s_idx, (title, subtitle, cols) in enumerate(sections):
        top = y + 46 if title else y
        if title:
            parts.append(section(x0, y, title, subtitle))
        placed = []
        for k, col in enumerate(cols):
            cursor = top
            if s_idx == 0 and k == ncol - 1:
                parts.append(legend(xs[k], top))
                cursor = top + LEGEND_H + 30
            prev = None
            for b in col:
                b.x, b.w = xs[k], widths[k]
                srcs = [s.line_mid(i) for s in placed for i, t, _ in s.targets if t == b.id]
                if srcs:
                    b.y = max(cursor if prev is None else prev.bottom + GAP_ALIGNED, min(srcs) - HH / 2)
                else:
                    b.y = cursor if prev is None else prev.bottom + GAP_SEQ
                placed.append(b)
                prev = b
        placed_sections.append(placed)
        y = max(b.bottom for b in placed) + 70

    height = int(y - 70 + 30)
    all_boxes = [b for sec in placed_sections for b in sec]
    rects = [(b.id, b.x, b.y, b.w, b.h) for b in all_boxes] + [("legenda", xs[-1], y0 + 46, LEGEND_W, LEGEND_H)]
    check_overlap(rects)
    return parts, placed_sections, width, height


def auto_arrows(boxes, sequence=(), error_sequence=()):
    """Setas das linhas marcadas com "@@id" até a caixa da coluna seguinte (alvos fora de
    `boxes` são ignorados) + setas para baixo entre os pares de `sequence`."""
    by_id = {b.id: b for b in boxes}
    links = [(s.line_mid(i), s, by_id[t], e) for s in boxes for i, t, e in s.targets if t in by_id]
    out, entries = [], {}
    for tx in sorted({t.x for _, _, t, _ in links}):
        group = sorted((l for l in links if l[2].x == tx), key=lambda l: l[0])
        step = min(12, (COL_GAP - 30) / max(1, len(group) - 1))  # todas as faixas cabem no corredor
        for n, (y1, s, t, e) in enumerate(group):
            if not (0 < t.x - s.right <= COL_GAP + 1):
                raise SystemExit(f"seta {s.id} → {t.id} precisa ir para a coluna seguinte")
            k = entries.get(t.id, 0)
            entries[t.id] = k + 1
            y2 = t.head_mid if k == 0 else t.y + HH + PADT + (k + 0.5) * LH
            out.append(elbow(s.right, y1, t.x, y2, tx - 16 - n * step, e))
    out += [down(by_id[a], by_id[b]) for a, b in sequence]
    out += [down(by_id[a], by_id[b], error=True) for a, b in error_sequence]
    return out


def check_overlap(rects):
    """rects: lista de (nome, x, y, w, h). Interrompe se duas áreas se sobrepõem."""
    for i, (n1, x1, y1, w1, h1) in enumerate(rects):
        for n2, x2, y2, w2, h2 in rects[i + 1:]:
            if x1 < x2 + w2 and x2 < x1 + w1 and y1 < y2 + h2 and y2 < y1 + h1:
                raise SystemExit(f"sobreposição: {n1} e {n2}")


def render(w, h, parts):
    head = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
            '<defs>',
            f'<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="{ARROW}"/></marker>',
            f'<marker id="arr-err" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="{ARROW_ERR}"/></marker>',
            '</defs>',
            f'<rect width="{w}" height="{h}" fill="{BG}"/>']
    return "\n".join(head + parts + ['</svg>'])
