package com.taoji.modules.documents;

import com.taoji.common.AppException;
import com.taoji.modules.documents.dto.DocumentResponse;
import com.taoji.security.JwtUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DSLContext dsl;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Value("${upload.url-prefix:http://localhost:3000/uploads}")
    private String urlPrefix;

    @Transactional
    public DocumentResponse uploadDocument(JwtUserDetails currentUser,
                                            Long customerId,
                                            String docType,
                                            MultipartFile file) {
        // Ensure customer belongs to institution
        Integer exists = dsl.selectCount()
                .from(DSL.table("customers"))
                .where(DSL.field("id").eq(customerId))
                .and(DSL.field("institution_id").eq(currentUser.getInstitutionId()))
                .and(DSL.field("deleted_at").isNull())
                .fetchOneInto(Integer.class);
        if (exists == null || exists == 0) {
            throw AppException.notFound("客户不存在");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
        String extension = getExtension(originalFilename);
        String storedName = UUID.randomUUID() + extension;

        // Build date-based subdirectory
        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        Path dirPath = Paths.get(uploadDir, String.valueOf(currentUser.getInstitutionId()), datePath);

        try {
            Files.createDirectories(dirPath);
            Path filePath = dirPath.resolve(storedName);
            try (InputStream is = file.getInputStream()) {
                Files.copy(is, filePath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Failed to save file: {}", e.getMessage(), e);
            throw AppException.internalError("文件保存失败");
        }

        String relativeUrl = "/" + currentUser.getInstitutionId() + "/" + datePath + "/" + storedName;
        String fileUrl = urlPrefix + relativeUrl;

        Long docId = dsl.insertInto(DSL.table("customer_documents"))
                .set(DSL.field("customer_id"), customerId)
                .set(DSL.field("uploader_id"), currentUser.getUserId())
                .set(DSL.field("uploader_type"), "advisor")
                .set(DSL.field("doc_type"), docType)
                .set(DSL.field("file_name"), originalFilename)
                .set(DSL.field("file_url"), fileUrl)
                .set(DSL.field("file_size"), file.getSize())
                .set(DSL.field("mime_type"), file.getContentType())
                .set(DSL.field("ai_parse_status"), "PENDING")
                .set(DSL.field("created_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Long.class))
                .fetchOneInto(Long.class);

        return getDocumentById(docId);
    }

    public List<DocumentResponse> listDocuments(Long customerId) {
        return dsl.select()
                .from(DSL.table("customer_documents"))
                .where(DSL.field("customer_id").eq(customerId))
                .and(DSL.field("deleted_at").isNull())
                .orderBy(DSL.field("created_at").desc())
                .fetch()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void deleteDocument(JwtUserDetails currentUser, Long docId) {
        Record doc = dsl.select()
                .from(DSL.table("customer_documents"))
                .where(DSL.field("id").eq(docId))
                .and(DSL.field("deleted_at").isNull())
                .fetchOne();

        if (doc == null) {
            throw AppException.notFound("文档不存在");
        }

        // Verify customer belongs to institution
        Long customerId = doc.get(DSL.field("customer_id", Long.class));
        Integer exists = dsl.selectCount()
                .from(DSL.table("customers"))
                .where(DSL.field("id").eq(customerId))
                .and(DSL.field("institution_id").eq(currentUser.getInstitutionId()))
                .fetchOneInto(Integer.class);
        if (exists == null || exists == 0) {
            throw AppException.forbidden("无权删除此文档");
        }

        dsl.update(DSL.table("customer_documents"))
                .set(DSL.field("deleted_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(docId))
                .execute();
    }

    public Map<String, Object> getRecognitionSummary(JwtUserDetails currentUser, Long customerId) {
        // Verify access
        Integer exists = dsl.selectCount()
                .from(DSL.table("customers"))
                .where(DSL.field("id").eq(customerId))
                .and(DSL.field("institution_id").eq(currentUser.getInstitutionId()))
                .and(DSL.field("deleted_at").isNull())
                .fetchOneInto(Integer.class);
        if (exists == null || exists == 0) {
            throw AppException.notFound("客户不存在");
        }

        // Get recognition results grouped by status
        List<Map<String, Object>> results = dsl.select(
                        DSL.field("r.field_key"),
                        DSL.field("r.field_label"),
                        DSL.field("r.field_value"),
                        DSL.field("r.confidence"),
                        DSL.field("r.status"),
                        DSL.field("r.note"),
                        DSL.field("d.file_name").as("source_file"),
                        DSL.field("d.doc_type")
                )
                .from(DSL.table("ai_recognition_results").as("r"))
                .join(DSL.table("customer_documents").as("d"))
                .on(DSL.field("r.document_id").eq(DSL.field("d.id")))
                .where(DSL.field("r.customer_id").eq(customerId))
                .orderBy(DSL.field("d.doc_type"), DSL.field("r.field_key"))
                .fetchMaps();

        // Latest task status
        Record latestTask = dsl.select()
                .from(DSL.table("ai_recognition_tasks"))
                .where(DSL.field("customer_id").eq(customerId))
                .orderBy(DSL.field("created_at").desc())
                .limit(1)
                .fetchOne();

        return Map.of(
                "customerId", customerId,
                "results", results,
                "latestTask", latestTask != null ? latestTask.intoMap() : Map.of()
        );
    }

    private DocumentResponse getDocumentById(Long docId) {
        Record r = dsl.select()
                .from(DSL.table("customer_documents"))
                .where(DSL.field("id").eq(docId))
                .fetchOne();
        if (r == null) throw AppException.notFound("文档不存在");
        return mapToResponse(r);
    }

    private DocumentResponse mapToResponse(Record r) {
        return DocumentResponse.builder()
                .id(r.get(DSL.field("id", Long.class)))
                .customerId(r.get(DSL.field("customer_id", Long.class)))
                .uploaderId(r.get(DSL.field("uploader_id", Long.class)))
                .uploaderType(r.get(DSL.field("uploader_type", String.class)))
                .docType(r.get(DSL.field("doc_type", String.class)))
                .fileName(r.get(DSL.field("file_name", String.class)))
                .fileUrl(r.get(DSL.field("file_url", String.class)))
                .fileSize(r.get(DSL.field("file_size", Long.class)))
                .mimeType(r.get(DSL.field("mime_type", String.class)))
                .aiParseStatus(r.get(DSL.field("ai_parse_status", String.class)))
                .aiParsedAt(r.get(DSL.field("ai_parsed_at", LocalDateTime.class)))
                .createdAt(r.get(DSL.field("created_at", LocalDateTime.class)))
                .build();
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return (dot >= 0) ? filename.substring(dot) : "";
    }
}
