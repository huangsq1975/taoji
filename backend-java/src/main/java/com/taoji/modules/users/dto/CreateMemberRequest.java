package com.taoji.modules.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateMemberRequest {

    @NotBlank(message = "姓名不能为空")
    @Size(max = 50, message = "姓名最长50字符")
    private String name;

    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 50, message = "密码长度6-50位")
    private String password;

    /**
     * ADVISOR | SUPERVISOR
     */
    private String role = "ADVISOR";

    /**
     * SELF | TEAM | ALL
     */
    private String dataScope = "SELF";

    private List<String> permissions;
}
