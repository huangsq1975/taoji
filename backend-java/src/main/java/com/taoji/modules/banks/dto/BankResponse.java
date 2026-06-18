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
    private String contactPerson;
    private String contactPhone;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
