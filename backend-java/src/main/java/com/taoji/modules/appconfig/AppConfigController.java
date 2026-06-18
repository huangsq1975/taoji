package com.taoji.modules.appconfig;

import com.taoji.common.ApiResponse;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "平台配置", description = "平台全局配置和AI填写规则管理")
public class AppConfigController {

    private final AppConfigService appConfigService;

    @GetMapping("/admin/configs")
    @Operation(summary = "获取所有平台配置（管理员）")
    public ApiResponse<List<Map<String, Object>>> listConfigs(
            @CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(appConfigService.listConfigs(currentUser));
    }

    @GetMapping("/admin/configs/{key}")
    @Operation(summary = "获取单个配置项")
    public ApiResponse<Map<String, Object>> getConfig(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable String key) {
        return ApiResponse.ok(appConfigService.getConfig(key));
    }

    @PutMapping("/admin/configs/{key}")
    @Operation(summary = "新增或更新配置项（管理员）")
    public ApiResponse<Map<String, Object>> upsertConfig(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable String key,
            @RequestBody Map<String, String> body) {
        return ApiResponse.ok(appConfigService.upsertConfig(currentUser, key,
                body.get("value"), body.get("description")));
    }

    @DeleteMapping("/admin/configs/{key}")
    @Operation(summary = "删除配置项（管理员）")
    public ApiResponse<Void> deleteConfig(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable String key) {
        appConfigService.deleteConfig(currentUser, key);
        return ApiResponse.ok();
    }

    @GetMapping("/ai-fill-rules")
    @Operation(summary = "获取AI填写规则列表", description = "返回机构自定义规则和系统默认规则")
    public ApiResponse<List<Map<String, Object>>> listAiFillRules(
            @CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(appConfigService.listAiFillRules(currentUser));
    }

    @PostMapping("/ai-fill-rules")
    @Operation(summary = "创建或更新AI填写规则")
    public ApiResponse<Map<String, Object>> upsertAiFillRule(
            @CurrentUser JwtUserDetails currentUser,
            @RequestBody Map<String, Object> rule) {
        return ApiResponse.ok(appConfigService.upsertAiFillRule(currentUser, rule));
    }
}
