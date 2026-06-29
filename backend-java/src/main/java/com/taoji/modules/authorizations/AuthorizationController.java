package com.taoji.modules.authorizations;

import com.taoji.common.ApiResponse;
import com.taoji.common.AppException;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/c/authorizations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "客户授权接口", description = "C端客户授权管理：查询、发起、撤销、上传授权文件")
public class AuthorizationController {

    private final DSLContext dsl;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Value("${upload.url-prefix:http://localhost:3000/uploads}")
    private String urlPrefix;

    private static final List<String> AUTH_TYPE_ORDER = List.of("data_use", "credit_check", "third_party", "agreement");

    private static final Map<String, String> AUTH_NAMES = Map.of(
            "data_use", "企业资料授权",
            "credit_check", "征信查询授权",
            "third_party", "税务数据授权",
            "agreement", "数据使用协议"
    );

    private static final Map<String, String> AUTH_DESCS = Map.of(
            "data_use", "营业执照、经营流水、企业基础信息",
            "credit_check", "企业征信报告、法人个人征信查询",
            "third_party", "电子税务局数据接入、开票明细",
            "agreement", "个人及企业信息用于融资资料整理"
    );

    // Target text when status = not_applied
    private static final Map<String, String> TARGET_NOT_APPLIED = Map.of(
            "data_use", "请联系顾问开通",
            "credit_check", "如需征信查询请提供签字授权书",
            "third_party", "如需AI分析税票数据需单独授权",
            "agreement", "韬纪元AI平台"
    );

    // Target text when status = pending
    private static final Map<String, String> TARGET_PENDING = Map.of(
            "data_use", "需上传授权材料",
            "credit_check", "需上传签字授权书",
            "third_party", "需上传签字授权书",
            "agreement", "韬纪元AI平台"
    );

    @GetMapping
    @Operation(summary = "获取授权列表", description = "返回所有授权类型的当前状态")
    public ApiResponse<List<Map<String, Object>>> listAuthorizations(
            @CurrentUser JwtUserDetails currentUser) {
        if (currentUser == null) throw AppException.unauthorized("请先登录");
        Long customerId = currentUser.getUserId();

        // Get advisor name for this customer
        String advisorName = dsl.select(DSL.field("u.name", String.class))
                .from(DSL.table("customers").as("c"))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("c.advisor_id").eq(DSL.field("u.id")))
                .where(DSL.field("c.id").eq(customerId))
                .and(DSL.field("c.deleted_at").isNull())
                .fetchOneInto(String.class);
        if (advisorName == null) advisorName = "顾问";

        // Get latest record per auth_type using DISTINCT ON (PostgreSQL)
        List<Map<String, Object>> dbRecords = dsl.fetch(
                "SELECT DISTINCT ON (auth_type) id, auth_type::text AS auth_type, status::text AS status, " +
                "signed_at, file_url FROM customer_authorizations WHERE customer_id = ? " +
                "ORDER BY auth_type, created_at DESC",
                customerId
        ).intoMaps();

        // Index by auth_type
        Map<String, Map<String, Object>> byType = new HashMap<>();
        for (Map<String, Object> rec : dbRecords) {
            byType.put(String.valueOf(rec.get("auth_type")), rec);
        }

