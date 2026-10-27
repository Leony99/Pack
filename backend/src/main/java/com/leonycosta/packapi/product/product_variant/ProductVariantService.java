package com.leonycosta.packapi.product.product_variant;

import com.leonycosta.packapi.product.color.Color;
import com.leonycosta.packapi.product.color.ColorRepository;
import com.leonycosta.packapi.product.color.ColorResponse;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import com.leonycosta.packapi.product.product.Product;
import com.leonycosta.packapi.product.product.ProductService;
import com.leonycosta.packapi.product.size.Size;
import com.leonycosta.packapi.product.size.SizeRepository;
import com.leonycosta.packapi.product.size.SizeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductVariantService {

    private final ProductVariantRepository variantRepository;
    private final ProductService productService;
    private final SizeRepository sizeRepository;
    private final ColorRepository colorRepository;

    public List<ProductVariantResponse> findByProduct(UUID productId) {
        return variantRepository.findByProductId(productId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductVariantResponse findById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public List<ProductVariantResponse> findEstoqueBaixo(int limite) {
        return variantRepository.findEstoqueBaixo(limite).stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductVariantResponse create(UUID productId, ProductVariantRequest request) {
        Product product = productService.findEntityById(productId);
        String sku = request.getSku().toUpperCase();

        if (variantRepository.existsBySku(sku)) {
            throw new ConflictException("SKU já cadastrado: " + sku);
        }

        Size size = sizeRepository.findById(request.getSizeId())
                .orElseThrow(() -> new ResourceNotFoundException("Tamanho", request.getSizeId()));

        Color color = colorRepository.findById(request.getColorId())
                .orElseThrow(() -> new ResourceNotFoundException("Cor", request.getColorId()));

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSize(size);
        variant.setColor(color);
        variant.setSku(sku);
        variant.setPreco(request.getPreco());
        variant.setQuant(request.getQuant());

        return toResponse(variantRepository.save(variant));
    }

    public ProductVariantResponse update(UUID id, ProductVariantRequest request) {
        ProductVariant variant = findOrThrow(id);
        String sku = request.getSku().toUpperCase();

        if (!variant.getSku().equals(sku) && variantRepository.existsBySku(sku)) {
            throw new ConflictException("SKU já cadastrado: " + sku);
        }

        Size size = sizeRepository.findById(request.getSizeId())
                .orElseThrow(() -> new ResourceNotFoundException("Tamanho", request.getSizeId()));

        Color color = colorRepository.findById(request.getColorId())
                .orElseThrow(() -> new ResourceNotFoundException("Cor", request.getColorId()));

        variant.setSku(sku);
        variant.setSize(size);
        variant.setColor(color);
        variant.setPreco(request.getPreco());
        variant.setQuant(request.getQuant());

        return toResponse(variantRepository.save(variant));
    }

    public void delete(UUID id) {
        findOrThrow(id);
        variantRepository.deleteById(id);
    }

    // Usado pelo OrderService e CartService: retorna a entidade e valida estoque
    public ProductVariant findEntityById(UUID id) {
        return findOrThrow(id);
    }

    public void validarEstoque(ProductVariant variant, int quantidadeDesejada) {
        if (variant.getQuant() < quantidadeDesejada) {
            throw new BusinessException(
                    "Estoque insuficiente para o SKU " + variant.getSku()
                    + ". Disponível: " + variant.getQuant()
                    + ", solicitado: " + quantidadeDesejada
            );
        }
    }

    private ProductVariant findOrThrow(UUID id) {
        return variantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Variante", id));
    }

    private ProductVariantResponse toResponse(ProductVariant v) {
        Product product = v.getProduct();
        return new ProductVariantResponse(
                v.getId(),
                v.getSku(),
                new SizeResponse(v.getSize().getId(), v.getSize().getLabel()),
                new ColorResponse(v.getColor().getId(), v.getColor().getNome(), v.getColor().getHex()),
                v.getPreco() != null ? v.getPreco() : product.getPreco(),
                v.getQuant()
        );
    }
}
