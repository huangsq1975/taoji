package com.taoji.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {

    /**
     * JWT signing secret. Must be at least 256 bits (32 chars) for HS256.
     */
    private String secret = "changeme-very-long-secret-key-for-hs256-at-least-256bits";

    /**
     * Token expiration in milliseconds. Default: 7 days.
     */
    private long expiration = 604800000L;
}
