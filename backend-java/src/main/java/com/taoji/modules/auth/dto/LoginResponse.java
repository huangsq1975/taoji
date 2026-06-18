package com.taoji.modules.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {

    private String token;
    private Long userId;
    private String name;
    private String role;
    private Long institutionId;
    private String institutionName;
    private String phone;
    private String dataScope;
}
