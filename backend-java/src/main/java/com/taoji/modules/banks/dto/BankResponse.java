package com.taoji.modules.banks.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BankResponse {
    private Integer id;
    private String name;
    private String shortName;
    private String logoUrl;
    private Integer sortOrder;
    private Integer status;
    private LocalDateTime createdAt;
}
