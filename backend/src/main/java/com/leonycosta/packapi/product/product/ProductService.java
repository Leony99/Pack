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
import com.leonycosta.packapi.product.product_variant.ProductVariantResponse;
import com.leonycosta.packapi.product.color.ColorResponse;
import com.leonycosta.packapi.product.size.SizeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
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
        return Pagina.de(productRepository.findAll(Pagina.pedido(pagina, tamanho, ORDEM)).map(this::toResponse));
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
    public List<ProductResponse> maisVendidos(int limite) {
        if (limite < 1 || limite > MAXIMO_DOS_MAIS_VENDIDOS) {
            throw new ParametroInvalidoException(
                    "O limite dos mais vendidos vai de 1 a " + MAXIMO_DOS_MAIS_VENDIDOS);
        }
        Set<UUID> ids = new LinkedHashSet<>();
        // pede `limite` a mais em cada etapa: os que já estão na lista não contam
        Pageable pedido = PageRequest.of(0, limite * 2);
        LocalDateTime noventaDias = LocalDateTime.now().minusDays(DIAS_DOS_MAIS_VENDIDOS);
        completar(ids, orderItemRepository.maisVendidos(VENDIDO, noventaDias, pedido), limite);
        completar(ids, orderItemRepository.maisVendidos(VENDIDO, DESDE_SEMPRE, pedido), limite);
        if (ids.size() < limite) {
            Sort recentes = Sort.by(Sort.Order.desc("criadoEm"), Sort.Order.asc("id"));
            completar(ids, productRepository.findAll(PageRequest.of(0, limite * 2, recentes)).stream()
                    .map(p -> p.getId()).toList(), limite);
        }
        // busca os produtos de uma vez e devolve na ordem do ranking
        Map<UUID, Product> porId = productRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(p -> p.getId(), p -> p));
        return ids.stream().map(porId::get).map(this::toResponse).toList();
    }

    private static void completar(Set<UUID> ids, List<UUID> candidatos, int limite) {
        for (UUID id : candidatos) {
            if (ids.size() >= limite) return;
            ids.add(id);
        }
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

    public void delete(UUID id) {
        findOrThrow(id);
        // CascadeType.ALL remove variantes, imagens e tag links automaticamente
        productRepository.deleteById(id);
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
                variantes
        );
    }
}
