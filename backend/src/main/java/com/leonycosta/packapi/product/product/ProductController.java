package com.leonycosta.packapi.product.product;

import com.leonycosta.packapi.config.Pagina;
import com.leonycosta.packapi.product.product_tag_link.ProductTagLinkRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Produtos", description = "Leitura pública; criar, alterar e apagar exige CATALOG_WRITE.")
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // GET /products, em páginas (&pagina=1&tamanho=20), com um destes modos:
    //   - ?nome=camiseta: busca por nome;
    //   - ?tag=verao: produtos com aquela tag;
    //   - o catálogo: ?estilo=treino&categoria=camisa&colecao=drop natal&novidades=true&disponiveis=true
    //     &ordem=recentes|menor-preco|maior-preco|nome. Todos opcionais; sem nenhum, lista tudo por nome.
    @Operation(summary = "Lista os produtos em páginas: busca por nome, por tag ou com os filtros do catálogo")
    @GetMapping
    public Pagina<ProductResponse> findAll(@RequestParam(required = false) String nome,
                                           @RequestParam(required = false) String tag,
                                           @RequestParam(required = false) List<String> estilo,
                                           @RequestParam(required = false) List<String> categoria,
                                           @RequestParam(required = false) List<String> colecao,
                                           @RequestParam(defaultValue = "false") boolean novidades,
                                           @RequestParam(defaultValue = "false") boolean disponiveis,
                                           @RequestParam(required = false) String ordem,
                                           @RequestParam(defaultValue = "0") int pagina,
                                           @RequestParam(defaultValue = Pagina.TAMANHO_PADRAO) int tamanho) {
        if (tag != null && !tag.isBlank()) {
            return productService.findByTag(tag, pagina, tamanho);
        }
        if (nome != null && !nome.isBlank()) {
            return productService.search(nome, pagina, tamanho);
        }
        FiltroDoCatalogo filtro = new FiltroDoCatalogo(estilo, categoria, colecao, novidades, disponiveis);
        return productService.catalogo(filtro, OrdemDoCatalogo.daUrl(ordem), pagina, tamanho);
    }

    // GET /products/drop-em-destaque?limite=8: o card e a seção do drop na home
    @Operation(summary = "O drop em destaque: a coleção da peça mais nova que está em uma, com as peças dela")
    @GetMapping("/drop-em-destaque")
    public DropEmDestaqueResponse dropEmDestaque(@RequestParam(defaultValue = "8") int limite) {
        return productService.dropEmDestaque(limite);
    }

    // GET /products/mais-vendidos?limite=4: a linha DESTAQUES da loja
    @Operation(summary = "Os mais vendidos, em ordem: 90 dias, depois desde sempre, completando com os mais novos")
    @GetMapping("/mais-vendidos")
    public List<ProductResponse> maisVendidos(@RequestParam(defaultValue = "4") int limite) {
        return productService.maisVendidos(limite);
    }

    // GET /products/inativos: os produtos fora da loja, para o painel (exige CATALOG_WRITE)
    @Operation(summary = "Lista os produtos inativos (fora da loja), os mais novos primeiro")
    @GetMapping("/inativos")
    public Pagina<ProductResponse> inativos(@RequestParam(defaultValue = "0") int pagina,
                                            @RequestParam(defaultValue = Pagina.TAMANHO_PADRAO) int tamanho) {
        return productService.inativos(pagina, tamanho);
    }

    // Todo produto nasce inativo: aparece na loja só depois de ativado
    @Operation(summary = "Ativa o produto: ele passa a aparecer na loja")
    @PatchMapping("/{id}/ativar")
    public ProductResponse ativar(@PathVariable UUID id) {
        return productService.mudarAtivo(id, true);
    }

    @Operation(summary = "Desativa o produto: sai da loja, sem perder pedidos, estoque nem fotos")
    @PatchMapping("/{id}/desativar")
    public ProductResponse desativar(@PathVariable UUID id) {
        return productService.mudarAtivo(id, false);
    }

    @Operation(summary = "Busca um produto (também os inativos, que a loja mostra como indisponíveis)")
    @GetMapping("/{id}")
    public ProductResponse findById(@PathVariable UUID id) {
        return productService.findById(id);
    }

    @Operation(summary = "Busca um produto pelo slug")
    @GetMapping("/slug/{slug}")
    public ProductResponse findBySlug(@PathVariable String slug) {
        return productService.findBySlug(slug);
    }

    @Operation(summary = "Cria um produto (o slug é gerado do nome)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @Operation(summary = "Atualiza um produto")
    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @Operation(summary = "Apaga um produto que nunca esteve em pedido (se esteve, 409: desative-o)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        productService.delete(id);
    }

    @Operation(summary = "Adiciona uma tag ao produto")
    @PostMapping("/{id}/tags")
    public ProductResponse addTag(@PathVariable UUID id, @Valid @RequestBody ProductTagLinkRequest request) {
        return productService.addTag(id, request.getTagId());
    }

    @Operation(summary = "Remove uma tag do produto")
    @DeleteMapping("/{id}/tags/{tagId}")
    public ProductResponse removeTag(@PathVariable UUID id, @PathVariable UUID tagId) {
        return productService.removeTag(id, tagId);
    }
}
