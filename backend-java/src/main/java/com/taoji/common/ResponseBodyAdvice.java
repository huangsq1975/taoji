package com.taoji.common;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "com.taoji")
@Slf4j
@RequiredArgsConstructor
public class ResponseBodyAdvice implements org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        // Skip if already an ApiResponse
        return !ApiResponse.class.isAssignableFrom(returnType.getParameterType())
                && !GlobalExceptionHandler.ValidationErrorResponse.class.isAssignableFrom(returnType.getParameterType());
    }

    @Override
    public Object beforeBodyWrite(Object body,
                                   MethodParameter returnType,
                                   MediaType selectedContentType,
                                   Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                   ServerHttpRequest request,
                                   ServerHttpResponse response) {
        if (body instanceof ApiResponse) {
            return body;
        }
        // Skip springdoc/swagger endpoints
        String path = request.getURI().getPath();
        if (path.contains("/api-docs") || path.contains("/swagger-ui") || path.contains("/docs")
                || path.contains("/v3/api-docs")) {
            return body;
        }
        return ApiResponse.ok(body);
    }
}
