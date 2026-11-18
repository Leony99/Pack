package com.leonycosta.packapi.product.product;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Pageable;
import com.leonycosta.packapi.config.Pagina;
import com.leonycosta.packapi.enums.OrderStatus;
import com.leonycosta.packapi.order.order_item.OrderItemRepository;
import com.leonycosta.packapi.enums.TagFiltro;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.exception.ParametroInvalidoException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import com.leonycosta.packapi.product.product_image.ProductImageResponse;
import com.leonycosta.packapi.product.product_tag.ProductTag;
import com.leonycosta.packapi.product.product_tag.ProductTagResponse;
import com.leonycosta.packapi.product.product_tag.ProductTagService;
import com.leonycosta.packapi.product.product_tag_link.ProductTagLink;
import com.leonycosta.packapi.cart.cart_item.CartItemRepository;
import com.leonycosta.packapi.product.inventory.InventoryMovementRepository;
import com.leonycosta.packapi.product.product_variant.ProductVariantResponse;
import com.leonycosta.packapi.product.color.ColorResponse;
import com.leonycosta.packapi.product.size.SizeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductTagService productTagService;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final InventoryMovementRepository movementRepository;

    private static final Sort ORDEM = Sort.by("nome", "id");

    // Mais vendidos: pedidos que contam como venda (pagos, e os que já seguiram depois de pagos).
    // Ficam de fora os que esperam pagamento, os cancelados e os devolvidos
    static final Set<OrderStatus> VENDIDO = EnumSet.of(
            OrderStatus.PAGO, OrderStatus.EM_SEPARACAO, OrderStatus.ENVIADO, OrderStatus.ENTREGUE);
    static final int DIAS_DOS_MAIS_VENDIDOS = 90;
    public static final int MAXIMO_DOS_MAIS_VENDIDOS = 48;
    // "desde sempre": uma data antes de qualquer pedido
    private static final LocalDateTime DESDE_SEMPRE = LocalDateTime.of(2000, 1, 1, 0, 0);

    public Pagina<ProductResponse> findAll(int pagina, int tamanho) {
        return catalogo(FiltroDoCatalogo.nenhum(), OrdemDoCatalogo.NOME, pagina, tamanho);
    }

    // O catálogo da loja: os filtros viram o WHERE da consulta e só a página pedida sai do banco
    public Pagina<ProductResponse> catalogo(FiltroDoCatalogo filtro, OrdemDoCatalogo ordem, int pagina, int tamanho) {
        Pageable pedido = Pagina.pedido(pagina, tamanho, ordem.sort());
        return Pagina.de(productRepository.findAll(filtro.paraConsulta(), pedido).map(this::toResponse));
    }

    // O drop em destaque: a coleção da peça mais nova que está em alguma coleção, com as `limite` peças
    // mais novas dela. São duas consultas pequenas (a coleção, com limite 1, e a página das peças), em vez de
    // a loja buscar o catálogo inteiro para procurar
    public static final int MAXIMO_DO_DROP = 24;

    public DropEmDestaqueResponse dropEmDestaque(int limite) {
        if (limite < 1 || limite > MAXIMO_DO_DROP) {
            throw new ParametroInvalidoException("O limite do drop vai de 1 a " + MAXIMO_DO_DROP);
        }
        List<String> colecoes = productRepository.colecoesDasPecasMaisNovas(TagFiltro.COLECAO, PageRequest.of(0, 1));
        if (colecoes.isEmpty()) {
            return new DropEmDestaqueResponse(null, List.of());
        }
        String colecao = colecoes.getFirst();
        FiltroDoCatalogo doDrop = new FiltroDoCatalogo(List.of(), List.of(), List.of(colecao), false, false);
        return new DropEmDestaqueResponse(colecao, catalogo(doDrop, OrdemDoCatalogo.RECENTES, 0, limite).itens());
    }

    // O índice da busca trabalha com pedaços de 3 letras: com menos, o banco teria de ler a tabela inteira
    public static final int MINIMO_DA_BUSCA = 3;

    public Pagina<ProductResponse> search(String nome, int pagina, int tamanho) {
        String termo = nome.strip();
        if (termo.length() < MINIMO_DA_BUSCA) {
            throw new ParametroInvalidoException(
                    "A busca por nome precisa de pelo menos " + MINIMO_DA_BUSCA + " letras");
        }
        // a ordem já está escrita na consulta (SQL nativo)
        Pageable pedido = Pagina.pedido(pagina, tamanho, Sort.unsorted());
        return Pagina.de(productRepository.searchByNome(termo, pedido).map(this::toResponse));
    }

    public Pagina<ProductResponse> findByTag(String tag, int pagina, int tamanho) {
        Pageable pedido = Pagina.pedido(pagina, tamanho, ORDEM);
        return Pagina.de(productRepository.findByTag(tag.toLowerCase(), pedido).map(this::toResponse));
    }

    // Os `limite` produtos mais vendidos, em ordem (a linha DESTAQUES da loja). Completa a lista em 3 etapas:
    //   1. os mais vendidos dos últimos 90 dias;
    //   2. faltando, os mais vendidos desde sempre que ainda não estão na lista;
    //   3. faltando ainda, os cadastrados mais recentemente.
    // Só fica com menos de `limite` se a loja tiver menos produtos que isso.
    //
    // O ranking (a ordem dos ids) fica guardado na memória por 3 dias: somar todas as vendas a cada visita da
    // home custaria mais a cada pedido novo, e os mais vendidos mudam devagar. Os produtos em si (preço,
    // estoque, fotos) são lidos do banco a cada pedido, então aparecem sempre atualizados.
    // A memória é da instância: se a API reiniciar (deploy, ou o Cloud Run desligou por falta de visitas),
    // o ranking é refeito no primeiro pedido.
    static final Duration VALIDADE_DO_RANKING = Duration.ofDays(3);

    private record Ranking(List<UUID> ids, Instant valeAte) {}

    private volatile Ranking ranking;

    public List<ProductResponse> maisVendidos(int limite) {
        if (limite < 1 || limite > MAXIMO_DOS_MAIS_VENDIDOS) {
            throw new ParametroInvalidoException(
                    "O limite dos mais vendidos vai de 1 a " + MAXIMO_DOS_MAIS_VENDIDOS);
        }
        List<UUID> todos = rankingAtual().ids();
        List<UUID> ids = todos.subList(0, Math.min(limite, todos.size()));
        // busca os produtos de uma vez e devolve na ordem do ranking (um produto apagado depois do
        // cálculo só sai da lista)
        Map<UUID, Product> porId = productRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(p -> p.getId(), p -> p));
        return ids.stream().map(id -> porId.get(id)).filter(p -> p != null && p.isAtivo())
                .map(p -> toResponse(p)).toList();
    }

    // O ranking guardado, ou um novo se ainda não há ou se passou dos 3 dias
    private Ranking rankingAtual() {
        Ranking atual = ranking;
        if (atual == null || Instant.now().isAfter(atual.valeAte())) {
            atual = new Ranking(calcularRanking(MAXIMO_DOS_MAIS_VENDIDOS), Instant.now().plus(VALIDADE_DO_RANKING));
            ranking = atual;
        }
        return atual;
    }

    // Esquece o ranking guardado: o próximo pedido calcula de novo (usado nos testes)
    public void esquecerRanking() {
        ranking = null;
    }

    private List<UUID> calcularRanking(int limite) {
        Set<UUID> ids = new LinkedHashSet<>();
        // pede `limite` a mais em cada etapa: os que já estão na lista não contam
        Pageable pedido = PageRequest.of(0, limite * 2);
        LocalDateTime noventaDias = LocalDateTime.now().minusDays(DIAS_DOS_MAIS_VENDIDOS);
        completar(ids, orderItemRepository.maisVendidos(VENDIDO, noventaDias, pedido), limite);
        completar(ids, orderItemRepository.maisVendidos(VENDIDO, DESDE_SEMPRE, pedido), limite);
        if (ids.size() < limite) {
            Sort recentes = Sort.by(Sort.Order.desc("criadoEm"), Sort.Order.asc("id"));
            completar(ids, productRepository.findAll(FiltroDoCatalogo.ativos(true), PageRequest.of(0, limite * 2, recentes)).stream()
                    .map(p -> p.getId()).toList(), limite);
        }
        return List.copyOf(ids);
    }

    private static void completar(Set<UUID> ids, List<UUID> candidatos, int limite) {
        for (UUID id : candidatos) {
            if (ids.size() >= limite) return;
            ids.add(id);
        }
    }

    // Coloca o produto na loja (ativo) ou tira dela (inativo). O ranking guardado é refeito: um desativado
    // sai dos destaques, um ativado pode entrar
    @Transactional
    public ProductResponse mudarAtivo(UUID id, boolean ativo) {
        Product product = findOrThrow(id);
        product.setAtivo(ativo);
        ProductResponse resposta = toResponse(productRepository.save(product));
        esquecerRanking();
        return resposta;
    }

    // Os produtos fora da loja, para o painel (GET /products/inativos, com CATALOG_WRITE)
    public Pagina<ProductResponse> inativos(int pagina, int tamanho) {
        Pageable pedido = Pagina.pedido(pagina, tamanho, OrdemDoCatalogo.RECENTES.sort());
        return Pagina.de(productRepository.findAll(FiltroDoCatalogo.ativos(false), pedido).map(this::toResponse));
    }

    public ProductResponse findById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public ProductResponse findBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com slug: " + slug));
        return toResponse(product);
    }

    public ProductResponse create(ProductRequest request) {
        String slug = resolveSlug(request.getSlug(), request.getNome());
        if (productRepository.existsBySlug(slug)) {
            throw new ConflictException("Já existe um produto com o slug: " + slug);
        }
        Product product = new Product();
        product.setNome(request.getNome());
        product.setDescricao(request.getDescricao());
        product.setPreco(request.getPreco());
        product.setSlug(slug);
        product.setCriadoEm(LocalDateTime.now());
        // nasce fora da loja: aparece só depois de ativado (PATCH /products/{id}/ativar)
        product.setAtivo(false);
        if (request.getTagIds() == null) {
            throw new ParametroInvalidoException(REGRA_DAS_TAGS);
        }
        trocarTags(product, request.getTagIds());
        return toResponse(productRepository.save(product));
    }

    public ProductResponse update(UUID id, ProductRequest request) {
        Product product = findOrThrow(id);
        String slug = resolveSlug(request.getSlug(), request.getNome());
        if (!product.getSlug().equals(slug) && productRepository.existsBySlug(slug)) {
            throw new ConflictException("Já existe um produto com o slug: " + slug);
        }
        product.setNome(request.getNome());
        product.setDescricao(request.getDescricao());
        product.setPreco(request.getPreco());
        product.setSlug(slug);
        if (request.getTagIds() != null) {
            trocarTags(product, request.getTagIds());
        }
        return toResponse(productRepository.save(product));
    }

    // ------------------------------------------------------------------ tags obrigatórias

    static final String REGRA_DAS_TAGS =
            "O produto precisa de pelo menos uma tag de estilo e exatamente uma de categoria";

    // Troca todas as tags do produto pelas de `tagIds`, conferindo a regra antes de mexer
    private void trocarTags(Product product, List<UUID> tagIds) {
        List<ProductTag> novas = new LinkedHashSet<>(tagIds).stream()
                .map(productTagService::findEntityById)
                .toList();
        conferirRegra(novas);
        product.getTags().removeIf(link -> !novas.contains(link.getTag()));
        for (ProductTag tag : novas) {
            boolean jaTem = product.getTags().stream().anyMatch(link -> link.getTag().equals(tag));
            if (!jaTem) {
                product.getTags().add(new ProductTagLink(null, product, tag));
            }
        }
    }

    private static void conferirRegra(List<ProductTag> tags) {
        long estilos = tags.stream().filter(t -> t.getFiltro() == TagFiltro.ESTILO).count();
        long categorias = tags.stream().filter(t -> t.getFiltro() == TagFiltro.CATEGORIA).count();
        if (estilos < 1 || categorias != 1) {
            throw new ParametroInvalidoException(REGRA_DAS_TAGS
                    + " (vieram " + estilos + " de estilo e " + categorias + " de categoria)");
        }
    }

    // Apaga o produto, só se ele nunca esteve em um pedido (um cadastrado por engano, por exemplo). Se já
    // esteve, recusa (409): o caminho é desativar, que tira da loja sem mexer nos pedidos.
    // O histórico de estoque continua, com o SKU, e os carrinhos perdem o item
    @Transactional
    public void delete(UUID id) {
        Product product = findOrThrow(id);
        List<UUID> variantes = product.getVariantes().stream().map(v -> v.getId()).toList();
        if (!variantes.isEmpty()) {
            if (orderItemRepository.existsByVariantIdIn(variantes)) {
                throw new ConflictException("Este produto já esteve em um pedido e não pode ser apagado. "
                        + "Desative-o para tirá-lo da loja");
            }
            cartItemRepository.deleteByVariantIdIn(variantes);
            movementRepository.soltarVariantes(variantes);
        }
        // CascadeType.ALL remove variantes, imagens e tag links automaticamente
        productRepository.deleteById(id);
        productRepository.flush();
        // o produto podia estar no ranking guardado (pela parte das peças mais novas, que não têm venda):
        // o próximo pedido refaz o ranking, e os destaques continuam com o número pedido de peças
        esquecerRanking();
    }

    @Transactional
    public ProductResponse addTag(UUID productId, UUID tagId) {
        Product product = findOrThrow(productId);
        ProductTag tag = productTagService.findEntityById(tagId);
        boolean jaVinculada = product.getTags().stream()
                .anyMatch(link -> link.getTag().getId().equals(tagId));
        if (jaVinculada) {
            throw new ConflictException("A tag '" + tag.getTag() + "' já está vinculada a este produto");
        }
        // a categoria é uma só: para trocar, edite o produto com as tags novas (PUT com tagIds)
        if (tag.getFiltro() == TagFiltro.CATEGORIA
                && product.getTags().stream().anyMatch(link -> link.getTag().getFiltro() == TagFiltro.CATEGORIA)) {
            throw new BusinessException("O produto já tem uma categoria: " + REGRA_DAS_TAGS.toLowerCase());
        }
        ProductTagLink link = new ProductTagLink();
        link.setProduct(product);
        link.setTag(tag);
        product.getTags().add(link);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse removeTag(UUID productId, UUID tagId) {
        Product product = findOrThrow(productId);
        List<ProductTag> restantes = product.getTags().stream()
                .map(link -> link.getTag())
                .filter(t -> !t.getId().equals(tagId))
                .toList();
        if (restantes.size() == product.getTags().size()) {
            throw new ResourceNotFoundException("Tag " + tagId + " não está vinculada ao produto " + productId);
        }
        // tirar o único estilo ou a categoria deixaria o produto fora da regra
        try {
            conferirRegra(restantes);
        } catch (ParametroInvalidoException e) {
            throw new BusinessException("Essa tag não pode sair: " + REGRA_DAS_TAGS.toLowerCase());
        }
        product.getTags().removeIf(link -> link.getTag().getId().equals(tagId));
        return toResponse(productRepository.save(product));
    }

    public Product findEntityById(UUID id) {
        return findOrThrow(id);
    }

    // Gera slug a partir do nome: "Camiseta Polo" → "camiseta-polo"
    private String resolveSlug(String slugInformado, String nome) {
        String base = (slugInformado != null && !slugInformado.isBlank()) ? slugInformado : nome;
        return Normalizer.normalize(base, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "") // remove acentos
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")  // remove caracteres especiais
                .trim()
                .replaceAll("\\s+", "-");           // espaços viram hífens
    }

    private Product findOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto", id));
    }

    ProductResponse toResponse(Product product) {
        List<ProductImageResponse> imagens = product.getImagens().stream()
                .map(img -> new ProductImageResponse(img.getId(), img.getUrl(), img.getOrdem()))
                .toList();

        List<ProductTagResponse> tags = product.getTags().stream()
                .map(link -> ProductTagResponse.de(link.getTag()))
                .toList();

        List<ProductVariantResponse> variantes = product.getVariantes().stream()
                .map(v -> new ProductVariantResponse(
                        v.getId(),
                        v.getSku(),
                        new SizeResponse(v.getSize().getId(), v.getSize().getLabel()),
                        new ColorResponse(v.getColor().getId(), v.getColor().getNome(), v.getColor().getHex()),
                        v.getPreco() != null ? v.getPreco() : product.getPreco(),
                        v.getQuant(),
                        v.getCriadoEm()
                ))
                .toList();

        return new ProductResponse(
                product.getId(),
                product.getNome(),
                product.getDescricao(),
                product.getPreco(),
                product.getSlug(),
                product.getCriadoEm(),
                imagens,
                tags,
                variantes,
                product.isAtivo()
        );
    }
}
