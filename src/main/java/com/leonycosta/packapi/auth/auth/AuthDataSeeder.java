package com.leonycosta.packapi.auth.auth;

import com.leonycosta.packapi.auth.permission.Permissao;
import com.leonycosta.packapi.auth.permission.Permission;
import com.leonycosta.packapi.auth.permission.PermissionRepository;
import com.leonycosta.packapi.auth.role.Role;
import com.leonycosta.packapi.auth.role.RoleRepository;
import com.leonycosta.packapi.auth.role_permission.RolePermission;
import com.leonycosta.packapi.auth.staff.Staff;
import com.leonycosta.packapi.auth.staff.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import static com.leonycosta.packapi.auth.permission.Permissao.*;

// Roda ao subir a aplicação: garante que as permissões, os papéis padrão e o admin inicial existam.
// Só cria o que falta, então pode rodar quantas vezes for preciso.
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthDataSeeder implements ApplicationRunner {

    private static final Map<String, Set<Permissao>> PAPEIS_PADRAO = Map.of(
            "ADMIN", EnumSet.allOf(Permissao.class),
            "ESTOQUISTA", EnumSet.of(CATALOG_WRITE, INVENTORY_MANAGE),
            "ATENDENTE", EnumSet.of(ORDER_MANAGE, CUSTOMER_READ)
    );
    private static final String SENHA_PADRAO_ADMIN = "admin12345";

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.senha}")
    private String adminSenha;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Map<Permissao, Permission> permissoes = new EnumMap<>(Permissao.class);
        for (Permissao p : Permissao.values()) {
            permissoes.put(p, permissionRepository.findByNome(p.name())
                    .orElseGet(() -> permissionRepository.save(new Permission(null, p.name()))));
        }

        PAPEIS_PADRAO.forEach((nome, lista) -> {
            Role role = roleRepository.findByNome(nome).orElseGet(() -> {
                Role novo = new Role();
                novo.setNome(nome);
                return novo;
            });
            for (Permissao p : lista) {
                boolean jaTem = role.getPermissoes().stream()
                        .anyMatch(rp -> rp.getPermission().getNome().equals(p.name()));
                if (!jaTem) {
                    role.getPermissoes().add(new RolePermission(null, role, permissoes.get(p)));
                }
            }
            roleRepository.save(role);
        });

        String email = adminEmail.toLowerCase();
        if (!staffRepository.existsByEmail(email)) {
            Role admin = roleRepository.findByNome("ADMIN").orElseThrow();
            staffRepository.save(new Staff(null, "Administrador", email, passwordEncoder.encode(adminSenha), admin));
            log.info("Admin inicial criado: {}", email);
            if (SENHA_PADRAO_ADMIN.equals(adminSenha)) {
                log.warn("O admin está usando a senha padrão. Defina ADMIN_PASSWORD fora do ambiente local.");
            }
        }
    }
}
