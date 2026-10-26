# Gera docs/fluxo.html — fluxo da Pack API em 3 partes, com menus para escolher domínio e requisição
# Uso: python docs/geradores/gen_fluxo.py
#
# Parte 1 (inicialização) vem de fluxo_conteudo.py, desenhada aqui como SVG.
# Partes 2 e 3 são montadas lendo o código Java: o navegador desenha o diagrama do item escolhido.

import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True  # não cria __pycache__ dentro de docs/
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from diagrama import layout, auto_arrows, render  # noqa: E402
from fluxo_conteudo import caixas  # noqa: E402

ROOT = HERE.parent.parent
SRC = ROOT / "src" / "main" / "java" / "com" / "leonycosta" / "packapi"
TEMPLATE = HERE / "fluxo_template.html"
OUT = ROOT / "docs" / "fluxo.html"
MAX_DEPTH = 6

DOMAINS = [  # (pacote, nome na tela, categoria) — categorias na mesma ordem do ERD e das pastas do src
    ("customer", "Clientes", "Customer"), ("address", "Endereços", "Customer"),
    ("cart", "Carrinho", "Cart"),
    ("order", "Pedidos", "Order"), ("payment", "Pagamentos", "Order"),
    ("shipment", "Envios", "Order"), ("coupon", "Cupons", "Order"),
    ("product", "Produtos", "Product"), ("product_variant", "Variantes", "Product"),
    ("product_image", "Imagens", "Product"), ("product_tag", "Tags", "Product"),
    ("size", "Tamanhos", "Product"), ("color", "Cores", "Product"), ("inventory", "Estoque", "Product"),
]
CATEGORY_COLOR = {  # mesmas cores das zonas, em tom mais escuro para ler no fundo branco
    "Auth": "#0550ae", "Customer": "#1a7f37", "Cart": "#8250df", "Order": "#bc4c00", "Product": "#0969da",
}

SUMMARY = {
    "findAll": "Listar todos", "findById": "Buscar por id", "create": "Criar", "update": "Atualizar",
    "delete": "Remover", "findBySlug": "Buscar pelo slug", "addTag": "Vincular uma tag",
    "removeTag": "Desvincular uma tag", "findByProduct": "Listar do produto",
    "findEstoqueBaixo": "Estoque baixo", "findByVariant": "Histórico de movimentos",
    "register": "Registrar movimento", "findByCustomer": "Listar do cliente", "addItem": "Adicionar item",
    "removeItem": "Remover item", "clear": "Esvaziar o carrinho", "checkout": "Finalizar a compra",
    "updateStatus": "Mudar o status", "findByOrder": "Consultar pelo pedido",
    "updateRastreio": "Atualizar o rastreio",
}
SUMMARY_OVERRIDE = {
    "product.findAll": "Listar, buscar por nome ou por tag", "cart.findByCustomer": "Ver o carrinho",
    "order.findByCustomer": "Pedidos do cliente", "payment.create": "Registrar pagamento",
    "shipment.create": "Registrar envio",
}
ROLE = {"Controller": "recebe o HTTP", "Service": "regras de negócio", "Repository": "conversa com o banco",
        "Request": "JSON que entra", "Response": "JSON que sai", "Entity": "entidade = tabela"}
