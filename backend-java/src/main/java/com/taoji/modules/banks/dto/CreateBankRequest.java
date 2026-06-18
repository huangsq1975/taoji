package com.taoji.modules.banks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateBankRequest {
    @NotBlank(message = "银行名称不能为空")
    private String name;
    private String shortName;
    private String contactPerson;
    private String contactPhone;
    private String notes;
    private Integer sortOrder = 0;
}
