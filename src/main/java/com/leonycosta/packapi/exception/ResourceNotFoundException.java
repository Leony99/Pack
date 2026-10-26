package com.leonycosta.packapi.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " não encontrado com id: " + id);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
