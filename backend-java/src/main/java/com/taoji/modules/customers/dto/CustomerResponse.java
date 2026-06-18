package com.taoji.modules.customers.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CustomerResponse {

    private Long id;
    private Long institutionId;
    private Long advisorId;
    private String advisorName;
    private String name;
    private String contactName;
    private String contactPhone;
    private String financingNeed;
    private String loanPurpose;
    private BigDecimal loanAmount;
    private String status;
    private Integer docCompleteness;
    private String aiSummary;
    private String riskNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> labels;
}
