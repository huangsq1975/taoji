package com.taoji.modules.banks.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FieldMappingResponse {
    private Integer id;
    private Integer productId;
    private String sysField;
    private String bankField;
    private String source;
    private String note;
}
