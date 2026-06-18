package com.taoji.modules.banks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateMaterialItemRequest {
    @NotBlank(message = "资料名称不能为空")
    private String name;
    private Boolean required = false;
    private String source;
    private String format;
    private String note;
    @NotBlank(message = "分类不能为空")
    private String category;
    private Integer sortOrder = 0;
}
