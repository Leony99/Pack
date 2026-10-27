package com.leonycosta.packapi.staff.role;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public List<RoleResponse> findAll() {
        return roleService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoleResponse create(@Valid @RequestBody RoleRequest request) {
        return roleService.create(request);
    }

    @PostMapping("/{roleId}/permissions/{permissionId}")
    public RoleResponse addPermission(@PathVariable UUID roleId, @PathVariable UUID permissionId) {
        return roleService.addPermission(roleId, permissionId);
    }

    @DeleteMapping("/{roleId}/permissions/{permissionId}")
    public RoleResponse removePermission(@PathVariable UUID roleId, @PathVariable UUID permissionId) {
        return roleService.removePermission(roleId, permissionId);
    }
}