EXCEPTIONS = {"ResourceNotFoundException": 404, "ConflictException": 409, "BusinessException": 422}
STATUS_TEXT = {200: "200 OK", 201: "201 Created", 204: "204 No Content"}
REPO_INHERITED = {
    "save": "herdado do JpaRepository: INSERT se é novo, UPDATE se já existe",
    "findById": "herdado do JpaRepository: SELECT pela chave primária",
    "findAll": "herdado do JpaRepository: SELECT de todos os registros",
    "deleteById": "herdado do JpaRepository: DELETE pela chave primária",
    "delete": "herdado do JpaRepository: DELETE do registro",
    "existsById": "herdado do JpaRepository: confere se o id existe",
}
SAMPLE_BY_NAME = {
    "email": "maria@email.com", "cep": "20040-020", "estado": "RJ", "cidade": "Rio de Janeiro",
    "rua": "Av. Rio Branco", "numero": "156", "telefone": "21 99999-0000", "slug": "camiseta-polo",
    "sku": "POLO-M-PRETO", "variantSku": "POLO-M-PRETO", "hex": "#1A1A1A", "label": "M",
    "codigo": "VERAO10", "codigoCupom": "VERAO10", "url": "https://cdn.exemplo.com/foto.jpg",
    "tag": "verao", "transportadora": "Correios", "codigoRastreio": "BR123456789",
    "motivo": "Reposição", "descricao": "Camiseta 100% algodão",
}


# ─────────────────────────────── leitura do Java ───────────────────────────────

def mask(text):
    """Troca o conteúdo de strings e comentários por espaços, preservando posições."""
    out, i, n = list(text), 0, len(text)
    while i < n:
        if text.startswith("//", i):
            j = text.find("\n", i)
            j = n if j < 0 else j
            out[i:j] = " " * (j - i)
            i = j
        elif text.startswith("/*", i):
            j = text.find("*/", i) + 2
            out[i:j] = [c if c == "\n" else " " for c in text[i:j]]
            i = j
        elif text[i] in "\"'":
            q, j = text[i], i + 1
            while j < n and text[j] != q:
                j += 2 if text[j] == "\\" else 1
            out[i + 1:j] = " " * (j - i - 1)
            i = j + 1
        else:
            i += 1
    return "".join(out)


def block_end(masked, i):
    depth = 0
    for j in range(i, len(masked)):
        if masked[j] == "{":
            depth += 1
        elif masked[j] == "}":
            depth -= 1
            if depth == 0:
                return j
    raise ValueError("chave sem fechamento")


METHOD_RE = re.compile(
    r"^(?P<ann>(?:[ \t]{4}@[^\n]*\n)*)[ \t]{4}"
    r"(?P<mods>(?:(?:public|private|protected|static|final)\s+)*)"
    r"(?P<ret>\w[\w<>\[\],.? ]*?)\s+(?P<name>\w+)\s*\((?P<params>[^{;]*?)\)\s*(?:throws[\w\s,.]+)?\{", re.M)
FIELD_RE = re.compile(r"^[ \t]{4}private\s+(?:final\s+)?([\w<>, ]+?)\s+(\w+)\s*(?:=[^;]*)?;", re.M)
CALL_RE = re.compile(r"\b([a-z]\w*)\.(\w+)\s*\(")
SELF_RE = re.compile(r"(?<![\w.:])([a-z]\w*)\s*\(")
REF_RE = re.compile(r"this::(\w+)")


def dedent(code):
    return "\n".join(l[4:] if l.startswith("    ") else l.lstrip() for l in code.split("\n"))


class JavaClass:
    def __init__(self, path):
        self.pkg = path.parent.name
        self.rel = path.parent.relative_to(SRC).as_posix()  # ex.: order/payment
        self.name = path.stem
        self.text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
        self.masked = mask(self.text)
        self.fields = {name: typ.strip() for typ, name in FIELD_RE.findall(self.masked)}
        base = re.search(r'@RequestMapping\("([^"]*)"\)\s*(?:@\w+[^\n]*\n\s*)*public class', self.text)
        self.base = base.group(1) if base else ""
        self.methods = {}
        for m in METHOD_RE.finditer(self.masked):
            name = m.group("name")
            if name == self.name or name in self.methods:
                continue
            open_brace = m.end() - 1
            close = block_end(self.masked, open_brace)
            self.methods[name] = {
                "name": name, "ret": m.group("ret").strip(), "mods": m.group("mods"),
                "params": self.text[m.start("params"):m.end("params")],
                "ann": self.text[m.start("ann"):m.end("ann")],
                "code": dedent(self.text[m.start():close + 1]),
                "masked_code": dedent(self.masked[m.start():close + 1]),
                "body_masked": self.masked[open_brace:close + 1],
            }


