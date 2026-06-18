package com.taoji.modules.users.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UpdatePermissionsRequest {

    @NotNull(message = "权限列表不能为null")
    private List<String> permissions;

    private String role;

    private String dataScope;
}
