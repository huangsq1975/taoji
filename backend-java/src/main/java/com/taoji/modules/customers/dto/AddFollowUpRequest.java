package com.taoji.modules.customers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddFollowUpRequest {

    @NotNull(message = "跟进类型不能为空")
    private String type;  // NOTE | SUPPLEMENT_REQUEST | BANK_SUBMIT | BANK_FEEDBACK | SYSTEM

    @NotBlank(message = "跟进内容不能为空")
    private String content;
}
