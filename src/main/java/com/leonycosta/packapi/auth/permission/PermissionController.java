package com.leonycosta.packapi.auth.permission;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Só leitura: as permissões vêm do enum Permissao e são criadas pelo AuthDataSeeder
@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionRepository permissionRepository;

    @GetMapping
    public List<PermissionResponse> findAll() {
        return permissionRepository.findAll().stream()
                .map(p -> new PermissionResponse(p.getId(), p.getNome()))
                .sorted((a, b) -> a.getNome().compareTo(b.getNome()))
                .toList();
    }
}