CLASSES = {}
for f in SRC.rglob("*.java"):
    c = JavaClass(f)
    CLASSES[c.name] = c

ENUMS = {}
for c in CLASSES.values():
    m = re.search(r"enum\s+(\w+)\s*\{([^;}]*)", c.masked)
    if m:
        ENUMS[m.group(1)] = [x.strip() for x in m.group(2).split(",") if x.strip()]


def repo_declarations(cls):
    """Métodos declarados numa interface Repository: nome → (linhas com anotações, tem @Query)."""
    decls, pending = {}, []
    for line in cls.text.split("\n"):
        s = line.strip()
        if s.startswith("@"):
            pending.append(s)
        elif "(" in s and s.endswith(");"):
            name = re.search(r"(\w+)\s*\(", s).group(1)
            decls[name] = (pending + [s], any(p.startswith("@Query") for p in pending))
            pending = []
        elif s:
            pending = []
    return decls


def calls_in(cls, masked, exclude=None):
    found = []
    for m in CALL_RE.finditer(masked):
        recv, meth = m.group(1), m.group(2)
        typ = cls.fields.get(recv)
        target = CLASSES.get(typ or "")
        if not target:
            continue
        if typ.endswith("Repository"):
            found.append((m.start(), f"{typ}.{meth}", "repo", (recv, typ, meth)))
        elif meth in target.methods:
            found.append((m.start(), f"{typ}.{meth}", "method", (typ, meth)))
    for rx in (SELF_RE, REF_RE):
        for m in rx.finditer(masked):
            meth = m.group(1)
            if meth in cls.methods and meth != exclude:
                found.append((m.start(), f"{cls.name}.{meth}", "method", (cls.name, meth)))
    found.sort(key=lambda t: t[0])
    return found


def layer(class_name):
    for suffix in ("Controller", "Service", "Repository"):
        if class_name.endswith(suffix):
            return suffix
    return "Classe"


# ─────────────────────────────── campos e exemplos de JSON ───────────────────────────────

def clean_annotation(a):
    a = re.sub(r',?\s*message\s*=\s*"(?:[^"\\]|\\.)*"', "", a)
    a = re.sub(r"\(\s*,\s*", "(", a)
    return re.sub(r"\(\s*\)", "", a)


LOMBOK = ("@Getter", "@Setter", "@NoArgs", "@AllArgs", "@Data", "@Builder", "@Entity", "@Table")


def class_fields(type_name):
    cls = CLASSES.get(type_name)
    if not cls:
        return []
    fields, anns = [], []
    for line in cls.text.split("\n"):
        s = line.strip()
        if s.startswith("@") and not s.startswith(LOMBOK):
            anns.append(clean_annotation(s))
            continue
        m = re.match(r"private\s+([\w<>, ?]+?)\s+(\w+)\s*(?:=.*)?;", s)
        if m:
            fields.append({"name": m.group(2), "type": m.group(1), "ann": anns})
        if s and not s.startswith("//"):
            anns = []
    return fields


def sample(name, typ):
    t = typ.strip()
    if re.match(r"(?:List|Set)<", t):
        return "[ … ]"
    if t in ("String",):
        return f'[s|"{SAMPLE_BY_NAME.get(name, "texto")}"]'
    if t == "UUID":
        return '[s|"3f9a…c21e"]'
    if t in ("BigDecimal", "Double", "double"):
        return "99.90"
    if t in ("Integer", "int", "Long", "long"):
        return "1"
    if t in ("Boolean", "boolean"):
        return "true"
    if t == "LocalDateTime":
        return '[s|"2026-10-25T14:00:00"]'
    if t == "LocalDate":
        return '[s|"2026-12-31"]'
    if t in ENUMS:
        return f'[s|"{ENUMS[t][0]}"]'
    return "{ … }"


