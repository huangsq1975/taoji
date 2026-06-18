package com.taoji.modules.documents;

import com.taoji.common.ApiResponse;
import com.taoji.modules.documents.dto.DocumentResponse;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "文档管理", description = "客户文档上传、删除、AI识别汇总")
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/documents/upload")
    @Operation(summary = "上传客户文档", description = "支持营业执照、银行流水、征信报告等，触发AI解析队列")
    public ApiResponse<DocumentResponse> uploadDocument(
            @CurrentUser JwtUserDetails currentUser,
            @RequestParam Long customerId,
            @RequestParam String docType,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(documentService.uploadDocument(currentUser, customerId, docType, file));
    }

    @GetMapping("/customers/{customerId}/documents")
    @Operation(summary = "获取客户文档列表")
    public ApiResponse<List<DocumentResponse>> listDocuments(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long customerId) {
        return ApiResponse.ok(documentService.listDocuments(customerId));
    }

    @DeleteMapping("/documents/{id}")
    @Operation(summary = "删除文档（软删除）")
    public ApiResponse<Void> deleteDocument(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        documentService.deleteDocument(currentUser, id);
        return ApiResponse.ok();
    }

    @GetMapping("/customers/{id}/recognition-summary")
    @Operation(summary = "获取AI识别汇总", description = "返回该客户所有文档的AI字段识别结果及最新任务状态")
    public ApiResponse<Map<String, Object>> getRecognitionSummary(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        return ApiResponse.ok(documentService.getRecognitionSummary(currentUser, id));
    }
}
