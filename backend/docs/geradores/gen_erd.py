# Gera docs/erd.svg — ERD organizado por zona de domínio
# Uso: python docs/geradores/gen_erd.py

from pathlib import Path

TW = 210   # table width
RH = 21    # row height
HH = 27    # header height

BG        = "#0d1117"
T_BORDER  = "#1f3a5f"
T_HEAD    = "#1a3358"
T_ROW1    = "#0f1925"
T_ROW2    = "#111e2b"
C_NAME    = "#58a6ff"
C_TYPE    = "#6e7681"
C_FIELD   = "#c9d1d9"
C_PK      = "#ffa657"
C_FK      = "#79c0ff"
C_UK      = "#a5d6ff"
REL_COLOR = "#2d5080"

CANVAS_W = 2040
CANVAS_H = 830

# Zonas com as cores da estrutura de pacotes. STAFF, CUSTOMER e PRODUCT ocupam a altura toda;
# CART fica a nordeste do cliente e ORDER a sudeste, embaixo do CART.
ZONES = [  # (rótulo, fundo, cor do rótulo/borda, altura toda?, entidades)
    ("STAFF",    "#0d1a2e", "#79c0ff", True,  ["STAFF", "ROLE", "PERMISSION", "ROLE_PERMISSION"]),
    ("CUSTOMER", "#0e1f1a", "#3bca6d", True,  ["CUSTOMER", "ADDRESS"]),
    ("CART",     "#1a0f1a", "#d2a8ff", False, ["CART", "CART_ITEM"]),
    ("ORDER",    "#1a1506", "#ffa657", False, ["COUPON", "ORDER", "PAYMENT", "SHIPMENT", "ORDER_ITEM"]),
    ("PRODUCT",  "#0d1a0d", "#58a6ff", True,  ["PRODUCT", "PRODUCT_IMAGE", "PRODUCT_TAG", "PRODUCT_TAG_LINK",
                                                "PRODUCT_VARIANT", "INVENTORY_MOVEMENT", "SIZE", "COLOR"]),
]
ZONE_TOP, ZONE_BOTTOM, ZONE_PAD = 90, 805, 10

def th(n):
    return HH + n * RH

TABLES = {
    "STAFF":              [("uuid","id","PK"),("string","nome",""),("string","email","UK"),("string","senha_hash",""),("uuid","role_id","FK")],
    "CUSTOMER":           [("uuid","id","PK"),("string","nome",""),("string","email","UK"),("string","senha_hash",""),("string","telefone",""),("datetime","criado_em","")],
    "CART":               [("uuid","id","PK"),("uuid","customer_id","FK"),("datetime","atualizado_em","")],
    "ROLE":               [("uuid","id","PK"),("string","nome","UK")],
    "PERMISSION":         [("uuid","id","PK"),("string","nome","UK")],
    "ROLE_PERMISSION":    [("uuid","id","PK"),("uuid","role_id","FK"),("uuid","permission_id","FK")],
    "ADDRESS":            [("uuid","id","PK"),("uuid","customer_id","FK"),("string","cep",""),("string","rua",""),("string","numero",""),("string","complemento",""),("string","cidade",""),("string","estado","")],
    "ORDER":              [("uuid","id","PK"),("uuid","customer_id","FK"),("uuid","coupon_id","FK"),("decimal","total",""),("string","status",""),("string","endereco_cep",""),("string","endereco_rua",""),("string","endereco_numero",""),("string","endereco_cidade",""),("string","endereco_estado",""),("datetime","criado_em","")],
    "ORDER_ITEM":         [("uuid","id","PK"),("uuid","order_id","FK"),("uuid","variant_id","FK"),("string","variant_sku",""),("int","quantidade",""),("decimal","preco_unit","")],
    "PAYMENT":            [("uuid","id","PK"),("uuid","order_id","FK"),("string","metodo",""),("string","status",""),("decimal","valor","")],
    "SHIPMENT":           [("uuid","id","PK"),("uuid","order_id","FK"),("string","transportadora",""),("string","codigo_rastreio",""),("string","status","")],
    "COUPON":             [("uuid","id","PK"),("string","codigo","UK"),("decimal","desconto",""),("string","tipo",""),("datetime","validade","")],
    "CART_ITEM":          [("uuid","id","PK"),("uuid","cart_id","FK"),("uuid","variant_id","FK"),("int","quantidade","")],
    "PRODUCT":            [("uuid","id","PK"),("string","nome",""),("text","descricao",""),("decimal","preco",""),("string","slug","UK"),("datetime","criado_em","")],
    "PRODUCT_VARIANT":    [("uuid","id","PK"),("uuid","product_id","FK"),("uuid","size_id","FK"),("uuid","color_id","FK"),("string","sku","UK"),("decimal","preco",""),("int","quant","")],
    "PRODUCT_IMAGE":      [("uuid","id","PK"),("uuid","product_id","FK"),("string","url",""),("int","ordem","")],
    "PRODUCT_TAG":        [("uuid","id","PK"),("string","tag","UK")],
    "PRODUCT_TAG_LINK":   [("uuid","id","PK"),("uuid","product_id","FK"),("uuid","tag_id","FK")],
    "SIZE":               [("uuid","id","PK"),("string","label","UK")],
    "COLOR":              [("uuid","id","PK"),("string","nome","UK"),("string","hex","")],
    "INVENTORY_MOVEMENT": [("uuid","id","PK"),("uuid","variant_id","FK"),("string","variant_sku",""),("string","tipo_movimentacao",""),("int","quantidade",""),("string","motivo",""),("datetime","data","")],
}

