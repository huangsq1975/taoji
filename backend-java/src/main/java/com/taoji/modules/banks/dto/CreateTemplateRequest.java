package com.taoji.modules.banks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTemplateRequest {
    @NotBlank(message = "模板名称不能为空")
    private String name;
    private String keyFields;
    private String note;
}
