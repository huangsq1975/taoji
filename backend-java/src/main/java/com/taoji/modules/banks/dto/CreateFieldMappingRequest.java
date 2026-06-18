package com.taoji.modules.banks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateFieldMappingRequest {
    @NotBlank(message = "系统字段不能为空")
    private String sysField;
    @NotBlank(message = "银行字段不能为空")
    private String bankField;
    private String source;
    private String note;
}
