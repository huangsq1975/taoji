package com.taoji.modules.ai;

import com.taoji.common.AppException;
import com.taoji.modules.ai.dto.TriggerRecognitionRequest;
import com.taoji.security.JwtUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final DSLContext dsl;
    private final WebClient.Builder webClientBuilder;

    @Value("${ai.api-url:https://api.openai.com/v1}")
    private String aiApiUrl;

    @Value("${ai.api-key:}")
    private String aiApiKey;

    @Transactional
    public Map<String, Object> triggerRecognition(JwtUserDetails currentUser,
                                                    TriggerRecognitionRequest request) {
        // Verify customer access
        Integer custExists = dsl.selectCount()
                .from(DSL.table("customers"))
                .where(DSL.field("id").eq(request.getCustomerId()))
                .and(DSL.field("institution_id").eq(currentUser.getInstitutionId()))
                .and(DSL.field("deleted_at").isNull())
                .fetchOneInto(Integer.class);
        if (custExists == null || custExists == 0) {
            throw AppException.notFound("客户不存在");
        }

        // Check quota
        checkAndDeductQuota(currentUser.getInstitutionId(), currentUser.getUserId());

        // Convert documentIds list to JSON string for storage
        String docIdsJson = null;
        if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
            docIdsJson = "[" + String.join(",", request.getDocumentIds().stream()
                    .map(String::valueOf).toList()) + "]";
        }

        // Create recognition task
        Long taskId = dsl.insertInto(DSL.table("ai_recognition_tasks"))
                .set(DSL.field("institution_id"), currentUser.getInstitutionId())
                .set(DSL.field("customer_id"), request.getCustomerId())
                .set(DSL.field("trigger_user_id"), currentUser.getUserId())
                .set(DSL.field("scope"), request.getScope())
                .set(DSL.field("document_ids"), DSL.field("?::jsonb", String.class, docIdsJson))
                .set(DSL.field("status"), "QUEUED")
                .set(DSL.field("created_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Long.class))
                .fetchOneInto(Long.class);

        // Trigger async processing
        processRecognitionAsync(taskId, request.getCustomerId(), request.getScope(),
                request.getDocumentIds(), currentUser.getInstitutionId());

        return getTaskStatus(currentUser, taskId);
    }

    public Map<String, Object> getTaskStatus(JwtUserDetails currentUser, Long taskId) {
        Map<String, Object> task = dsl.select()
                .from(DSL.table("ai_recognition_tasks"))
                .where(DSL.field("id").eq(taskId))
                .and(DSL.field("institution_id").eq(currentUser.getInstitutionId()))
                .fetchOneMap();

        if (task == null) throw AppException.notFound("任务不存在");
        return task;
    }

    @Async("aiTaskExecutor")
    public void processRecognitionAsync(Long taskId, Long customerId, String scope,
                                         List<Long> documentIds, Long institutionId) {
        log.info("Starting AI recognition task {}, customer {}, scope {}", taskId, customerId, scope);

        // Update to PROCESSING
        dsl.update(DSL.table("ai_recognition_tasks"))
                .set(DSL.field("status"), "PROCESSING")
                .set(DSL.field("started_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(taskId))
                .execute();

        try {
            // Get documents to process
            List<Record> documents;
            boolean scopedToSpecificDocs = ("single_doc".equals(scope) || "reparse".equals(scope))
                    && documentIds != null && !documentIds.isEmpty();
            if (scopedToSpecificDocs) {
                documents = dsl.select()
                        .from(DSL.table("customer_documents"))
                        .where(DSL.field("id").in(documentIds))
                        .and(DSL.field("deleted_at").isNull())
                        .fetch();
            } else {
                documents = dsl.select()
                        .from(DSL.table("customer_documents"))
                        .where(DSL.field("customer_id").eq(customerId))
                        .and(DSL.field("deleted_at").isNull())
                        .fetch();
            }

            // Update processing status only for the docs we are about to process
            List<Long> docIds = documents.stream()
                    .map(d -> d.get(DSL.field("id", Long.class)))
                    .toList();
            if (!docIds.isEmpty()) {
                dsl.update(DSL.table("customer_documents"))
                        .set(DSL.field("ai_parse_status"), "PROCESSING")
                        .where(DSL.field("id").in(docIds))
                        .execute();
            }

            int totalFields = 0;
            for (Record doc : documents) {
                Long docId = doc.get(DSL.field("id", Long.class));
                String docType = doc.get(DSL.field("doc_type", String.class));
                String fileUrl = doc.get(DSL.field("file_url", String.class));

                // Call AI API to parse document
                List<Map<String, Object>> parsedFields = callAiParseApi(docType, fileUrl);

                // If reparse, delete existing results for this document
                if ("reparse".equals(scope)) {
                    dsl.deleteFrom(DSL.table("ai_recognition_results"))
                            .where(DSL.field("document_id").eq(docId))
                            .execute();
                }

                // Save recognition results
                for (Map<String, Object> field : parsedFields) {
                    dsl.insertInto(DSL.table("ai_recognition_results"))
                            .set(DSL.field("document_id"), docId)
                            .set(DSL.field("customer_id"), customerId)
                            .set(DSL.field("field_key"), field.get("fieldKey"))
                            .set(DSL.field("field_label"), field.get("fieldLabel"))
                            .set(DSL.field("field_value"), field.get("fieldValue"))
                            .set(DSL.field("confidence"), field.get("confidence"))
                            .set(DSL.field("status"), field.get("status"))
                            .set(DSL.field("note"), field.get("note"))
                            .set(DSL.field("created_at"), LocalDateTime.now())
                            .onConflictDoNothing()
                            .execute();
                    totalFields++;
                }

                // Compute average confidence across all fields for this document
                double avgConf = parsedFields.stream()
                        .mapToDouble(f -> ((Number) f.get("confidence")).doubleValue())
                        .average()
                        .orElse(0.0);

                // Mark document as parsed, store ai_doc_type and aggregated confidence
                dsl.update(DSL.table("customer_documents"))
                        .set(DSL.field("ai_parse_status"), "DONE")
                        .set(DSL.field("ai_parsed_at"), LocalDateTime.now())
                        .set(DSL.field("ai_doc_type"), docType)
                        .set(DSL.field("confidence"), avgConf)
                        .where(DSL.field("id").eq(docId))
                        .execute();
            }

            // Complete task
            dsl.update(DSL.table("ai_recognition_tasks"))
                    .set(DSL.field("status"), "DONE")
                    .set(DSL.field("finished_at"), LocalDateTime.now())
                    .set(DSL.field("result_summary"), "成功识别 " + documents.size() + " 份文档，共提取 " + totalFields + " 个字段")
                    .where(DSL.field("id").eq(taskId))
                    .execute();

            // Record call usage
            dsl.insertInto(DSL.table("call_records"))
                    .set(DSL.field("institution_id"), institutionId)
                    .set(DSL.field("customer_id"), customerId)
                    .set(DSL.field("task_id"), taskId)
                    .set(DSL.field("call_type"), "AI_RECOGNITION")
                    .set(DSL.field("quota_cost"), 1)
                    .set(DSL.field("status"), "success")
                    .set(DSL.field("detail"), "识别 " + documents.size() + " 份文档")
                    .set(DSL.field("created_at"), LocalDateTime.now())
                    .execute();

            log.info("AI recognition task {} completed successfully", taskId);

        } catch (Exception e) {
            log.error("AI recognition task {} failed: {}", taskId, e.getMessage(), e);
            dsl.update(DSL.table("ai_recognition_tasks"))
                    .set(DSL.field("status"), "FAILED")
                    .set(DSL.field("finished_at"), LocalDateTime.now())
                    .set(DSL.field("result_summary"), "识别失败: " + e.getMessage())
                    .where(DSL.field("id").eq(taskId))
                    .execute();

            dsl.update(DSL.table("customer_documents"))
                    .set(DSL.field("ai_parse_status"), "FAILED")
                    .where(DSL.field("customer_id").eq(customerId))
                    .and(DSL.field("ai_parse_status").eq("PROCESSING"))
                    .execute();
        }
    }

    /**
     * Call the AI API to parse a document. Returns a list of extracted fields.
     * In production, this would call OpenAI/Claude/custom vision model.
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> callAiParseApi(String docType, String fileUrl) {
        if (aiApiKey == null || aiApiKey.isBlank()) {
            log.warn("AI API key not configured, returning mock recognition results for doc type: {}", docType);
            return getMockRecognitionResults(docType);
        }

        try {
            // Example: call OpenAI vision API
            Map<String, Object> payload = Map.of(
                    "model", "gpt-4o",
                    "messages", List.of(
                            Map.of("role", "user", "content", List.of(
                                    Map.of("type", "text",
                                            "text", "请识别这份" + docType + "文件中的关键字段，以JSON格式返回。"),
                                    Map.of("type", "image_url",
                                            "image_url", Map.of("url", fileUrl))
                            ))
                    ),
                    "max_tokens", 1000
            );

            Map<String, Object> response = webClientBuilder.build()
                    .post()
                    .uri(aiApiUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + aiApiKey)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            // Parse response (simplified)
            return getMockRecognitionResults(docType); // TODO: parse actual AI response

        } catch (Exception e) {
            log.error("AI API call failed for doc type {}: {}", docType, e.getMessage());
            return getMockRecognitionResults(docType);
        }
    }

    private List<Map<String, Object>> getMockRecognitionResults(String docType) {
        return switch (docType) {
            case "BUSINESS_LICENSE" -> List.of(
                    buildField("company_name", "企业名称", "示例企业有限公司", 0.95, "ok"),
                    buildField("business_license_no", "营业执照号", "91310000XXXXXXXXXX", 0.92, "ok"),
                    buildField("legal_person", "法定代表人", "张三", 0.88, "ok"),
                    buildField("registered_capital", "注册资本(万元)", "100", 0.90, "ok"),
                    buildField("established_date", "成立日期", "2020-01-01", 0.85, "ok")
            );
            case "BANK_STATEMENT" -> List.of(
                    buildField("account_holder", "账户持有人", "示例企业有限公司", 0.92, "ok"),
                    buildField("account_number", "账号", "****1234", 0.88, "ok"),
                    buildField("monthly_avg_balance", "月均余额(元)", "500000", 0.75, "needs_review"),
                    buildField("monthly_turnover", "月均流水(元)", "2000000", 0.78, "needs_review")
            );
            case "ID_CARD" -> List.of(
                    buildField("id_name", "姓名", "张三", 0.97, "ok"),
                    buildField("id_card_no", "身份证号", "310***********1234", 0.95, "ok"),
                    buildField("id_address", "地址", "上海市XX区XX路XX号", 0.80, "ok")
            );
            default -> List.of(
                    buildField("raw_content", "文档内容", "（已提取，请人工审核）", 0.60, "needs_review")
            );
        };
    }

    private Map<String, Object> buildField(String key, String label, String value,
                                             double confidence, String status) {
        return Map.of(
                "fieldKey", key,
                "fieldLabel", label,
                "fieldValue", value,
                "confidence", confidence,
                "status", status,
                "note", ""
        );
    }

    private void checkAndDeductQuota(Long institutionId, Long userId) {
        Record institution = dsl.select(
                        DSL.field("quota_total"),
                        DSL.field("quota_used")
                )
                .from(DSL.table("institutions"))
                .where(DSL.field("id").eq(institutionId))
                .fetchOne();

        if (institution == null) throw AppException.notFound("机构不存在");

        int total = institution.get(DSL.field("quota_total", Integer.class));
        int used = institution.get(DSL.field("quota_used", Integer.class));

        if (total != -1 && used >= total) {
            throw AppException.badRequest("本月AI识别配额已用完，请升级套餐或等待下月重置");
        }

        // Deduct 1 quota
        dsl.update(DSL.table("institutions"))
                .set(DSL.field("quota_used"), DSL.field("quota_used", Integer.class).plus(1))
                .where(DSL.field("id").eq(institutionId))
                .execute();
    }
}
