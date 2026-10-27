# Gera docs/estrutura-pastas.svg — árvore de pastas estilo terminal
# Uso: python docs/geradores/gen_estrutura_pastas.py

import xml.sax.saxutils as saxutils
from pathlib import Path

BG        = "#0d1117"
C_TREE    = "#2e4a2e"   # linhas da árvore (dim)
C_ROOT    = "#e6edf3"   # raiz
C_DIR     = "#7ee787"   # pastas
C_PKG     = "#79c0ff"   # pacote java
C_FILE    = "#c9d1d9"   # arquivos genéricos
C_JAVA    = "#ffa657"   # .java (main)
C_HASH    = "#3d5c3d"   # "#" separador
C_CMT     = "#6e8b6e"   # texto do comentário
C_TITLE   = "#58a6ff"   # título no header

FONT = "JetBrains Mono, Fira Code, monospace"
FS   = 13      # font-size px
LH   = 22      # line-height px
PL   = 28      # padding left
PT   = 56      # padding top (content starts here)
PB   = 32      # padding bottom
CW   = 7.82    # char width approx (JetBrains Mono 13px)

# (tree_prefix, name, type, comment)
# type: root | dir | pkg | file | java | prop
LINES = [
    ("",               "Pack/backend/",                        "root", "frontend/ fica ao lado, em Pack/frontend/"),
    ("├── ",           "src/",                                 "dir",  ""),
    ("│   ├── ",       "main/",                                "dir",  ""),
    ("│   │   ├── ",   "java/com/leonycosta/packapi/",         "pkg",  ""),
    # categorias: cada domínio tem o próprio pacote, inclusive o principal (<categoria>/<categoria>/)
    ("│   │   │   ├── ",     "staff/",                     "dir",  "Categoria STAFF"),
    ("│   │   │   │   ├── ", "permission/",                "dir",  "Permissoes granulares"),
    ("│   │   │   │   ├── ", "role/",                      "dir",  "Papeis de acesso"),
    ("│   │   │   │   ├── ", "role_permission/",           "dir",  "Vinculo role-permission (N:M)"),
    ("│   │   │   │   └── ", "staff/",                     "dir",  "Funcionarios"),
    ("│   │   │   ├── ",     "customer/",                  "dir",  "Categoria CUSTOMER"),
    ("│   │   │   │   ├── ", "customer/",                  "dir",  "Cliente (Customer*.java, senha em hash)"),
    ("│   │   │   │   └── ", "address/",                   "dir",  "Enderecos do cliente"),
    ("│   │   │   ├── ",     "cart/",                      "dir",  "Categoria CART"),
    ("│   │   │   │   ├── ", "cart/",                      "dir",  "Carrinho (Cart*.java, 1:1 com cliente)"),
    ("│   │   │   │   └── ", "cart_item/",                 "dir",  "Itens do carrinho"),
    ("│   │   │   ├── ",     "order/",                     "dir",  "Categoria ORDER"),
    ("│   │   │   │   ├── ", "order/",                     "dir",  "Pedido e checkout (Order*.java)"),
    ("│   │   │   │   ├── ", "coupon/",                    "dir",  "Cupons de desconto"),
    ("│   │   │   │   ├── ", "order_item/",                "dir",  "Itens do pedido (snapshot de preco e SKU)"),
    ("│   │   │   │   ├── ", "payment/",                   "dir",  "Pagamentos"),
    ("│   │   │   │   └── ", "shipment/",                  "dir",  "Envios e codigo de rastreio"),
    ("│   │   │   ├── ",     "product/",                   "dir",  "Categoria PRODUCT"),
    ("│   │   │   │   ├── ", "product/",                   "dir",  "Produto (Product*.java, slug automatico)"),
    ("│   │   │   │   ├── ", "color/",                     "dir",  "Cores"),
    ("│   │   │   │   ├── ", "inventory/",                 "dir",  "Movimentos de estoque"),
    ("│   │   │   │   ├── ", "product_image/",             "dir",  "Imagens dos produtos"),
    ("│   │   │   │   ├── ", "product_tag/",               "dir",  "Tags de categoria"),
    ("│   │   │   │   ├── ", "product_tag_link/",          "dir",  "Vinculo produto-tag (N:M)"),
    ("│   │   │   │   ├── ", "product_variant/",           "dir",  "Variantes: SKU, tamanho, cor, estoque"),
    ("│   │   │   │   └── ", "size/",                      "dir",  "Tamanhos (P, M, G, GG...)"),
    # transversais: usados por todas as categorias
    ("│   │   │   ├── ",     "auth/",                      "dir",  "Login, cadastro, token JWT e regras de dono"),
    ("│   │   │   ├── ",     "config/",                    "dir",  "Regras de acesso (SecurityConfig) e JWT"),
    ("│   │   │   ├── ",     "enums/",                     "dir",  "Enums globais (OrderStatus, PaymentStatus...)"),
    ("│   │   │   ├── ",     "exception/",                 "dir",  "GlobalExceptionHandler + erros padrao"),
    ("│   │   │   └── ",     "PackApiApplication.java",    "java", "Entry point da aplicacao"),
    ("│   │   └── ",   "resources/",                           "dir",  ""),
    ("│   │       └── ", "application.properties",             "prop", "Configuracao; segredos vem do .env"),
    ("│   └── ",       "test/",                                "dir",  ""),
    ("│       └── ",   "java/com/leonycosta/packapi/",         "pkg",  "Testes unitarios e de integracao"),
    ("├── ",           "docs/",                                "dir",  ""),
    ("│   ├── ",       "geradores/",                           "dir",  "Scripts Python que geram os SVGs"),
    ("│   │   ├── ",   "diagrama.py",                          "file", "Pecas de desenho dos fluxos"),
    ("│   │   ├── ",   "fluxo_conteudo.py",                    "file", "Caixas da parte 1 do fluxo"),
    ("│   │   ├── ",   "fluxo_template.html",                  "file", "Layout e menus do fluxo.html"),
    ("│   │   ├── ",   "gen_erd.py",                           "file", "Gera erd.svg"),
    ("│   │   ├── ",   "gen_estrutura_pacotes.py",             "file", "Gera estrutura-pacotes.svg"),
    ("│   │   ├── ",   "gen_estrutura_pastas.py",              "file", "Gera estrutura-pastas.svg"),
    ("│   │   └── ",   "gen_fluxo.py",                         "file", "Gera fluxo.html lendo o codigo"),
    ("│   ├── ",       "erd.svg",                              "file", "Diagrama entidade-relacionamento"),
    ("│   ├── ",       "estrutura-pacotes.svg",                "file", "Estrutura de pacotes por dominio"),
    ("│   ├── ",       "estrutura-pastas.svg",                 "file", "Este arquivo"),
    ("│   └── ",       "fluxo.html",                           "file", "Fluxo em partes com menus"),
    ("├── ",           ".env",                                 "prop", "Senhas e chave JWT locais (fora do git)"),
    ("├── ",           ".env.example",                         "file", "Modelo do .env, sem valores reais"),
    ("├── ",           "mvnw / mvnw.cmd",                      "file", "Maven Wrapper (roda sem instalar o Maven)"),
    ("└── ",           "pom.xml",                              "file", "Maven: dependencias, plugins, Java 21"),
]

