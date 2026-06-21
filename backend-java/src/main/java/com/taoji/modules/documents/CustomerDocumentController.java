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
}