def json_lines(type_name, indent=""):
    fields = class_fields(type_name)
    if not fields:
        return [indent + "{ }"]
    out = [indent + "{"]
    for i, f in enumerate(fields):
        comma = "," if i < len(fields) - 1 else ""
        out.append(f'{indent}  [s|"{f["name"]}"]: {sample(f["name"], f["type"])}{comma}')
    out.append(indent + "}")
    return out


# ─────────────────────────────── parte 2: as peças de um domínio ───────────────────────────────

def chunks(items, size):
    return [items[i:i + size] for i in range(0, len(items), size)]


def piece_kind(cls):
    for suffix in ("Controller", "Service", "Repository", "Request", "Response"):
        if cls.name.endswith(suffix):
            return suffix
    if "@Entity" in cls.text:
        return "Entity"
    return None


def piece_box(cls, kind, endpoints):
    pid = f"c_{cls.name}"
    if kind == "Controller":
        lines = [f'[k|@RequestMapping]([s|"{cls.base}"])'] if cls.base else []
        for e in endpoints:
            suffix = e["path"][len(cls.base):] or "/"
            lines.append(f"[k|{e['method']}] {suffix}  →  [m|{e['name']}]()")
        return {"id": pid, "title": f"{cls.name}  ·  [k|@RestController]", "lines": lines, "style": "code"}
    if kind == "Service":
        pub = [m for m in cls.methods.values() if "public" in m["mods"]]
        priv = [m for m in cls.methods.values() if "public" not in m["mods"]]
        lines = []
        for m in pub:
            params = ", ".join(f"[a|{p.split()[-1]}]" for p in re.split(r",(?![^<]*>)", m["params"]) if p.strip())
            lines.append(f"[m|{m['name']}]({params})")
        if priv:
            lines.append("[c|// de uso interno:]")
            lines += ["   ".join(f"[m|{m['name']}]()" for m in grp) for grp in chunks(priv, 3)]
        return {"id": pid, "title": f"{cls.name}  ·  [k|@Service]", "lines": lines, "style": "code"}
    if kind == "Repository":
        ext = re.search(r"extends\s+(JpaRepository<[^>]+>)", cls.text)
        lines = ["[c|// herdados: o Spring implementa sozinho]",
                 "[m|save]()   [m|findById]()   [m|findAll]()   [m|deleteById]()"]
        decls = repo_declarations(cls)
        if decls:
            lines.append("[c|// declarados aqui:]")
            for name, (decl, has_query) in decls.items():
                if has_query:
                    q = re.search(r'@Query\("(.*)"\)', decl[0])
                    lines.append(f"[k|@Query]([s|\"{q.group(1) if q else '…'}\"])")
                sig = decl[-1].rstrip(";")
                lines.append(re.sub(r"(\w+)(\s*\()", lambda mm: f"[m|{mm.group(1)}]{mm.group(2)}", sig, count=1))
        title = f"{cls.name}  ·  {ext.group(1) if ext else 'Repository'}"
        return {"id": pid, "title": title, "lines": lines, "style": "code"}
    if kind == "Entity":
        table = re.search(r'@Table\(\s*name\s*=\s*"([^"]+)"', cls.text)
        lines = []
        for f in class_fields(cls.name):
            keep = [a for a in f["ann"] if re.match(r"@(Id|ManyToOne|OneToMany|OneToOne|ManyToMany|Enumerated)\b", a)
                    or ("unique = true" in a)]
            keep = [re.sub(r"\(.*\)", "", a) if not a.startswith("@Column") else "@Column(unique = true)" for a in keep]
            ann = ("  " + " ".join(f"[k|{a}]" for a in keep)) if keep else ""
            lines.append(f"[a|{f['name']}]: {f['type']}{ann}")
        title = f"{cls.name}  ·  [k|@Entity] → tabela {table.group(1) if table else cls.name.lower()}"
        return {"id": pid, "title": title, "lines": lines, "style": "data"}
    # DTOs
    lines = []
    for f in class_fields(cls.name):
        ann = ("  " + " ".join(f"[k|{a}]" for a in f["ann"])) if f["ann"] else ""
        if kind == "Request" and not f["ann"]:
            ann = "  [c|(opcional)]"
        lines.append(f"[a|{f['name']}]: {f['type']}{ann}")
    label = "DTO de entrada" if kind == "Request" else "DTO de saída"
    return {"id": pid, "title": f"{cls.name}  ·  {label}", "lines": lines or ["[c|// sem campos]"], "style": "data"}


