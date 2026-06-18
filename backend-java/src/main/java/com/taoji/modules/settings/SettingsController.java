package com.taoji.modules.settings;

import com.taoji.common.ApiResponse;
import com.taoji.common.PaginatedResult;
import com.taoji.modules.settings.SettingsService.CreateAiRuleRequest;
import com.taoji.modules.settings.SettingsService.UpdateAiRuleRequest;
import com.taoji.modules.settings.SettingsService.UpdatePromptRequest;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/settings")
@RequiredArgsConstructor
@Tag(name = "平台配置", description = "AI填表规则与Prompt配置管理")
public class SettingsController {

    private final SettingsService settingsService;

    // ─── AI Rules ─────────────────────────────────────────────────────────────

    @GetMapping("/ai-rules")
    @Operation(summary = "获取AI填表规则列表")
    public ApiResponse<List<Map<String, Object>>> listAiRules(
            @CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(settingsService.listAiRules(currentUser));
    }

    @PostMapping("/ai-rules")
    @Operation(summary = "新增AI填表规则")
    public ApiResponse<Map<String, Object>> createAiRule(
            @CurrentUser JwtUserDetails currentUser,
            @RequestBody CreateAiRuleRequest req) {
        return ApiResponse.ok(settingsService.createAiRule(currentUser, req));
    }

    @PutMapping("/ai-rules/{id}")
    @Operation(summary = "更新AI填表规则")
    public ApiResponse<Map<String, Object>> updateAiRule(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Integer id,
            @RequestBody UpdateAiRuleRequest req) {
        return ApiResponse.ok(settingsService.updateAiRule(currentUser, id, req));
    }

    @PostMapping("/ai-rules/{id}/toggle")
    @Operation(summary = "启用/停用AI填表规则")
    public ApiResponse<Map<String, Object>> toggleAiRule(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Integer id) {
        return ApiResponse.ok(settingsService.toggleAiRule(currentUser, id));
    }

    // ─── Prompt Configs ───────────────────────────────────────────────────────

    @GetMapping("/prompts")
    @Operation(summary = "获取Prompt配置列表")
    public ApiResponse<List<Map<String, Object>>> listPromptConfigs(
            @CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(settingsService.listPromptConfigs(currentUser));
    }

    @PutMapping("/prompts/{id}")
    @Operation(summary = "更新Prompt配置")
    public ApiResponse<Map<String, Object>> updatePromptConfig(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Integer id,
            @RequestBody UpdatePromptRequest req) {
        return ApiResponse.ok(settingsService.updatePromptConfig(
                currentUser, id, req.prompt(), req.model()));
    }

    // ─── Usage Logs (调用记录) ────────────────────────────────────────────────

    @GetMapping("/usage-logs")
    @Operation(summary = "获取调用记录列表（分页）")
    public ApiResponse<PaginatedResult<Map<String, Object>>> listUsageLogs(
            @CurrentUser JwtUserDetails currentUser,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ApiResponse.ok(settingsService.listUsageLogs(currentUser, type, keyword, page, pageSize));
    }

    @GetMapping("/usage-summary")
    @Operation(summary = "获取本月调用汇总及员工用量")
    public ApiResponse<Map<String, Object>> getUsageSummary(
            @CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(settingsService.getUsageSummary(currentUser));
    }

    @GetMapping("/usage-logs/export")
    @Operation(summary = "导出调用记录 CSV")
    public void exportUsageLogs(
            @CurrentUser JwtUserDetails currentUser,
            HttpServletResponse response) throws IOException {
        response.setContentType("text/csv;charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"usage-logs.csv\"");
        // UTF-8 BOM for Excel compatibility
        response.getOutputStream().write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
        settingsService.exportUsageLogs(currentUser,
                new java.io.PrintWriter(new java.io.OutputStreamWriter(
                        response.getOutputStream(), StandardCharsets.UTF_8)));
    }
}
