package com.leonycosta.packapi.staff.staff;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Funcionários", description = "Exige STAFF_MANAGE.")
@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @Operation(summary = "Lista os funcionários")
    @GetMapping
    public List<StaffResponse> findAll() {
        return staffService.findAll();
    }

    @Operation(summary = "Cadastra um funcionário com um papel")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffResponse create(@Valid @RequestBody StaffRequest request) {
        return staffService.create(request);
    }

    @Operation(summary = "Apaga um funcionário (não é possível apagar a si mesmo)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        staffService.delete(id, UUID.fromString(jwt.getSubject()));
    }
}
