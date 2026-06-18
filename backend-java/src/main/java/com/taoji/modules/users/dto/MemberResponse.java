package com.taoji.modules.users.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class MemberResponse {

    private Long id;
    private Long institutionId;
    private String name;
    private String phone;
    private String role;
    private String dataScope;
    private Integer status;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private List<String> permissions;
}
