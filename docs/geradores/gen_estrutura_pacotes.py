# Gera docs/estrutura-pacotes.svg — arquivos de cada pacote, agrupados por domínio
# Uso: python docs/geradores/gen_estrutura_pacotes.py

from pathlib import Path

BG       = "#0d1117"
Z_AUTH   = "#0d1a2e"
Z_CUST   = "#0e1f1a"
Z_ORDER  = "#1a1506"
Z_CART   = "#1a0f1a"
Z_PROD   = "#0d1a0d"
Z_CROSS  = "#17121a"

HDR_AUTH  = "#1a3060"
HDR_CUST  = "#0e3a2a"
HDR_ORDER = "#3a2a00"
HDR_CART  = "#2a0e3a"
HDR_PROD  = "#0e3a0e"
HDR_CROSS = "#2a1a3a"

C_ENTITY = "#ffa657"
C_REPO   = "#79c0ff"
C_SVC    = "#3bca6d"
C_DTO    = "#8b949e"
C_ENUM   = "#d2a8ff"
C_EXCEP  = "#f47067"
C_MAIN   = "#58a6ff"
C_CTRL   = "#56d4dd"
C_CONF   = "#e3b341"

MONO = 'JetBrains Mono, Fira Code, monospace'
SANS = 'Sora, system-ui, sans-serif'

CW   = 210   # card width
RH   = 17    # file row height
HH   = 24    # card header height
GAP  = 12    # gap between cards
CGAP = 28    # gap between zone columns

def file_color(pkg, name):
    if pkg == "enums":   return C_ENUM
    if pkg == "exception": return C_EXCEP
    if name == "PackApiApplication.java": return C_MAIN
    if pkg == "config" or name in ("AccessGuard.java", "AuthDataSeeder.java"): return C_CONF
    if name in ("TipoUsuario.java", "Permissao.java"): return C_ENUM
    if name.endswith("Controller.java"): return C_CTRL
    if name.endswith("Service.java"):    return C_SVC
    if name.endswith("Repository.java"): return C_REPO
    if name.endswith("Request.java") or name.endswith("Response.java"): return C_DTO
    return C_ENTITY  # entity

def file_label(pkg, name):
    stem = name.replace(".java", "")
    if pkg in ("enums", "exception", "config"):
        return stem
    if name.endswith("Controller.java"): return stem.replace("Controller","") + " ·ctrl"
    if name.endswith("Repository.java"): return stem.replace("Repository","") + " ·repo"
    if name.endswith("Service.java"):    return stem.replace("Service","") + " ·svc"
    if name.endswith("Request.java"):    return stem.replace("Request","") + " ·req"
    if name.endswith("Response.java"):   return stem.replace("Response","") + " ·res"
    return stem  # entity / main

# Packages definition: (package_name, [files])
PACKAGES = {
    "PackApiApplication": {"files": ["PackApiApplication.java"], "zone": "cross"},
    "config": {"files": ["SecurityConfig.java","JwtConfig.java","SecurityErrorHandler.java"], "zone": "cross"},
    "exception": {"files": ["ApiError.java","BusinessException.java","ConflictException.java","UnauthorizedException.java","GlobalExceptionHandler.java"], "zone": "cross"},
    # AuthService vem primeiro: o AuthController é acrescentado automaticamente a partir dele
    "auth": {"files": ["AuthService.java","TokenService.java","AccessGuard.java","AuthDataSeeder.java","TipoUsuario.java",
                       "LoginRequest.java","RegisterRequest.java","TokenResponse.java","UsuarioResponse.java"], "zone": "auth"},
    "enums": {"files": ["CouponTipo.java","MovimentoTipo.java","OrderStatus.java","PaymentMetodo.java","PaymentStatus.java","ShipmentStatus.java"], "zone": "cross"},
    "staff": {"files": ["Staff.java","StaffRepository.java","StaffRequest.java","StaffResponse.java","StaffService.java"], "zone": "auth"},
    "role": {"files": ["Role.java","RoleRepository.java","RoleRequest.java","RoleResponse.java","RoleService.java"], "zone": "auth"},
    "permission": {"files": ["Permission.java","Permissao.java","PermissionRepository.java","PermissionRequest.java","PermissionResponse.java","PermissionController.java"], "zone": "auth"},
    "role_permission": {"files": ["RolePermission.java","RolePermissionRepository.java","RolePermissionRequest.java"], "zone": "auth"},
    "customer": {"files": ["Customer.java","CustomerRepository.java","CustomerRequest.java","CustomerResponse.java","CustomerService.java"], "zone": "customer"},
    "address": {"files": ["Address.java","AddressRepository.java","AddressRequest.java","AddressResponse.java","AddressService.java"], "zone": "customer"},
    "order": {"files": ["Order.java","OrderRepository.java","OrderRequest.java","OrderResponse.java","OrderService.java"], "zone": "order"},
    "order_item": {"files": ["OrderItem.java","OrderItemRepository.java","OrderItemResponse.java"], "zone": "order"},
    "payment": {"files": ["Payment.java","PaymentRepository.java","PaymentRequest.java","PaymentResponse.java","PaymentService.java"], "zone": "order"},
    "shipment": {"files": ["Shipment.java","ShipmentRepository.java","ShipmentRequest.java","ShipmentResponse.java","ShipmentService.java"], "zone": "order"},
    "coupon": {"files": ["Coupon.java","CouponRepository.java","CouponRequest.java","CouponResponse.java","CouponService.java"], "zone": "order"},
    "cart": {"files": ["Cart.java","CartRepository.java","CartResponse.java","CartService.java"], "zone": "cart"},
    "cart_item": {"files": ["CartItem.java","CartItemRepository.java","CartItemRequest.java","CartItemResponse.java"], "zone": "cart"},
    "product": {"files": ["Product.java","ProductRepository.java","ProductRequest.java","ProductResponse.java","ProductService.java"], "zone": "product"},
    "product_variant": {"files": ["ProductVariant.java","ProductVariantRepository.java","ProductVariantRequest.java","ProductVariantResponse.java","ProductVariantService.java"], "zone": "product"},
    "product_image": {"files": ["ProductImage.java","ProductImageRepository.java","ProductImageRequest.java","ProductImageResponse.java","ProductImageService.java"], "zone": "product"},
    "product_tag": {"files": ["ProductTag.java","ProductTagRepository.java","ProductTagRequest.java","ProductTagResponse.java","ProductTagService.java"], "zone": "product"},
    "product_tag_link": {"files": ["ProductTagLink.java","ProductTagLinkRepository.java","ProductTagLinkRequest.java"], "zone": "product"},
    "size": {"files": ["Size.java","SizeRepository.java","SizeRequest.java","SizeResponse.java","SizeService.java"], "zone": "product"},
    "color": {"files": ["Color.java","ColorRepository.java","ColorRequest.java","ColorResponse.java","ColorService.java"], "zone": "product"},
    "inventory": {"files": ["InventoryMovement.java","InventoryMovementRepository.java","InventoryMovementRequest.java","InventoryMovementResponse.java","InventoryMovementService.java"], "zone": "product"},
}