# Layout de posições (x, y)
# STAFF       | CUSTOMER |  CART:  CART       CART_ITEM          | PRODUCT
# STAFF       |          |                                       | PRODUCT   PRODUCT_IMAGE  PRODUCT_TAG
# ROLE  PERM  | CUSTOMER |  ORDER: COUPON     PAYMENT            | VARIANT   INVENTORY      TAG_LINK
#  ROLE_PERM  | ADDRESS  |         ORDER      SHIPMENT           | SIZE      COLOR
#             |          |                    ORDER_ITEM         |

POS = {
    "STAFF":              (30,   124),
    "ROLE":               (30,   314),
    "PERMISSION":         (270,  314),
    "ROLE_PERMISSION":    (150,  440),

    "CUSTOMER":           (540,  280),
    "ADDRESS":            (540,  470),

    "CART":               (810,  124),
    "CART_ITEM":          (1050, 124),

    "COUPON":             (810,  314),
    "ORDER":              (810,  476),
    "PAYMENT":            (1050, 314),
    "SHIPMENT":           (1050, 476),
    "ORDER_ITEM":         (1050, 638),

    "PRODUCT":            (1320, 124),
    "PRODUCT_IMAGE":      (1560, 124),
    "PRODUCT_TAG":        (1800, 124),
    "PRODUCT_TAG_LINK":   (1800, 249),
    "PRODUCT_VARIANT":    (1320, 330),
    "INVENTORY_MOVEMENT": (1570, 330),
    "SIZE":               (1320, 560),
    "COLOR":              (1570, 560),
}

def h(name):
    return th(len(TABLES[name]))

