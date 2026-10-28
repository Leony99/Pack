package com.leonycosta.packapi.staff.role;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Papéis", description = "Papéis de acesso e suas permissões. Exige STAFF_MANAGE.")
@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @Operation(summary = "Lista os papéis com as permissões")
    @GetMapping
    public List<RoleResponse> findAll() {
        return roleService.findAll();
    }

    @Operation(summary = "Cria um papel")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoleResponse create(@Valid @RequestBody RoleRequest request) {
        return roleService.create(request);
    }

    @Operation(summary = "Dá uma permissão ao papel (vale no próximo login)")
    @PostMapping("/{roleId}/permissions/{permissionId}")
    public RoleResponse addPermission(@PathVariable UUID roleId, @PathVariable UUID permissionId) {
        return roleService.addPermission(roleId, permissionId);
    }

    @Operation(summary = "Tira uma permissão do papel (vale no próximo login)")
    @DeleteMapping("/{roleId}/permissions/{permissionId}")
    public RoleResponse removePermission(@PathVariable UUID roleId, @PathVariable UUID permissionId) {
        return roleService.removePermission(roleId, permissionId);
    }
}