def domain_pieces(pkg, endpoints):
    order = {"Controller": 0, "Service": 1, "Repository": 2, "Entity": 3, "Request": 4, "Response": 5}
    found = sorted(((piece_kind(c), c) for c in CLASSES.values() if c.pkg == pkg and piece_kind(c)),
                   key=lambda kc: (order[kc[0]], kc[1].name))
    width = max(len(c.name) for _, c in found) + 5
    pkg_lines = ["[c|// package-by-feature: tudo do domínio fica junto]", ""]
    boxes = []
    for kind, cls in found:
        pkg_lines.append(f"{(cls.name + '.java').ljust(width)}  [c|// {ROLE[kind]}]  @@c_{cls.name}")
        boxes.append(piece_box(cls, kind, endpoints))
    rel = found[0][1].rel
    return {"id": "pkg", "title": f"{rel}/  ·  pacote do domínio", "lines": pkg_lines, "style": "pkg"}, boxes


# ─────────────────────────────── parte 3: uma requisição ───────────────────────────────

def first_literal(code, start):
    m = re.compile(r'"((?:[^"\\]|\\.)*)"').search(code, start)
    if not m:
        return None
    return m.group(1).rstrip() + " …" if re.match(r"\s*\+", code[m.end():]) else m.group(1)


def split_params(params):
    out, depth, cur = [], 0, ""
    for ch in params:
        if ch in "(<":
            depth += 1
        elif ch in ")>":
            depth -= 1
        if ch == "," and depth == 0:
            out.append(cur)
            cur = ""
        else:
            cur += ch
    if cur.strip():
        out.append(cur)
    return [" ".join(p.split()) for p in out]


def parse_params(params):
    path_vars, query, body = [], [], None
    for p in split_params(params):
        anns = re.findall(r"@(\w+)(\([^)]*\))?", p)
        rest = re.sub(r"@\w+(\([^)]*\))?", "", p).split()
        typ, name = " ".join(rest[:-1]), rest[-1]
        kinds = {a for a, _ in anns}
        args = "".join(arg for _, arg in anns)
        if "PathVariable" in kinds:
            path_vars.append({"name": name, "type": typ})
        elif "RequestParam" in kinds:
            default = re.search(r'defaultValue\s*=\s*"([^"]*)"', args)
            required = "required = false" not in args and not default
            query.append({"name": name, "type": typ, "required": required,
                          "default": default.group(1) if default else None})
        elif "RequestBody" in kinds:
            body = {"type": typ, "valid": "Valid" in kinds}
    return path_vars, query, body


