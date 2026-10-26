package com.leonycosta.packapi.product.color;

import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ColorService {

    private final ColorRepository colorRepository;

    public List<ColorResponse> findAll() {
        return colorRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public ColorResponse findById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public ColorResponse create(ColorRequest request) {
        if (colorRepository.existsByNomeIgnoreCase(request.getNome())) {
            throw new ConflictException("Cor já cadastrada: " + request.getNome());
        }
        Color color = new Color();
        color.setNome(request.getNome());
        color.setHex(request.getHex().toUpperCase());
        return toResponse(colorRepository.save(color));
    }

    public ColorResponse update(UUID id, ColorRequest request) {
        Color color = findOrThrow(id);
        if (!color.getNome().equalsIgnoreCase(request.getNome())
                && colorRepository.existsByNomeIgnoreCase(request.getNome())) {
            throw new ConflictException("Cor já cadastrada: " + request.getNome());
        }
        color.setNome(request.getNome());
        color.setHex(request.getHex().toUpperCase());
        return toResponse(colorRepository.save(color));
    }

    public void delete(UUID id) {
        findOrThrow(id);
        colorRepository.deleteById(id);
    }

    private Color findOrThrow(UUID id) {
        return colorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cor", id));
    }

    private ColorResponse toResponse(Color color) {
        return new ColorResponse(color.getId(), color.getNome(), color.getHex());
    }
}
