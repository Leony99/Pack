package com.leonycosta.packapi.auth.auth;

// Quem está logado. O token de um cliente carrega a autoridade "CUSTOMER";
// o de um funcionário carrega as permissões da Role dele.
public enum TipoUsuario {
    CUSTOMER,
    STAFF
}