def top(name):
    x, y = POS[name]
    return (x + TW // 2, y)

def bottom(name):
    x, y = POS[name]
    return (x + TW // 2, y + h(name))

def left(name, row=None):
    x, y = POS[name]
    if row is None:
        return (x, y + h(name) // 2)
    return (x, y + HH + row * RH + RH // 2)

def right(name, row=None):
    x, y = POS[name]
    if row is None:
        return (x + TW, y + h(name) // 2)
    return (x + TW, y + HH + row * RH + RH // 2)

def badge_color(b):
    if b == "PK": return C_PK
    if b == "FK": return C_FK
    if b == "UK": return C_UK
    return ""

def render_table(name):
    x, y = POS[name]
    fields = TABLES[name]
    height = th(len(fields))
    lines = [f'<g transform="translate({x},{y})">']
    lines.append(f'  <rect x="3" y="3" width="{TW}" height="{height}" rx="6" fill="rgba(0,0,0,0.3)"/>')
    lines.append(f'  <rect width="{TW}" height="{height}" rx="6" fill="{T_ROW1}" stroke="{T_BORDER}" stroke-width="1.5"/>')
    lines.append(f'  <rect width="{TW}" height="{HH}" rx="6" fill="{T_HEAD}"/>')
    lines.append(f'  <rect y="{HH-6}" width="{TW}" height="6" fill="{T_HEAD}"/>')
    lines.append(f'  <text x="{TW//2}" y="{HH-6}" text-anchor="middle" font-family="JetBrains Mono,Fira Code,monospace" font-size="11" font-weight="700" fill="{C_NAME}">{name}</text>')
    for i, (typ, fname, badge) in enumerate(fields):
        ry = HH + i * RH
        fill = T_ROW1 if i % 2 == 0 else T_ROW2
        is_last = (i == len(fields) - 1)
        if is_last:
            lines.append(f'  <path d="M0,{ry} h{TW} v{RH-6} q0,6 -6,6 h-{TW-12} q-6,0 -6,-6 z" fill="{fill}"/>')
        else:
            lines.append(f'  <rect y="{ry}" width="{TW}" height="{RH}" fill="{fill}"/>')
        lines.append(f'  <line x1="1" y1="{ry}" x2="{TW-1}" y2="{ry}" stroke="{T_BORDER}" stroke-width="0.4" opacity="0.5"/>')
        lines.append(f'  <text x="8" y="{ry+14}" font-family="JetBrains Mono,Fira Code,monospace" font-size="9" fill="{C_TYPE}">{typ}</text>')
        lines.append(f'  <text x="68" y="{ry+14}" font-family="JetBrains Mono,Fira Code,monospace" font-size="10" fill="{C_FIELD}">{fname}</text>')
        if badge:
            bc = badge_color(badge)
            lines.append(f'  <text x="{TW-8}" y="{ry+14}" text-anchor="end" font-family="JetBrains Mono,Fira Code,monospace" font-size="9" font-weight="700" fill="{bc}">{badge}</text>')
    lines.append('</g>')
    return "\n".join(lines)

def bezier(p1, p2, color=REL_COLOR):
    x1, y1 = p1
    x2, y2 = p2
    mx = (x1 + x2) // 2
    return f'<path d="M{x1},{y1} C{mx},{y1} {mx},{y2} {x2},{y2}" stroke="{color}" stroke-width="1.1" fill="none" opacity="0.75"/>'

def straight(p1, p2, color=REL_COLOR):
    x1, y1 = p1
    x2, y2 = p2
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.1" opacity="0.75"/>'

def dot(p, color=REL_COLOR):
    x, y = p
    return f'<circle cx="{x}" cy="{y}" r="2.5" fill="{color}" opacity="0.85"/>'

def conn(p1, p2, color=REL_COLOR):
    x1, y1 = p1
    x2, y2 = p2
    parts = []
    if abs(x1 - x2) < 4:
        parts.append(straight(p1, p2, color))
    else:
        parts.append(bezier(p1, p2, color))
    parts.append(dot(p1, color))
    parts.append(dot(p2, color))
    return "\n".join(parts)

def route(points, color=REL_COLOR):
    """Linha em ângulo reto passando pelos pontos dados (usada entre zonas, pelos corredores)."""
    d = "M" + " L".join(f"{x},{y}" for x, y in points)
    return "\n".join([f'<path d="{d}" stroke="{color}" stroke-width="1.1" fill="none" opacity="0.75"/>',
                      dot(points[0], color), dot(points[-1], color)])

# Relacionamentos
rels = []
def add(p1, p2): rels.append(conn(p1, p2))

# Dentro de cada zona
add(right("STAFF", 4),          left("ROLE"))
add(bottom("ROLE"),             left("ROLE_PERMISSION", 1))
add(bottom("PERMISSION"),       right("ROLE_PERMISSION", 2))

add(bottom("CUSTOMER"),         top("ADDRESS"))

add(bottom("PRODUCT"),          top("PRODUCT_VARIANT"))
add(right("PRODUCT"),           left("PRODUCT_IMAGE", 1))
add(right("PRODUCT"),           left("PRODUCT_TAG_LINK", 1))
add(bottom("PRODUCT_TAG"),      top("PRODUCT_TAG_LINK"))
add(right("PRODUCT_VARIANT", 1), left("INVENTORY_MOVEMENT", 1))
add((POS["PRODUCT_VARIANT"][0] + TW//2 - 30, POS["PRODUCT_VARIANT"][1] + h("PRODUCT_VARIANT")), top("SIZE"))
add((POS["PRODUCT_VARIANT"][0] + TW//2 + 30, POS["PRODUCT_VARIANT"][1] + h("PRODUCT_VARIANT")), top("COLOR"))

add(right("CART", 0),           left("CART_ITEM", 1))

add(bottom("COUPON"),           top("ORDER"))
add(right("ORDER", 0),          left("PAYMENT", 1))
add(right("ORDER", 1),          left("SHIPMENT", 1))
add(right("ORDER", 3),          left("ORDER_ITEM", 1))

# Entre zonas: linhas em ângulo pelos corredores entre as colunas
def elbow_route(p1, lane_x, p2):
    rels.append(route([p1, (lane_x, p1[1]), (lane_x, p2[1]), p2]))

gap_customer = POS["CART"][0] - 35      # corredor entre CUSTOMER e CART/ORDER
gap_product = POS["PRODUCT"][0] - 37    # corredor entre CART/ORDER e PRODUCT
elbow_route(right("CUSTOMER", 0),  gap_customer,      left("CART", 1))       # cliente → carrinho (nordeste)
elbow_route(right("CUSTOMER", 1),  gap_customer + 13, left("ORDER", 1))      # cliente → pedido (sudeste)
elbow_route(right("CART_ITEM", 2), gap_product,       left("PRODUCT_VARIANT", 0))
elbow_route(right("ORDER_ITEM", 2), gap_product + 13, left("PRODUCT_VARIANT", 1))

# SVG
parts = []
parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS_W}" height="{CANVAS_H}" viewBox="0 0 {CANVAS_W} {CANVAS_H}">')
parts.append(f'<defs><style>text{{font-family:"JetBrains Mono","Fira Code",monospace;}}</style></defs>')
parts.append(f'<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="{BG}"/>')

# Blocos coloridos de cada zona, do tamanho das entidades que ela contém
for label, fill, color, full, members in ZONES:
    x0 = min(POS[m][0] for m in members) - ZONE_PAD
    x1 = max(POS[m][0] for m in members) + TW + ZONE_PAD
    y0 = ZONE_TOP if full else min(POS[m][1] for m in members) - 34
    y1 = ZONE_BOTTOM if full else max(POS[m][1] + h(m) for m in members) + 14
    parts.append(f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" rx="10" '
                 f'fill="{fill}" stroke="{color}" stroke-opacity="0.35" stroke-width="1"/>')
    parts.append(f'<text x="{x0 + 12}" y="{y0 + 20}" font-family="JetBrains Mono,monospace" font-size="10" '
                 f'font-weight="700" fill="{color}" opacity="0.85" letter-spacing="2.5">{label}</text>')
    for m in members:  # sanidade: a entidade precisa caber dentro do bloco
        assert y0 + 24 <= POS[m][1] and POS[m][1] + h(m) <= y1 - 5, f"{m} fora do bloco {label}"

# Relationships then tables
parts.extend(rels)
for name in POS:
    parts.append(render_table(name))

# Legenda no canto superior direito, acima dos blocos
lx, ly = CANVAS_W - 288, 14
parts.append(f'<rect x="{lx}" y="{ly}" width="276" height="55" rx="5" fill="{T_ROW1}" stroke="{T_BORDER}" stroke-width="1"/>')
for i, (code, color, label) in enumerate([("PK",C_PK,"Primary Key"),("FK",C_FK,"Foreign Key"),("UK",C_UK,"Unique")]):
    bx = lx + 12 + i * 92
    parts.append(f'<text x="{bx}" y="{ly+20}" font-family="JetBrains Mono,monospace" font-size="10" font-weight="700" fill="{color}">{code}</text>')
    parts.append(f'<text x="{bx}" y="{ly+38}" font-family="JetBrains Mono,monospace" font-size="8.5" fill="{C_TYPE}">{label}</text>')

parts.append(f'<text x="{CANVAS_W//2}" y="30" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="9.5" fill="rgba(88,166,255,0.3)" letter-spacing="2">PACK API — ENTITY RELATIONSHIP DIAGRAM</text>')
parts.append('</svg>')

svg = "\n".join(parts)
OUT = Path(__file__).resolve().parent.parent / "erd.svg"
OUT.write_text(svg, encoding="utf-8")
print(f"{OUT.name} gerado: {CANVAS_W}x{CANVAS_H}")