        final String finalAdvisorName = advisorName;
        List<Map<String, Object>> result = new ArrayList<>();
        for (String authType : AUTH_TYPE_ORDER) {
            Map<String, Object> rec = byType.get(authType);
            result.add(buildItem(authType, rec, finalAdvisorName));
        }
        return ApiResponse.ok(result);
    }

    @PostMapping("/{authType}/apply")
    @Operation(summary = "发起授权", description = "创建授权申请；agreement 类型直接设为已签署")
    public ApiResponse<Void> applyAuth(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable String authType) {
        if (currentUser == null) throw AppException.unauthorized("请先登录");
        if (!AUTH_TYPE_ORDER.contains(authType)) throw AppException.badRequest("无效的授权类型");
        Long customerId = currentUser.getUserId();

        // Check if an active (pending or signed) record already exists
        int activeCount = dsl.fetchOne(
                "SELECT COUNT(*)::int FROM customer_authorizations WHERE customer_id = ? " +
                "AND auth_type = ?::auth_type AND status IN ('pending'::auth_status, 'signed'::auth_status)",
                customerId, authType).get(0, int.class);
        if (activeCount > 0) {
            throw AppException.badRequest("授权已存在，无需重复申请");
        }

        // agreement type is signed immediately; others start as pending
        String newStatus = "agreement".equals(authType) ? "signed" : "pending";
        LocalDateTime signedAt = "agreement".equals(authType) ? LocalDateTime.now() : null;

        dsl.insertInto(DSL.table("customer_authorizations"))
                .set(DSL.field("customer_id"), customerId)
                .set(DSL.field("auth_type", String.class), DSL.field("?::auth_type", String.class, authType))
                .set(DSL.field("status", String.class), DSL.field("?::auth_status", String.class, newStatus))
                .set(DSL.field("signed_at"), signedAt)
                .set(DSL.field("created_at"), LocalDateTime.now())
                .execute();
        return ApiResponse.ok();
    }

    @PostMapping("/{authType}/revoke")
    @Operation(summary = "撤销授权")
    public ApiResponse<Void> revokeAuth(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable String authType) {
        if (currentUser == null) throw AppException.unauthorized("请先登录");
        if (!AUTH_TYPE_ORDER.contains(authType)) throw AppException.badRequest("无效的授权类型");
        Long customerId = currentUser.getUserId();

        int updated = dsl.execute(
                "UPDATE customer_authorizations SET status = 'revoked'::auth_status " +
                "WHERE id = (SELECT id FROM customer_authorizations WHERE customer_id = ? " +
                "AND auth_type = ?::auth_type AND status IN ('pending'::auth_status, 'signed'::auth_status) " +
                "ORDER BY created_at DESC LIMIT 1)",
                customerId, authType
        );
        if (updated == 0) throw AppException.badRequest("未找到可撤销的授权记录");
        return ApiResponse.ok();
    }

    @PostMapping("/{authType}/upload")
    @Operation(summary = "上传签字授权文件", description = "上传后授权状态更新为已签署")
    public ApiResponse<Void> uploadAuthFile(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable String authType,
            @RequestParam("file") MultipartFile file) {
        if (currentUser == null) throw AppException.unauthorized("请先登录");
        if (!AUTH_TYPE_ORDER.contains(authType)) throw AppException.badRequest("无效的授权类型");
        Long customerId = currentUser.getUserId();

        // Save file to disk
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "auth_file";
        String extension = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                : "";
        String storedName = UUID.randomUUID() + extension;
        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        Long institutionId = currentUser.getInstitutionId();
        Path dirPath = Paths.get(uploadDir, String.valueOf(institutionId), datePath);

        try {
            Files.createDirectories(dirPath);
            try (InputStream is = file.getInputStream()) {
                Files.copy(is, dirPath.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Failed to save auth file: {}", e.getMessage(), e);
            throw AppException.internalError("文件保存失败");
        }

        String fileUrl = urlPrefix + "/" + institutionId + "/" + datePath + "/" + storedName;

        // Update or insert the pending record to signed
        int updated = dsl.execute(
                "UPDATE customer_authorizations SET status = 'signed'::auth_status, signed_at = NOW(), file_url = ? " +
                "WHERE id = (SELECT id FROM customer_authorizations WHERE customer_id = ? " +
                "AND auth_type = ?::auth_type AND status = 'pending'::auth_status " +
                "ORDER BY created_at DESC LIMIT 1)",
                fileUrl, customerId, authType
        );
        if (updated == 0) {
            // No pending record — insert directly as signed
            dsl.insertInto(DSL.table("customer_authorizations"))
                    .set(DSL.field("customer_id"), customerId)
                    .set(DSL.field("auth_type", String.class), DSL.field("?::auth_type", String.class, authType))
                    .set(DSL.field("status", String.class), DSL.field("?::auth_status", String.class, "signed"))
                    .set(DSL.field("signed_at"), LocalDateTime.now())
                    .set(DSL.field("file_url"), fileUrl)
                    .set(DSL.field("created_at"), LocalDateTime.now())
                    .execute();
        }
        return ApiResponse.ok();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Map<String, Object> buildItem(String authType, Map<String, Object> rec, String advisorName) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("authType", authType);
        item.put("name", AUTH_NAMES.get(authType));
        item.put("desc", AUTH_DESCS.get(authType));

        if (rec == null) {
            item.put("status", "not_applied");
            item.put("statusLabel", "未申请");
            item.put("target", TARGET_NOT_APPLIED.get(authType));
            item.put("time", "");
        } else {
            String dbStatus = String.valueOf(rec.get("status"));
            String frontStatus = switch (dbStatus) {
                case "signed"  -> "authorized";
                case "pending" -> "pending";
                default        -> "not_applied";
            };
            String statusLabel = switch (dbStatus) {
                case "signed"  -> "agreement".equals(authType) ? "已同意" : "已授权";
                case "pending" -> "待补充";
                default        -> "已撤销";
            };
            String target = switch (dbStatus) {
                case "signed"  -> advisorName + "（韬纪元AI合作顾问）";
                case "pending" -> TARGET_PENDING.get(authType);
                default        -> TARGET_NOT_APPLIED.get(authType);
            };
            if ("agreement".equals(authType) && "signed".equals(dbStatus)) {
                target = "韬纪元AI平台";
            }

            Object signedAtObj = rec.get("signed_at");
            String time = "";
            if (signedAtObj instanceof LocalDateTime ldt) {
                time = ldt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            } else if (signedAtObj instanceof java.sql.Timestamp ts) {
                time = ts.toLocalDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            }

            item.put("status", frontStatus);
            item.put("statusLabel", statusLabel);
            item.put("target", target);
            item.put("time", time);
        }
        return item;
    }
}
