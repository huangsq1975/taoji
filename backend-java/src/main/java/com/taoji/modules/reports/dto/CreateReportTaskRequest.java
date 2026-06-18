package com.taoji.modules.reports.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateReportTaskRequest {

    @NotNull(message = "客户ID不能为空")
    private Long customerId;

    @NotNull(message = "银行产品ID不能为空")
    private Integer productId;
}
