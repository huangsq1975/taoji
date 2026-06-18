package com.taoji.modules.banks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateProductRequest {

    @NotNull(message = "银行ID不能为空")
    private Integer bankId;

    @NotBlank(message = "产品名称不能为空")
    private String name;

    private String productType = "credit";
    private BigDecimal loanMin;
    private BigDecimal loanMax;
    private BigDecimal rateMin;
    private String description;
    private String requirements;
    private Integer sortOrder = 0;
}
