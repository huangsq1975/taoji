package com.taoji.modules.banks.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ProductResponse {
    private Integer id;
    private Integer bankId;
    private String bankName;
    private String name;
    private String productType;
    private BigDecimal loanMin;
    private BigDecimal loanMax;
    private BigDecimal rateMin;
    private String description;
    private String requirements;
    private Integer sortOrder;
    private Integer status;
    private LocalDateTime createdAt;
    private List<Map<String, Object>> materialConfigs;
}
