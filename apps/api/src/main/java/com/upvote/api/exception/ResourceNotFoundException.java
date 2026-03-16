package com.upvote.api.exception;

/**
 * Exceção para recurso não encontrado (HTTP 404)
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
