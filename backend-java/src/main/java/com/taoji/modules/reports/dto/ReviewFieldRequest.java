package com.taoji.modules.reports.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewFieldRequest {

    @NotNull(message = "字段ID不能为空")
    private Long fieldId;

    /**
     * approved | corrected | rejected
     */
    @NotBlank(message = "审核状态不能为空")
    private String reviewStatus;

    /**
     * Corrected value (required when reviewStatus = corrected)
     */
    private String finalValue;

    private String reviewNote;
}
