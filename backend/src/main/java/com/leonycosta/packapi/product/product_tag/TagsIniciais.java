package com.leonycosta.packapi.product.product_tag;

import com.leonycosta.packapi.enums.TagFiltro;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Roda ao subir a aplicação e garante as tags que a loja precisa para os produtos existirem (todo
// produto tem um estilo e uma categoria):
//   - os estilos FIXOS, casual e treino: sempre existem e não podem ser apagados, renomeados nem
//     mudar de filtro (ProductTagService recusa);
//   - as categorias iniciais, camisa, bermuda e conjunto: criadas só num banco sem nenhuma categoria,
//     para quem apagar ou renomear uma pelo painel não a ver voltar na próxima subida.
// Só cria o que falta, então pode rodar quantas vezes for preciso.
@Slf4j
@Component
@RequiredArgsConstructor
public class TagsIniciais implements ApplicationRunner {

    static final List<String> ESTILOS_FIXOS = List.of("casual", "treino");
    static final List<String> CATEGORIAS_INICIAIS = List.of("camisa", "bermuda", "conjunto");

    private final ProductTagRepository productTagRepository;

    public static boolean ehFixa(ProductTag tag) {
        return tag.getFiltro() == TagFiltro.ESTILO && ESTILOS_FIXOS.contains(tag.getTag());
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (String estilo : ESTILOS_FIXOS) {
            ProductTag tag = productTagRepository.findByTag(estilo).orElseGet(ProductTag::new);
            // uma tag "casual" que já existia com outro filtro vira o estilo fixo
            if (tag.getId() == null || tag.getFiltro() != TagFiltro.ESTILO) {
                tag.setTag(estilo);
                tag.setFiltro(TagFiltro.ESTILO);
                productTagRepository.save(tag);
                log.info("Estilo fixo garantido: {}", estilo);
            }
        }
        if (!productTagRepository.existsByFiltro(TagFiltro.CATEGORIA)) {
            for (String categoria : CATEGORIAS_INICIAIS) {
                ProductTag tag = productTagRepository.findByTag(categoria).orElseGet(ProductTag::new);
                tag.setTag(categoria);
                tag.setFiltro(TagFiltro.CATEGORIA);
                productTagRepository.save(tag);
            }
            log.info("Categorias iniciais criadas: {}", CATEGORIAS_INICIAIS);
        }
    }
}
