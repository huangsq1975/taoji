package com.taoji.modules.banks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateBankProductRequest {
    @NotBlank(message = "产品名称不能为空")
    private String name;
    private String productType = "credit";
    private String loanAmount;
    private String loanTerm;
    private Integer sortOrder = 0;
}
