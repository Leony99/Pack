package com.leonycosta.packapi.order.frete;

import com.leonycosta.packapi.exception.ParametroInvalidoException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

// Frete por tabela, a partir de São Paulo (de onde a loja envia), pela região do CEP de destino (o primeiro
// dígito do CEP diz a região do país). É uma tabela provisória, com preços aproximados dos Correios: o preço
// real depende do peso, das medidas e da distância, e virá de um serviço de frete (ver o README).
// PAC sai grátis quando os produtos somam pelo menos FRETE_GRATIS_A_PARTIR; o SEDEX é sempre cobrado.
@Service
public class FreteService {

    public static final BigDecimal FRETE_GRATIS_A_PARTIR = new BigDecimal("200");

    // preço do PAC, prazo do PAC, preço do SEDEX, prazo do SEDEX
    private record Faixa(String pac, int diasPac, String sedex, int diasSedex) {
    }

    private static final Faixa ESTADO_DE_SP = new Faixa("18.90", 5, "29.90", 2);           // CEP 0 e 1
    private static final Faixa SUDESTE_E_SUL = new Faixa("22.90", 7, "39.90", 3);          // 2 (RJ, ES), 3 (MG), 8 (PR, SC)
    private static final Faixa CENTRO_OESTE_E_RS = new Faixa("27.90", 9, "49.90", 4);      // 7 (DF, GO, TO, MT, MS, RO, AC), 9 (RS)
    private static final Faixa NORTE_E_NORDESTE = new Faixa("32.90", 12, "59.90", 5);      // 4 (BA, SE), 5 (PE, AL, PB, RN), 6 (CE, PI, MA, PA, AP, AM, RR)

    // cep: só os 8 números (com ou sem traço); subtotal: a soma dos produtos, antes do cupom
    public List<OpcaoDeFrete> calcular(String cep, BigDecimal subtotal) {
        Faixa faixa = faixa(cep);
        boolean gratis = subtotal != null && subtotal.compareTo(FRETE_GRATIS_A_PARTIR) >= 0;
        return List.of(
                new OpcaoDeFrete(TipoFrete.PAC, "PAC", gratis ? BigDecimal.ZERO.setScale(2) : new BigDecimal(faixa.pac()),
                        faixa.diasPac()),
                new OpcaoDeFrete(TipoFrete.SEDEX, "SEDEX", new BigDecimal(faixa.sedex()), faixa.diasSedex()));
    }

    public OpcaoDeFrete opcao(String cep, BigDecimal subtotal, TipoFrete tipo) {
        return calcular(cep, subtotal).stream().filter(o -> o.tipo() == tipo).findFirst().orElseThrow();
    }

    private static Faixa faixa(String cep) {
        String numeros = cep == null ? "" : cep.replaceAll("[^0-9]", "");
        if (numeros.length() != 8) {
            throw new ParametroInvalidoException("CEP inválido: informe os 8 números");
        }
        return switch (numeros.charAt(0)) {
            case '0', '1' -> ESTADO_DE_SP;
            case '2', '3', '8' -> SUDESTE_E_SUL;
            case '7', '9' -> CENTRO_OESTE_E_RS;
            default -> NORTE_E_NORDESTE;
        };
    }
}
