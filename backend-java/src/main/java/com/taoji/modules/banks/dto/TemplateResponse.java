package com.taoji.modules.banks.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TemplateResponse {
    private Integer id;
    private Integer productId;
    private String name;
    private String keyFields;
    private String note;
    private String fileUrl;
}
