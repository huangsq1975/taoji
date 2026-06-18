package com.taoji.modules.documents.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DocumentResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private Long uploaderId;
    private String uploaderType;
    private String uploaderName;
    private String docType;
    private String aiDocType;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String mimeType;
    private String aiParseStatus;
    /** Document-level confidence (0–100), averaged from field-level results */
    private Double confidence;
    private LocalDateTime aiParsedAt;
    private LocalDateTime createdAt;
}
