package com.leonycosta.packapi.auth.role;

import com.leonycosta.packapi.auth.permission.Permission;
import com.leonycosta.packapi.auth.permission.PermissionRepository;
import com.leonycosta.packapi.auth.permission.PermissionResponse;
import com.leonycosta.packapi.auth.role_permission.RolePermission;
import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<RoleResponse> findAll() {
        return roleRepository.findAll().stream().map(this::toResponse).toList();
    }

    public RoleResponse create(RoleRequest request) {
        String nome = request.getNome().toUpperCase();
        if (roleRepository.findByNome(nome).isPresent()) {
            throw new ConflictException("Papel já cadastrado: " + nome);
        }
        Role role = new Role();
        role.setNome(nome);
        return toResponse(roleRepository.save(role));
    }

    // As permissões passam pela lista do Role (orphanRemoval): o Hibernate insere e apaga o vínculo sozinho
    @Transactional
    public RoleResponse addPermission(UUID roleId, UUID permissionId) {
        Role role = findEntityById(roleId);
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permissão", permissionId));
        boolean jaTem = role.getPermissoes().stream().anyMatch(rp -> rp.getPermission().getId().equals(permissionId));
        if (jaTem) {
            throw new ConflictException("O papel " + role.getNome() + " já tem a permissão " + permission.getNome());
        }
        role.getPermissoes().add(new RolePermission(null, role, permission));
        return toResponse(roleRepository.save(role));
    }

    @Transactional
    public RoleResponse removePermission(UUID roleId, UUID permissionId) {
        Role role = findEntityById(roleId);
        if (!role.getPermissoes().removeIf(rp -> rp.getPermission().getId().equals(permissionId))) {
            throw new ResourceNotFoundException("O papel " + role.getNome() + " não tem essa permissão");
        }
        return toResponse(roleRepository.save(role));
    }

    public Role findEntityById(UUID id) {
        return roleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Papel", id));
    }

    public RoleResponse toResponse(Role role) {
        List<PermissionResponse> permissoes = role.getPermissoes().stream()
                .map(rp -> new PermissionResponse(rp.getPermission().getId(), rp.getPermission().getNome()))
                .sorted((a, b) -> a.getNome().compareTo(b.getNome()))
                .toList();
        return new RoleResponse(role.getId(), role.getNome(), permissoes);
    }
}