def build_flow(ctrl, mname):
    m = ctrl.methods[mname]
    nodes, index = [], {}

    def visit(cls, meth, depth, parent):
        node = {"n": len(nodes) + 1, "depth": depth, "parent": parent, "kind": layer(cls.name),
                "title": f"{cls.name}.{meth['name']}()", "cls": cls.name, "code": meth["code"],
                "badges": [], "throws": [], "_masked": meth["masked_code"], "_meth": meth["name"]}
        index[f"{cls.name}.{meth['name']}"] = node["n"]
        nodes.append(node)
        if depth >= MAX_DEPTH:
            return
        for _, key, kind, data in calls_in(cls, meth["body_masked"], exclude=meth["name"]):
            if key in index:
                continue
            if kind == "repo":
                recv, typ, rmeth = data
                decl = repo_declarations(CLASSES[typ]).get(rmeth)
                if decl:
                    detail = ("consulta escrita à mão em JPQL" if decl[1]
                              else "consulta gerada pelo Spring a partir do nome do método")
                    code = "\n".join(decl[0])
                else:
                    detail = REPO_INHERITED.get(rmeth, "herdado do JpaRepository")
                    code = f"{rmeth}(...)"
                index[key] = len(nodes) + 1
                nodes.append({"n": len(nodes) + 1, "depth": depth + 1, "parent": node["n"], "kind": "Repository",
                              "title": f"{recv}.{rmeth}()", "cls": typ, "code": f"// {detail}\n{code}",
                              "badges": [], "throws": []})
            else:
                tcls, tmeth = data
                visit(CLASSES[tcls], CLASSES[tcls].methods[tmeth], depth + 1, node["n"])

    visit(ctrl, m, 0, None)

    errors = {}
    for node in nodes:
        masked = node.pop("_masked", None)
        own = node.pop("_meth", None)
        if masked is None:
            continue
        cls = CLASSES[node["cls"]]
        for i, line in enumerate(masked.split("\n")):
            nums = []
            for _, key, _, _ in calls_in(cls, line, exclude=own):
                if key in index and index[key] != node["n"] and index[key] not in nums:
                    nums.append(index[key])
            if nums:
                node["badges"].append([i, nums])
        code_lines = node["code"].split("\n")
        for ex in re.finditer(r"new\s+(\w+Exception)\s*\(", masked):
            name = ex.group(1)
            line_no = masked.count("\n", 0, ex.start())
            status = EXCEPTIONS.get(name, 500)
            node["throws"].append([line_no, status])
            offset = sum(len(l) + 1 for l in code_lines[:line_no])
            msg = first_literal(node["code"], offset + code_lines[line_no].find("new"))
            entry = errors.setdefault(name, {"steps": [], "messages": []})
            if node["n"] not in entry["steps"]:
                entry["steps"].append(node["n"])
            if msg:
                if name == "ResourceNotFoundException" and "não encontrado" not in msg:
                    msg = f"{msg} não encontrado com id: …"
                if msg not in entry["messages"]:
                    entry["messages"].append(msg)

    path_vars, query, body = parse_params(m["params"])
    mapping = re.search(r"@(Get|Post|Put|Delete|Patch)Mapping(?:\(\s*\"([^\"]*)\"\s*\))?", m["ann"])
    http = mapping.group(1).upper()
    path = "/" + "/".join(s.strip("/") for s in (ctrl.base, mapping.group(2) or "") if s.strip("/"))
    status_name = re.search(r"@ResponseStatus\(HttpStatus\.(\w+)\)", m["ann"])
    status = {"CREATED": 201, "NO_CONTENT": 204}.get(status_name.group(1), 200) if status_name else 200

    # caixa da requisição
    req = [f"[k|{http}] " + re.sub(r"\{(\w+)\}", r"[a|{\1}]", path)]
    for q in query:
        note = f"padrão: {q['default']}" if q["default"] else ("obrigatório" if q["required"] else "opcional")
        req.append(f"    ?[a|{q['name']}]={sample(q['name'], q['type'])}   [c|// {note}]")
    if body:
        req += ["", f"[c|// corpo → {body['type']}" + (", validado com @Valid]" if body["valid"] else "]")]
        req += json_lines(body["type"])

    # caixa da resposta
    ret = m["ret"]
    resp_type = re.search(r"\w+Response", ret)
    if ret == "void":
        resp = ["[c|// sem corpo: o status já diz que deu certo]"]
    elif resp_type:
        resp = [f"[c|// o Jackson converte o {ret} em JSON]"]
        if ret.startswith("List<"):
            resp += ["["] + json_lines(resp_type.group(0), "  ") + ["  …", "]"]
        else:
            resp += json_lines(resp_type.group(0))
    else:
        resp = [f"[c|// {ret}]"]

    # caixa dos erros
    err = []
    if body and body["valid"]:
        err.append("[e|MethodArgumentNotValidException]  →  400  [c|// corpo inválido]")
    if body:
        err.append("[e|HttpMessageNotReadableException]  →  400  [c|// JSON malformado]")
    typed = [p["name"] for p in path_vars + query if p["type"] not in ("String", "int", "Integer")]
    if typed:
        err.append(f"[e|MethodArgumentTypeMismatchException]  →  400  [c|// {', '.join(typed)} inválido]")
    if any(q["required"] for q in query):
        err.append("[e|MissingServletRequestParameterException]  →  400  [c|// parâmetro ausente]")
    for name, info in sorted(errors.items(), key=lambda kv: EXCEPTIONS.get(kv[0], 500)):
        steps = ", ".join(str(s) for s in info["steps"])
        err.append(f"[e|{name}]  →  {EXCEPTIONS.get(name, 500)}  [c|// passo {steps}]")
        err += [f'    [s|"{msg}"]' for msg in info["messages"]]

    return {
        "id": mname, "name": mname, "method": http, "path": path,
        "summary": SUMMARY_OVERRIDE.get(f"{ctrl.pkg}.{mname}", SUMMARY.get(mname, mname)),
        "status": STATUS_TEXT.get(status, str(status)),
        "request": req, "response": resp, "errors": err or ["[c|// nenhum erro previsto além de 500]"],
        "nodes": nodes,
    }


