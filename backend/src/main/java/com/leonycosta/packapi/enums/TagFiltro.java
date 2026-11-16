package com.leonycosta.packapi.enums;

// Em qual filtro da loja a tag aparece. A própria tag é a opção do filtro: a tag "treino" com filtro
// ESTILO é o estilo Treino; a tag "moletons" com filtro CATEGORIA, a categoria Moletons; a tag
// "drop-natal" com filtro COLECAO, a coleção (o drop) DROP NATAL. Sem filtro (null), a tag fica no
// produto e só vale na busca.
// Todo produto tem pelo menos uma tag de ESTILO e exatamente uma de CATEGORIA; COLECAO é opcional.
public enum TagFiltro {
    ESTILO,
    CATEGORIA,
    COLECAO
}
