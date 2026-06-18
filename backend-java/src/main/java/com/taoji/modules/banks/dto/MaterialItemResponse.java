package com.taoji.modules.banks.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MaterialItemResponse {
    private Integer id;
    private Integer productId;
    private String name;
    private Boolean required;
    private String source;
    private String format;
    private String note;
    private String category;
    private Integer sortOrder;
}
