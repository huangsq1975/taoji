package com.taoji.modules.ai.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class TriggerRecognitionRequest {

    @NotNull(message = "客户ID不能为空")
    private Long customerId;

    /**
     * single_doc | all_docs | reparse
     */
    private String scope = "all_docs";

    /**
     * Required when scope = single_doc
     */
    private List<Long> documentIds;
}
