package com.taoji.modules.customers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateCustomerRequest {

    @NotBlank(message = "客户名称不能为空")
    @Size(max = 100, message = "客户名称最长100字符")
    private String name;

    private String contactName;
    private String contactPhone;
    private String financingNeed;
    private String loanPurpose;
    private BigDecimal loanAmount;
    private Long advisorId;
}
