package com.taoji.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WxBindRequest {

    @NotBlank(message = "微信授权code不能为空")
    private String code;
}
