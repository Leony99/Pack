package com.leonycosta.packapi.product.product_tag;

import com.leonycosta.packapi.enums.TagFiltro;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
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
        productTag.setFiltro(request.getFiltro());
        return toResponse(productTagRepository.save(productTag));
    }

    // Renomear é livre. O filtro só muda se nenhum produto usa a tag: todo produto precisa de um
    // estilo e de uma categoria, e trocar o filtro de uma tag em uso tiraria isso deles sem aviso
    @Transactional
    public ProductTagResponse update(UUID id, ProductTagRequest request) {
        ProductTag productTag = findOrThrow(id);
        String novaTag = request.getTag().toLowerCase();
        boolean mudou = !productTag.getTag().equals(novaTag) || !Objects.equals(productTag.getFiltro(), request.getFiltro());
        if (TagsIniciais.ehFixa(productTag) && mudou) {
            throw new ConflictException("A tag '" + productTag.getTag() + "' é um estilo fixo da loja e não muda");
        }
        if (!productTag.getTag().equals(novaTag) && productTagRepository.existsByTag(novaTag)) {
            throw new ConflictException("Tag já cadastrada: " + novaTag);
        }
        if (!Objects.equals(productTag.getFiltro(), request.getFiltro()) && !productTag.getLinks().isEmpty()) {
            throw new BusinessException("A tag '" + productTag.getTag() + "' está em " + productTag.getLinks().size()
                    + " produto(s): o filtro só muda numa tag sem produtos");
        }
        productTag.setTag(novaTag);
        productTag.setFiltro(request.getFiltro());
        return toResponse(productTagRepository.save(productTag));
    }

    // Apagar tira a tag dos produtos. Uma tag de estilo ou de categoria em uso não pode sair:
    // os produtos dela ficariam sem estilo ou sem categoria
    @Transactional
    public void delete(UUID id) {
        ProductTag tag = findOrThrow(id);
        if (TagsIniciais.ehFixa(tag)) {
            throw new ConflictException("A tag '" + tag.getTag() + "' é um estilo fixo da loja e não pode ser apagada");
        }
        boolean obrigatoria = tag.getFiltro() == TagFiltro.ESTILO || tag.getFiltro() == TagFiltro.CATEGORIA;
        if (obrigatoria && !tag.getLinks().isEmpty()) {
            throw new ConflictException("A tag '" + tag.getTag() + "' é de " + tag.getFiltro().name().toLowerCase()
                    + " e está em " + tag.getLinks().size() + " produto(s): troque a tag desses produtos antes");
        }
        // CascadeType.ALL na entidade remove os ProductTagLinks automaticamente
        productTagRepository.delete(tag);
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
        return ProductTagResponse.de(tag);
    }
}
