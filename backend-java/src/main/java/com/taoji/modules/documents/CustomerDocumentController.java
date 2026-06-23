package com.taoji.modules.documents;

import com.taoji.common.ApiResponse;
import com.taoji.common.AppException;
import com.taoji.modules.documents.dto.DocumentResponse;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * C端客户文档接口：客户上传和查询自己的文档。
 * 挂载在 /c/** 下，JWT Filter 仍会解析 token，@CurrentUser 注入客户身份。
 */
@RestController
@RequestMapping("/c")
@RequiredArgsConstructor
@Tag(name = "客户文档接口", description = "C端客户上传和查询自己的文档")
public class CustomerDocumentController {

    private final DocumentService documentService;
    private final DSLContext dsl;

    @PostMapping("/documents/upload")
    @Operation(summary = "客户上传文档", description = "客户上传自己的资料文件，触发 AI 解析队列")
    public ApiResponse<DocumentResponse> uploadDocument(
            @CurrentUser JwtUserDetails currentUser,
            @RequestParam String docType,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(documentService.uploadDocumentAsCustomer(currentUser, docType, file));
    }

    @GetMapping("/documents")
    @Operation(summary = "客户文档列表", description = "返回当前客户上传的所有文档")
    public ApiResponse<List<DocumentResponse>> listDocuments(@CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(documentService.listDocuments(currentUser.getUserId()));
    }

    @GetMapping("/progress")
    @Operation(summary = "客户办理进度", description = "返回当前客户的办理阶段、已上传资料和顾问留言")
    public ApiResponse<Map<String, Object>> getProgress(@CurrentUser JwtUserDetails currentUser) {
        if (currentUser == null) {
            throw AppException.unauthorized("请先登录");
        }
        Long customerId = currentUser.getUserId();

        // Customer info + advisor name
        Record customer = dsl.select(
                        DSL.field("c.id"),
                        DSL.field("c.name"),
                        DSL.field("c.status"),
                        DSL.field("c.doc_completeness"),
                        DSL.field("c.financing_need"),
                        DSL.field("c.loan_amount"),
                        DSL.field("c.ai_summary"),
                        DSL.field("u.name").as("advisor_name")
                )
                .from(DSL.table("customers").as("c"))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("c.advisor_id").eq(DSL.field("u.id")))
                .where(DSL.field("c.id").eq(customerId))
                .and(DSL.field("c.deleted_at").isNull())
                .fetchOne();

        if (customer == null) {
            throw AppException.notFound("客户信息不存在");
        }

        // Uploaded documents
        List<Map<String, Object>> documents = dsl.select(
                        DSL.field("doc_type"),
                        DSL.field("file_name"),
                        DSL.field("file_size"),
                        DSL.field("ai_parse_status"),
                        DSL.field("created_at")
                )
                .from(DSL.table("customer_documents"))
                .where(DSL.field("customer_id").eq(customerId))
                .and(DSL.field("deleted_at").isNull())
                .orderBy(DSL.field("created_at").desc())
                .fetchMaps();

        // Latest advisor follow-up records
        List<Map<String, Object>> followUps = dsl.select(
                        DSL.field("f.type"),
                        DSL.field("f.content"),
                        DSL.field("f.created_at"),
                        DSL.field("u2.name").as("advisor_name")
                )
                .from(DSL.table("follow_up_records").as("f"))
                .leftJoin(DSL.table("users").as("u2"))
                .on(DSL.field("f.advisor_id").eq(DSL.field("u2.id")))
                .where(DSL.field("f.customer_id").eq(customerId))
                .orderBy(DSL.field("f.created_at").desc())
                .limit(5)
                .fetchMaps();

        Map<String, Object> result = new HashMap<>();
        result.put("customerId", customerId);
        result.put("customerName", customer.get(DSL.field("name", String.class)));
        result.put("status", customer.get(DSL.field("status")).toString());
        result.put("docCompleteness", customer.get(DSL.field("doc_completeness", Integer.class)));
        result.put("advisorName", customer.get(DSL.field("advisor_name", String.class)));
        result.put("financingNeed", customer.get(DSL.field("financing_need", String.class)));
        result.put("loanAmount", customer.get(DSL.field("loan_amount")));
        result.put("aiSummary", customer.get(DSL.field("ai_summary", String.class)));
        result.put("documents", documents);
        result.put("followUps", followUps);
        return ApiResponse.ok(result);
    }
}
