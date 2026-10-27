package com.leonycosta.packapi.product.product_image;

import com.leonycosta.packapi.exception.ResourceNotFoundException;
import com.leonycosta.packapi.product.product.Product;
import com.leonycosta.packapi.product.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductImageService {

    private final ProductImageRepository imageRepository;
    private final ProductService productService;

    public List<ProductImageResponse> findByProduct(UUID productId) {
        return imageRepository.findByProductIdOrderByOrdem(productId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductImageResponse create(UUID productId, ProductImageRequest request) {
        Product product = productService.findEntityById(productId);
        ProductImage image = new ProductImage();
        image.setProduct(product);
        image.setUrl(request.getUrl());
        image.setOrdem(request.getOrdem());
        return toResponse(imageRepository.save(image));
    }

    public ProductImageResponse update(UUID id, ProductImageRequest request) {
        ProductImage image = findOrThrow(id);
        image.setUrl(request.getUrl());
        image.setOrdem(request.getOrdem());
        return toResponse(imageRepository.save(image));
    }

    public void delete(UUID id) {
        findOrThrow(id);
        imageRepository.deleteById(id);
    }

    private ProductImage findOrThrow(UUID id) {
        return imageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Imagem", id));
    }

    private ProductImageResponse toResponse(ProductImage image) {
        return new ProductImageResponse(image.getId(), image.getUrl(), image.getOrdem());
    }
}
