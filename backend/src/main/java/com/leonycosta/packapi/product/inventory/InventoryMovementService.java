package com.leonycosta.packapi.product.inventory;

import com.leonycosta.packapi.enums.MovimentoTipo;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.product.product_variant.ProductVariant;
import com.leonycosta.packapi.product.product_variant.ProductVariantRepository;
import com.leonycosta.packapi.product.product_variant.ProductVariantService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryMovementService {

    private final InventoryMovementRepository movementRepository;
    private final ProductVariantService variantService;
    private final ProductVariantRepository variantRepository;
    private final EntityManager entityManager;

    public List<InventoryMovementResponse> findByVariant(UUID variantId) {
        return movementRepository.findByVariantId(variantId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public InventoryMovementResponse register(InventoryMovementRequest request) {
        ProductVariant variant = variantService.findEntityById(request.getVariantId());

        if (request.getTipoMovimentacao() == MovimentoTipo.AJUSTE && isBlank(request.getMotivo())) {
            throw new BusinessException("Motivo é obrigatório para movimentos do tipo AJUSTE");
        }

        travarEstoque(variant);
        applyToStock(variant, request.getTipoMovimentacao(), request.getQuantidade());
        variantRepository.save(variant);
        return toResponse(saveMovement(variant, request.getTipoMovimentacao(), request.getQuantidade(), request.getMotivo()));
    }

    // Chamado internamente pelo OrderService no checkout
    @Transactional
    public void registerSaida(ProductVariant variant, int quantidade, String motivo) {
        travarEstoque(variant);
        // confere de novo com o valor relido: outro checkout pode ter levado o estoque nesse meio-tempo
        variantService.validarEstoque(variant, quantidade);
        variant.setQuant(variant.getQuant() - quantidade);
        variantRepository.save(variant);
        saveMovement(variant, MovimentoTipo.SAIDA, quantidade, motivo);
    }

    // Chamado internamente pelo OrderService quando um pedido é cancelado
    @Transactional
    public void registerDevolucao(ProductVariant variant, int quantidade, String motivo) {
        travarEstoque(variant);
        variant.setQuant(variant.getQuant() + quantidade);
        variantRepository.save(variant);
        saveMovement(variant, MovimentoTipo.DEVOLUCAO, quantidade, motivo);
    }

    // Trava a linha da variante no banco (SELECT ... FOR UPDATE) até o fim da transação e relê o estoque.
    // Sem isso, dois checkouts ao mesmo tempo liam o mesmo estoque e os dois vendiam a última unidade.
    // Com a trava, a segunda transação espera a primeira terminar e já lê o valor atualizado.
    private void travarEstoque(ProductVariant variant) {
        entityManager.refresh(variant, LockModeType.PESSIMISTIC_WRITE);
    }

    private InventoryMovement saveMovement(ProductVariant variant, MovimentoTipo tipo, int quantidade, String motivo) {
        InventoryMovement movement = new InventoryMovement();
        movement.setVariant(variant);
        movement.setVariantSku(variant.getSku());
        movement.setTipoMovimentacao(tipo);
        movement.setQuantidade(quantidade);
        movement.setMotivo(motivo);
        movement.setData(LocalDateTime.now());
        return movementRepository.save(movement);
    }

    private void applyToStock(ProductVariant variant, MovimentoTipo tipo, int quantidade) {
        switch (tipo) {
            case ENTRADA, DEVOLUCAO -> variant.setQuant(variant.getQuant() + quantidade);
            case SAIDA -> {
                variantService.validarEstoque(variant, quantidade);
                variant.setQuant(variant.getQuant() - quantidade);
            }
            case AJUSTE -> variant.setQuant(quantidade); // define absoluto
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private InventoryMovementResponse toResponse(InventoryMovement m) {
        return new InventoryMovementResponse(
                m.getId(), m.getVariantSku(), m.getTipoMovimentacao(),
                m.getQuantidade(), m.getMotivo(), m.getData()
        );
    }
}
