package com.leonycosta.packapi.product.size;

import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SizeService {

    private final SizeRepository sizeRepository;

    public List<SizeResponse> findAll() {
        return sizeRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public SizeResponse findById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public SizeResponse create(SizeRequest request) {
        if (sizeRepository.existsByLabelIgnoreCase(request.getLabel())) {
            throw new ConflictException("Tamanho já cadastrado: " + request.getLabel());
        }
        Size size = new Size();
        size.setLabel(request.getLabel().toUpperCase());
        return toResponse(sizeRepository.save(size));
    }

    public SizeResponse update(UUID id, SizeRequest request) {
        Size size = findOrThrow(id);
        String novoLabel = request.getLabel().toUpperCase();
        if (!size.getLabel().equals(novoLabel) && sizeRepository.existsByLabelIgnoreCase(novoLabel)) {
            throw new ConflictException("Tamanho já cadastrado: " + novoLabel);
        }
        size.setLabel(novoLabel);
        return toResponse(sizeRepository.save(size));
    }

    public void delete(UUID id) {
        findOrThrow(id);
        sizeRepository.deleteById(id);
    }

    private Size findOrThrow(UUID id) {
        return sizeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tamanho", id));
    }

    private SizeResponse toResponse(Size size) {
        return new SizeResponse(size.getId(), size.getLabel());
    }
}
