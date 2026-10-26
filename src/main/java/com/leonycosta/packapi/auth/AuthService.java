package com.leonycosta.packapi.auth;

import com.leonycosta.packapi.auth.staff.Staff;
import com.leonycosta.packapi.auth.staff.StaffRepository;
import com.leonycosta.packapi.customer.Customer;
import com.leonycosta.packapi.customer.CustomerRepository;
import com.leonycosta.packapi.customer.CustomerRequest;
import com.leonycosta.packapi.customer.CustomerResponse;
import com.leonycosta.packapi.customer.CustomerService;
import com.leonycosta.packapi.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final List<String> CUSTOMER_AUTHORITIES = List.of(TipoUsuario.CUSTOMER.name());

    private final CustomerService customerService;
    private final CustomerRepository customerRepository;
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    // Cadastro do cliente: cria a conta (e o carrinho) e já devolve o token, sem precisar logar de novo
    @Transactional
    public TokenResponse register(RegisterRequest request) {
        CustomerRequest dados = new CustomerRequest(request.getNome(), request.getEmail(), request.getTelefone());
        CustomerResponse c = customerService.create(dados, passwordEncoder.encode(request.getSenha()));
        return tokenService.gerar(c.getId(), c.getNome(), c.getEmail(), TipoUsuario.CUSTOMER, CUSTOMER_AUTHORITIES);
    }

    public TokenResponse loginCustomer(LoginRequest request) {
        Customer c = customerRepository.findByEmail(request.getEmail().toLowerCase())
                .filter(x -> senhaConfere(request.getSenha(), x.getSenhaHash()))
                .orElseThrow(UnauthorizedException::credenciaisInvalidas);
        return tokenService.gerar(c.getId(), c.getNome(), c.getEmail(), TipoUsuario.CUSTOMER, CUSTOMER_AUTHORITIES);
    }

    @Transactional(readOnly = true)
    public TokenResponse loginStaff(LoginRequest request) {
        Staff s = staffRepository.findByEmail(request.getEmail().toLowerCase())
                .filter(x -> senhaConfere(request.getSenha(), x.getSenhaHash()))
                .orElseThrow(UnauthorizedException::credenciaisInvalidas);
        // O token leva as permissões da Role: mudar a Role só vale a partir do próximo login
        List<String> permissoes = s.getRole().getPermissoes().stream()
                .map(rp -> rp.getPermission().getNome())
                .sorted()
                .toList();
        return tokenService.gerar(s.getId(), s.getNome(), s.getEmail(), TipoUsuario.STAFF, permissoes);
    }

    private boolean senhaConfere(String senha, String hash) {
        return hash != null && passwordEncoder.matches(senha, hash);
    }
}