# ─────────────────────────────── parte 1 + saída ───────────────────────────────

def part1_svg():
    b = caixas()
    parts, secoes, w, h = layout([("", "", [[b["main"], b["run"], b["tomcat"]],
                                            [b["props"], b["beans"], b["hib"], b["sec"]],
                                            [b["tables"]]])])
    parts += [x.svg() for x in secoes[0]]
    parts += auto_arrows(secoes[0], [("main", "run"), ("run", "tomcat")])
    return render(w, h, parts)


def main():
    domains = []
    for pkg, label, group in DOMAINS:
        ctrl = next(c for c in CLASSES.values() if c.pkg == pkg and c.name.endswith("Controller"))
        endpoints = [build_flow(ctrl, n) for n, m in ctrl.methods.items()
                     if re.search(r"@(Get|Post|Put|Delete|Patch)Mapping", m["ann"])]
        pkg_box, pieces = domain_pieces(pkg, endpoints)
        domains.append({"id": pkg, "label": label, "group": group, "color": CATEGORY_COLOR[group],
                        "pkg": pkg_box, "pieces": pieces, "endpoints": endpoints})

    data = json.dumps({"domains": domains}, ensure_ascii=False).replace("</", "<\\/")
    html = TEMPLATE.read_text(encoding="utf-8")
    html = html.replace("<!--__PARTE1__-->", part1_svg()).replace("/*__DATA__*/{}", data)
    # Dentro do <script>, "<svg", "</g>" etc. viram "\x3Csvg", "\x3C/g>": é o mesmo texto para o JavaScript,
    # mas o visualizador do artifact não confunde mais com tags HTML e não corta o script no meio.
    start = html.index("<script>") + len("<script>")
    end = html.rindex("</script>")
    html = html[:start] + re.sub(r"<(?=[A-Za-z/!])", r"\\x3C", html[start:end]) + html[end:]
    OUT.write_text(html, encoding="utf-8")
    total = sum(len(d["endpoints"]) for d in domains)
    print(f"{OUT.name} gerado: {len(domains)} domínios, {total} requisições")


if __name__ == "__main__":
    main()
