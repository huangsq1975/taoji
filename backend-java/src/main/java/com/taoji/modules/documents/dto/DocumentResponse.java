package com.taoji.modules.documents.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DocumentResponse {

    private Long id;
    private Long customerId;
    private Long uploaderId;
    private String uploaderType;
    private String docType;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String mimeType;
    private String aiParseStatus;
    private LocalDateTime aiParsedAt;
    private LocalDateTime createdAt;
}
