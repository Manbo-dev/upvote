package com.upvote.api.exception;

/**
 * Exceção para regras de negócio violadas (HTTP 422)
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
