package com.leonycosta.packapi.customer.contato;

import com.leonycosta.packapi.auth.LimiteDeTentativas;
import com.leonycosta.packapi.config.Pagina;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContatoService {

    private final MensagemRepository repository;
    private final LimiteDeTentativas limite;

    // O formulário público: conta no limite por IP do cadastro, contra quem tenta encher o banco
    @Transactional
    public void receber(MensagemRequest r, String ip) {
        limite.verificarECadastrar(ip);
        repository.save(new MensagemDeContato(null, r.nome().strip(), r.email().strip().toLowerCase(Locale.ROOT),
                r.assunto() == null || r.assunto().isBlank() ? null : r.assunto().strip(), r.mensagem().strip(),
                StatusDaMensagem.NOVA, LocalDateTime.now()));
    }

    // A caixa de entrada do painel, a mais nova primeiro
    public Pagina<MensagemResponse> listar(StatusDaMensagem status, int pagina, int tamanho) {
        var pedido = Pagina.pedido(pagina, tamanho, Sort.by(Sort.Order.desc("criadoEm"), Sort.Order.asc("id")));
        var lista = status == null ? repository.findAll(pedido) : repository.findByStatus(status, pedido);
        return Pagina.de(lista.map(ContatoService::toResponse));
    }

    @Transactional
    public MensagemResponse mudarStatus(UUID id, StatusDaMensagem status) {
        MensagemDeContato m = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Mensagem", id));
        m.setStatus(status);
        return toResponse(repository.save(m));
    }

    private static MensagemResponse toResponse(MensagemDeContato m) {
        return new MensagemResponse(m.getId(), m.getNome(), m.getEmail(), m.getAssunto(), m.getMensagem(),
                m.getStatus(), m.getCriadoEm());
    }
}