def nc(t):
    return {"root": C_ROOT, "dir": C_DIR, "pkg": C_PKG,
            "java": C_JAVA, "file": C_FILE, "prop": C_FILE}.get(t, C_FILE)

def esc(s):
    return saxutils.escape(s)

# Fixed comment column (chars from left edge including padding)
# longest prefix+name: "│   │   │   ├── " (20) + "product_tag_link/" (18) = 38 chars
# set comment at char 42 from left (after PL)
CMT_X = PL + 42 * CW

# Calculate canvas dimensions
n = len(LINES)
CANVAS_W = int(CMT_X + 55 * CW + PL)   # comment area ~55 chars wide
CANVAS_H = PT + n * LH + PB

parts = []
parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS_W}" height="{CANVAS_H}" viewBox="0 0 {CANVAS_W} {CANVAS_H}">')
parts.append(f'<defs><style>text{{font-family:{FONT};}}</style></defs>')
parts.append(f'<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="{BG}"/>')

# Subtle header strip
parts.append(f'<rect width="{CANVAS_W}" height="{PT-8}" fill="rgba(255,255,255,0.02)"/>')
parts.append(f'<line x1="0" y1="{PT-8}" x2="{CANVAS_W}" y2="{PT-8}" stroke="#1e2736" stroke-width="1"/>')

# Title
parts.append(f'<text x="{PL}" y="{PT-22}" font-family="{FONT}" font-size="11" font-weight="700" fill="{C_TITLE}" letter-spacing="1">PACK-API — ESTRUTURA DE PASTAS</text>')

# Subtitle
parts.append(f'<text x="{PL}" y="{PT-8}" font-family="{FONT}" font-size="10" fill="{C_TREE}">Spring Boot 4.1 · Java 21 · package-by-feature</text>')

# Lines
for i, (prefix, name, ntype, comment) in enumerate(LINES):
    y = PT + i * LH + LH - 4   # baseline

    # Tree prefix
    if prefix:
        parts.append(f'<text x="{PL}" y="{y}" font-family="{FONT}" font-size="{FS}" fill="{C_TREE}">{esc(prefix)}</text>')

    # Name
    nx = PL + len(prefix) * CW
    parts.append(f'<text x="{nx:.1f}" y="{y}" font-family="{FONT}" font-size="{FS}" fill="{nc(ntype)}">{esc(name)}</text>')

    # Comment
    if comment:
        parts.append(f'<text x="{CMT_X:.1f}" y="{y}" font-family="{FONT}" font-size="{FS}" fill="{C_HASH}">#</text>')
        parts.append(f'<text x="{CMT_X + 2*CW:.1f}" y="{y}" font-family="{FONT}" font-size="{FS}" fill="{C_CMT}">{esc(comment)}</text>')

parts.append('</svg>')

svg = "\n".join(parts)
OUT = Path(__file__).resolve().parent.parent / "estrutura-pastas.svg"
OUT.write_text(svg, encoding="utf-8")
print(f"{OUT.name} gerado: {CANVAS_W}x{CANVAS_H}, {n} linhas")
