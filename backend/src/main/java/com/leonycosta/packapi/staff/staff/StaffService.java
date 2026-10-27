package com.leonycosta.packapi.staff.staff;

import com.leonycosta.packapi.staff.role.Role;
import com.leonycosta.packapi.staff.role.RoleService;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffRepository staffRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<StaffResponse> findAll() {
        return staffRepository.findAll().stream().map(this::toResponse).toList();
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
