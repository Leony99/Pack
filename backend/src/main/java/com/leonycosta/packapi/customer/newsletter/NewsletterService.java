package com.leonycosta.packapi.customer.newsletter;

import com.leonycosta.packapi.auth.LimiteDeTentativas;
import com.leonycosta.packapi.config.Pagina;
import com.leonycosta.packapi.customer.customer.CustomerService;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NewsletterService {

    private final InscritoRepository repository;
    private final CustomerService customerService;
    private final LimiteDeTentativas limite;

    // Inscrição pública (o formulário da loja). A resposta é a mesma se o e-mail já estava na lista, para a
    // rota não servir para descobrir quem é inscrito. Conta no limite por IP, como o cadastro
    @Transactional
    public void inscrever(String email, String ip) {
        limite.verificarECadastrar(ip);
        ativar(email, true);
    }

    // A lista para o painel, a inscrição mais nova primeiro
    public Pagina<InscritoResponse> listar(int pagina, int tamanho) {
        var pedido = Pagina.pedido(pagina, tamanho, Sort.by(Sort.Order.desc("criadoEm"), Sort.Order.asc("id")));
        return Pagina.de(repository.findAll(pedido).map(NewsletterService::toResponse));
    }

    // A equipe tira um e-mail da lista ou o coloca de volta
    @Transactional
    public InscritoResponse mudarAtivo(UUID id, boolean ativo) {
        Inscrito inscrito = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inscrito", id));
        inscrito.setAtivo(ativo);
        return toResponse(repository.save(inscrito));
    }

    // O cliente está na lista com o e-mail da conta?
    public boolean doCliente(UUID customerId) {
        String email = emailDoCliente(customerId);
        return repository.findByEmail(email).map(Inscrito::isAtivo).orElse(false);
    }

    // O cliente entra ou sai da lista pela área dele (sempre com o e-mail da conta)
    @Transactional
    public boolean mudarDoCliente(UUID customerId, boolean inscrito) {
        ativar(emailDoCliente(customerId), inscrito);
        return inscrito;
    }

    private String emailDoCliente(UUID customerId) {
        return customerService.findEntityById(customerId).getEmail().toLowerCase(Locale.ROOT);
    }

    // Cria a inscrição ou muda a que existe. Sair de uma lista em que nunca entrou não cria nada
    private void ativar(String email, boolean ativo) {
        String limpo = email.strip().toLowerCase(Locale.ROOT);
        Inscrito inscrito = repository.findByEmail(limpo).orElse(null);
        if (inscrito == null) {
            if (!ativo) return;
            inscrito = new Inscrito(null, limpo, true, LocalDateTime.now());
        }
        inscrito.setAtivo(ativo);
        try {
            repository.saveAndFlush(inscrito);
        } catch (DataIntegrityViolationException e) {
            // duas inscrições do mesmo e-mail ao mesmo tempo: a outra já gravou, e o resultado é o mesmo
        }
    }

    private static InscritoResponse toResponse(Inscrito i) {
        return new InscritoResponse(i.getId(), i.getEmail(), i.isAtivo(), i.getCriadoEm());
    }
}