# Todo pacote com Service ganhou um Controller correspondente (Fase 7)
for info in PACKAGES.values():
    svc = next((f for f in info["files"] if f.endswith("Service.java")), None)
    if svc:
        info["files"].append(svc.replace("Service", "Controller"))

ZONE_ORDER = ["cross", "auth", "customer", "cart", "order", "product"]

# Caminho de cada pacote dentro de packapi/: todo domínio fica em <categoria>/<domínio>/
PATH = {pkg: f"{info['zone']}/{pkg}" for pkg, info in PACKAGES.items() if info["zone"] != "cross"}
ZONE_LABELS = {"cross":"CROSS-CUTTING","auth":"AUTH","customer":"CUSTOMER","order":"ORDER","cart":"CART","product":"PRODUCT"}
ZONE_BG    = {"cross":Z_CROSS,"auth":Z_AUTH,"customer":Z_CUST,"order":Z_ORDER,"cart":Z_CART,"product":Z_PROD}
ZONE_HDR   = {"cross":HDR_CROSS,"auth":HDR_AUTH,"customer":HDR_CUST,"order":HDR_ORDER,"cart":HDR_CART,"product":HDR_PROD}
ZONE_TC    = {"cross":"#d2a8ff","auth":"#79c0ff","customer":"#3bca6d","order":"#ffa657","cart":"#d2a8ff","product":"#58a6ff"}

def card_height(files):
    return HH + len(files) * RH + 6

def render_card(pkg, files, x, y, zone):
    h = card_height(files)
    hdr_c = ZONE_HDR[zone]
    tc    = ZONE_TC[zone]
    parts = [f'<g transform="translate({x},{y})">']
    # shadow
    parts.append(f'  <rect x="2" y="2" width="{CW}" height="{h}" rx="5" fill="rgba(0,0,0,0.25)"/>')
    # body
    parts.append(f'  <rect width="{CW}" height="{h}" rx="5" fill="{BG}" stroke="{hdr_c}" stroke-width="1.2"/>')
    # header
    parts.append(f'  <rect width="{CW}" height="{HH}" rx="5" fill="{hdr_c}"/>')
    parts.append(f'  <rect y="{HH-5}" width="{CW}" height="5" fill="{hdr_c}"/>')
    parts.append(f'  <text x="8" y="{HH-6}" font-family="{MONO}" font-size="10" font-weight="700" fill="{tc}">{PATH.get(pkg, pkg)}/</text>')
    # files
    for i, fname in enumerate(files):
        ry = HH + i * RH + 13
        color = file_color(pkg, fname)
        label = file_label(pkg, fname)
        parts.append(f'  <circle cx="10" cy="{ry-4}" r="2.5" fill="{color}" opacity="0.9"/>')
        parts.append(f'  <text x="18" y="{ry}" font-family="{MONO}" font-size="9" fill="{color}">{label}</text>')
    parts.append('</g>')
    return "\n".join(parts)

