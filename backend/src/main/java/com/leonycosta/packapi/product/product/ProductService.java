package com.leonycosta.packapi.product.product;

import com.leonycosta.packapi.exception.ConflictException;
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
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductTagService productTagService;

    public List<ProductResponse> findAll() {
        return productRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ProductResponse> search(String nome) {
        return productRepository.searchByNome(nome).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ProductResponse> findByTag(String tag) {
        return productRepository.findByTag(tag.toLowerCase()).stream()
                .map(this::toResponse)
                .toList();
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
        return toResponse(productRepository.save(product));
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
        ProductTagLink link = new ProductTagLink();
        link.setProduct(product);
        link.setTag(tag);
        product.getTags().add(link);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse removeTag(UUID productId, UUID tagId) {
        Product product = findOrThrow(productId);
        boolean removida = product.getTags().removeIf(link -> link.getTag().getId().equals(tagId));
        if (!removida) {
            throw new ResourceNotFoundException("Tag " + tagId + " não está vinculada ao produto " + productId);
        }
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
                .map(link -> new ProductTagResponse(link.getTag().getId(), link.getTag().getTag()))
                .toList();

        List<ProductVariantResponse> variantes = product.getVariantes().stream()
                .map(v -> new ProductVariantResponse(
                        v.getId(),
                        v.getSku(),
                        new SizeResponse(v.getSize().getId(), v.getSize().getLabel()),
                        new ColorResponse(v.getColor().getId(), v.getColor().getNome(), v.getColor().getHex()),
                        v.getPreco() != null ? v.getPreco() : product.getPreco(),
                        v.getQuant()
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
