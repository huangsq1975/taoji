package com.taoji.modules.customers.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class UpdateCustomerRequest {

    private String name;
    private String contactName;
    private String contactPhone;
    private String financingNeed;
    private String loanPurpose;
    private BigDecimal loanAmount;
    private String status;
    private String aiSummary;
    private String riskNotes;
    private List<String> labels;
}
