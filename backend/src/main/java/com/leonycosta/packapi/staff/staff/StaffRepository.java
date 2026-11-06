package com.leonycosta.packapi.staff.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StaffRepository extends JpaRepository<Staff, UUID> {
    Optional<Staff> findByEmail(String email);
    boolean existsByEmail(String email);

    // Nomes das permissões que o papel do funcionário tem agora (lido a cada requisição de funcionário).
    // Funcionário inexistente → lista vazia; papel sem permissões → uma linha com null.
    @Query("""
            select p.nome from Staff s
            join s.role r left join r.permissoes rp left join rp.permission p
            where s.id = :id""")
    List<String> findPermissoesAtuais(@Param("id") UUID id);
}