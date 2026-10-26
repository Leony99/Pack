package com.leonycosta.packapi.product.product_tag;

import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductTagService {

    private final ProductTagRepository productTagRepository;

    public List<ProductTagResponse> findAll() {
        return productTagRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductTagResponse findById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public ProductTagResponse create(ProductTagRequest request) {
        String tag = request.getTag().toLowerCase();
        if (productTagRepository.existsByTag(tag)) {
            throw new ConflictException("Tag já cadastrada: " + tag);
        }
        ProductTag productTag = new ProductTag();
        productTag.setTag(tag);
        return toResponse(productTagRepository.save(productTag));
    }

    public ProductTagResponse update(UUID id, ProductTagRequest request) {
        ProductTag productTag = findOrThrow(id);
        String novaTag = request.getTag().toLowerCase();
        if (!productTag.getTag().equals(novaTag) && productTagRepository.existsByTag(novaTag)) {
            throw new ConflictException("Tag já cadastrada: " + novaTag);
        }
        productTag.setTag(novaTag);
        return toResponse(productTagRepository.save(productTag));
    }

    public void delete(UUID id) {
        findOrThrow(id);
        // CascadeType.ALL na entidade remove os ProductTagLinks automaticamente
        productTagRepository.deleteById(id);
    }

    // Usado internamente por outros services (ex: ProductService)
    public ProductTag findEntityById(UUID id) {
        return findOrThrow(id);
    }

    private ProductTag findOrThrow(UUID id) {
        return productTagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", id));
    }

    private ProductTagResponse toResponse(ProductTag tag) {
        return new ProductTagResponse(tag.getId(), tag.getTag());
    }
}
