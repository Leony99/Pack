package com.leonycosta.packapi.auth;

import com.leonycosta.packapi.staff.staff.Staff;
import com.leonycosta.packapi.staff.staff.StaffRepository;
import com.leonycosta.packapi.customer.customer.Customer;
import com.leonycosta.packapi.customer.customer.CustomerRepository;
import com.leonycosta.packapi.customer.customer.CustomerRequest;
import com.leonycosta.packapi.customer.customer.CustomerResponse;
import com.leonycosta.packapi.customer.customer.CustomerService;
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
    private final LimiteDeTentativas limite;

    // Cadastro do cliente: cria a conta (e o carrinho) e já devolve o token, sem precisar logar de novo
    @Transactional
    public TokenResponse register(RegisterRequest request, String ip) {
        limite.verificarECadastrar(ip);
        CustomerRequest dados = new CustomerRequest(request.getNome(), request.getEmail(), request.getTelefone());
        CustomerResponse c = customerService.create(dados, passwordEncoder.encode(request.getSenha()));
        return tokenService.gerar(c.getId(), c.getNome(), c.getEmail(), TipoUsuario.CUSTOMER, CUSTOMER_AUTHORITIES);
    }

    // ip: quem está tentando (ver LimiteDeTentativas). Bloqueado → 429 antes de rodar o BCrypt.
    public TokenResponse loginCustomer(LoginRequest request, String ip) {
        String email = request.getEmail().toLowerCase();
        limite.verificarLogin(ip, email);
        Customer c = customerRepository.findByEmail(email)
                .filter(x -> senhaConfere(request.getSenha(), x.getSenhaHash()))
                .orElseThrow(() -> falhou(ip, email));
        limite.loginCerto(ip, email);
        return tokenService.gerar(c.getId(), c.getNome(), c.getEmail(), TipoUsuario.CUSTOMER, CUSTOMER_AUTHORITIES);
    }

    @Transactional(readOnly = true)
    public TokenResponse loginStaff(LoginRequest request, String ip) {
        String email = request.getEmail().toLowerCase();
        limite.verificarLogin(ip, email);
        Staff s = staffRepository.findByEmail(email)
                .filter(x -> senhaConfere(request.getSenha(), x.getSenhaHash()))
                .orElseThrow(() -> falhou(ip, email));
        limite.loginCerto(ip, email);
        // O token leva as permissões da Role só para o frontend saber o que mostrar.
        // A API não confia nelas: a cada requisição, lê as permissões atuais no banco (TokenAuthenticationConverter).
        List<String> permissoes = s.getRole().getPermissoes().stream()
                .map(rp -> rp.getPermission().getNome())
                .sorted()
                .toList();
        return tokenService.gerar(s.getId(), s.getNome(), s.getEmail(), TipoUsuario.STAFF, permissoes);
    }

    private UnauthorizedException falhou(String ip, String email) {
        limite.loginFalhou(ip, email);
        return UnauthorizedException.credenciaisInvalidas();
    }

    private boolean senhaConfere(String senha, String hash) {
        return hash != null && passwordEncoder.matches(senha, hash);
    }
}
