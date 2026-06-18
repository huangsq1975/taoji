package com.taoji.modules.documents.dto;

import lombok.Data;

@Data
public class ConfirmDocumentRequest {
    /** Optional: if provided, correct the document type */
    private String docType;
}