def render_app_card(x, y):
    h = HH + 1 * RH + 6
    parts = [f'<g transform="translate({x},{y})">']
    parts.append(f'  <rect x="2" y="2" width="{CW}" height="{h}" rx="5" fill="rgba(0,0,0,0.25)"/>')
    parts.append(f'  <rect width="{CW}" height="{h}" rx="5" fill="{BG}" stroke="{HDR_CROSS}" stroke-width="1.2"/>')
    parts.append(f'  <rect width="{CW}" height="{HH}" rx="5" fill="{HDR_CROSS}"/>')
    parts.append(f'  <rect y="{HH-5}" width="{CW}" height="5" fill="{HDR_CROSS}"/>')
    parts.append(f'  <text x="8" y="{HH-6}" font-family="{MONO}" font-size="10" font-weight="700" fill="{C_MAIN}">packapi/</text>')
    parts.append(f'  <circle cx="10" cy="{HH+RH-4}" r="2.5" fill="{C_MAIN}" opacity="0.9"/>')
    parts.append(f'  <text x="18" y="{HH+RH+2}" font-family="{MONO}" font-size="9" fill="{C_MAIN}">PackApiApplication</text>')
    parts.append('</g>')
    return "\n".join(parts)

# --- Layout calculation ---
# Group packages by zone
zones = {z: [] for z in ZONE_ORDER}
for pkg, info in PACKAGES.items():
    if pkg == "PackApiApplication":
        zones["cross"].insert(0, pkg)
    else:
        zones[info["zone"]].append(pkg)

# Calculate column widths and heights
def col_height(pkgs):
    total = 0
    for p in pkgs:
        if p == "PackApiApplication":
            total += HH + 1*RH + 6 + GAP
        else:
            total += card_height(PACKAGES[p]["files"]) + GAP
    return total - GAP

col_heights = {z: col_height(zones[z]) for z in ZONE_ORDER}
MAX_H = max(col_heights.values())
CANVAS_H = MAX_H + 80  # top padding + zone label + bottom padding
CANVAS_W = len(ZONE_ORDER) * (CW + CGAP) + CGAP

parts = []
parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS_W}" height="{CANVAS_H}" viewBox="0 0 {CANVAS_W} {CANVAS_H}">')
parts.append(f'<defs><style>text{{font-family:{MONO};}}</style></defs>')
# also embed google font via link element inside SVG
parts.append('<defs><style>@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&amp;display=swap");</style></defs>')
parts.append(f'<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="{BG}"/>')

# Zone backgrounds
for i, zone in enumerate(ZONE_ORDER):
    zx = CGAP//2 + i*(CW + CGAP)
    parts.append(f'<rect x="{zx}" y="0" width="{CW+CGAP}" height="{CANVAS_H}" fill="{ZONE_BG[zone]}" rx="0"/>')

# Zone labels at top
for i, zone in enumerate(ZONE_ORDER):
    zx = CGAP//2 + i*(CW + CGAP) + CW//2 + CGAP//2
    tc = ZONE_TC[zone]
    parts.append(f'<text x="{zx}" y="18" text-anchor="middle" font-family="{MONO}" font-size="8" font-weight="700" fill="{tc}" letter-spacing="2" opacity="0.7">{ZONE_LABELS[zone]}</text>')

# Cards
for i, zone in enumerate(ZONE_ORDER):
    cx = CGAP//2 + i*(CW + CGAP) + CGAP//2
    cy = 30
    for pkg in zones[zone]:
        if pkg == "PackApiApplication":
            parts.append(render_app_card(cx, cy))
            cy += HH + 1*RH + 6 + GAP
        else:
            files = PACKAGES[pkg]["files"]
            parts.append(render_card(pkg, files, cx, cy, zone))
            cy += card_height(files) + GAP

# Legend
legend_items = [
    (C_ENTITY,"Entity"), (C_REPO,"Repository"), (C_SVC,"Service"), (C_CTRL,"Controller"),
    (C_DTO,"DTO (req/res)"), (C_ENUM,"Enum"), (C_EXCEP,"Exception"), (C_CONF,"Config"), (C_MAIN,"Main"),
]
lx = CGAP//2
ly = CANVAS_H - 22
parts.append(f'<rect x="{lx-4}" y="{ly-14}" width="{len(legend_items)*96+8}" height="20" rx="4" fill="rgba(0,0,0,0.4)"/>')
for j, (color, label) in enumerate(legend_items):
    px = lx + j*96
    parts.append(f'<circle cx="{px+5}" cy="{ly-4}" r="3" fill="{color}"/>')
    parts.append(f'<text x="{px+12}" y="{ly}" font-family="{MONO}" font-size="8.5" fill="{color}">{label}</text>')

parts.append(f'<text x="{CANVAS_W//2}" y="{CANVAS_H-28}" text-anchor="middle" font-family="{MONO}" font-size="9" fill="rgba(255,255,255,0.15)" letter-spacing="1.5">PACK API — PACKAGE STRUCTURE</text>')
parts.append('</svg>')

svg = "\n".join(parts)
OUT = Path(__file__).resolve().parent.parent / "estrutura-pacotes.svg"
OUT.write_text(svg, encoding="utf-8")
print(f"{OUT.name} gerado: {CANVAS_W}x{CANVAS_H}")
