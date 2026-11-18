package com.leonycosta.packapi.staff.staff;

import org.springframework.data.domain.Sort;
import com.leonycosta.packapi.config.Pagina;
import com.leonycosta.packapi.staff.role.Role;
import com.leonycosta.packapi.staff.role.RoleService;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffRepository staffRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Pagina<StaffResponse> findAll(int pagina, int tamanho) {
        Sort ordem = Sort.by("nome", "id");
        return Pagina.de(staffRepository.findAll(Pagina.pedido(pagina, tamanho, ordem)).map(this::toResponse));
    }

    @Transactional
    public StaffResponse create(StaffRequest request) {
        String email = request.getEmail().toLowerCase();
        if (staffRepository.existsByEmail(email)) {
            throw new ConflictException("Email já cadastrado: " + email);
        }
        Role role = roleService.findEntityById(request.getRoleId());
        Staff staff = new Staff(null, request.getNome(), email, passwordEncoder.encode(request.getSenha()), role);
        return toResponse(staffRepository.save(staff));
    }

    // Edita o funcionário. Quem gerencia a equipe não tira de si mesmo o papel que permite isso (senão a loja
    // podia ficar sem ninguém para gerenciar a equipe)
    @org.springframework.transaction.annotation.Transactional
    public StaffResponse update(UUID id, StaffUpdateRequest request, UUID usuarioLogado) {
        Staff s = staffRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Funcionário", id));
        var role = roleService.findEntityById(request.roleId());
        boolean gerencia = role.getPermissoes().stream()
                .anyMatch(rp -> rp.getPermission().getNome().equals("STAFF_MANAGE"));
        if (id.equals(usuarioLogado) && !gerencia) {
            throw new BusinessException("Você não pode tirar de si mesmo o acesso à equipe");
        }
        String email = request.email().strip().toLowerCase(java.util.Locale.ROOT);
        staffRepository.findByEmail(email).filter(outro -> !outro.getId().equals(id)).ifPresent(outro -> {
            throw new com.leonycosta.packapi.exception.ConflictException("Email já cadastrado: " + email);
        });
        s.setNome(request.nome().strip());
        s.setEmail(email);
        s.setRole(role);
        return toResponse(staffRepository.save(s));
    }

    public void delete(UUID id, UUID usuarioLogado) {
        if (id.equals(usuarioLogado)) {
            throw new BusinessException("Você não pode remover a própria conta");
        }
        if (!staffRepository.existsById(id)) {
            throw new ResourceNotFoundException("Funcionário", id);
        }
        staffRepository.deleteById(id);
    }

    private StaffResponse toResponse(Staff s) {
        return new StaffResponse(s.getId(), s.getNome(), s.getEmail(), roleService.toResponse(s.getRole()));
    }
}
