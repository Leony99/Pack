package com.leonycosta.packapi.auth;

import com.leonycosta.packapi.staff.staff.Staff;
import com.leonycosta.packapi.staff.staff.StaffRepository;
import com.leonycosta.packapi.customer.customer.Customer;
import com.leonycosta.packapi.customer.customer.CustomerRepository;
import com.leonycosta.packapi.customer.customer.CustomerRequest;
import com.leonycosta.packapi.customer.customer.CustomerResponse;
import com.leonycosta.packapi.customer.customer.CustomerService;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

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
        return tokenService.gerar(c.getId(), c.getNome(), c.getEmail(), TipoUsuario.CUSTOMER, CUSTOMER_AUTHORITIES, null);
    }

    // ip: quem está tentando (ver LimiteDeTentativas). Bloqueado → 429 antes de rodar o BCrypt.
    public TokenResponse loginCustomer(LoginRequest request, String ip) {
        String email = request.getEmail().toLowerCase();
        limite.verificarLogin(ip, email);
        Customer c = customerRepository.findByEmail(email)
                .filter(x -> senhaConfere(request.getSenha(), x.getSenhaHash()))
                .orElseThrow(() -> falhou(ip, email));
        limite.loginCerto(ip, email);
        return tokenService.gerar(c.getId(), c.getNome(), c.getEmail(), TipoUsuario.CUSTOMER, CUSTOMER_AUTHORITIES, null);
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
        return tokenService.gerar(s.getId(), s.getNome(), s.getEmail(), TipoUsuario.STAFF, permissoes, s.getRole().getNome());
    }

    // Os dados atuais de quem está logado (GET /auth/me). Apagado depois do login: 401, como um token inválido
    @Transactional(readOnly = true)
    public UsuarioResponse quemSou(UUID id, TipoUsuario tipo, List<String> permissoes) {
        if (tipo == TipoUsuario.CUSTOMER) {
            Customer c = customerRepository.findById(id).orElseThrow(UnauthorizedException::credenciaisInvalidas);
            return new UsuarioResponse(c.getId(), c.getNome(), c.getEmail(), tipo, permissoes, null);
        }
        Staff s = staffRepository.findById(id).orElseThrow(UnauthorizedException::credenciaisInvalidas);
        return new UsuarioResponse(s.getId(), s.getNome(), s.getEmail(), tipo, permissoes, s.getRole().getNome());
    }

    // Troca a senha de quem está logado. A senha atual errada conta como tentativa de login (o mesmo limite
    // por e-mail e IP), para o token roubado de alguém não servir para adivinhar a senha dele.
    // O token atual continua valendo até expirar (a API não guarda sessões).
    @Transactional
    public void trocarSenha(UUID id, TipoUsuario tipo, TrocaDeSenhaRequest request, String ip) {
        if (tipo == TipoUsuario.CUSTOMER) {
            Customer c = customerRepository.findById(id).orElseThrow(UnauthorizedException::credenciaisInvalidas);
            c.setSenhaHash(novaSenha(c.getEmail(), c.getSenhaHash(), request, ip));
        } else {
            Staff s = staffRepository.findById(id).orElseThrow(UnauthorizedException::credenciaisInvalidas);
            s.setSenhaHash(novaSenha(s.getEmail(), s.getSenhaHash(), request, ip));
        }
    }

    private String novaSenha(String email, String hashAtual, TrocaDeSenhaRequest request, String ip) {
        limite.verificarLogin(ip, email);
        if (!senhaConfere(request.getSenhaAtual(), hashAtual)) {
            limite.loginFalhou(ip, email);
            throw new BusinessException("A senha atual não confere");
        }
        limite.loginCerto(ip, email);
        return passwordEncoder.encode(request.getNovaSenha());
    }

    private UnauthorizedException falhou(String ip, String email) {
        limite.loginFalhou(ip, email);
        return UnauthorizedException.credenciaisInvalidas();
    }

    private boolean senhaConfere(String senha, String hash) {
        return hash != null && passwordEncoder.matches(senha, hash);
    }
}
