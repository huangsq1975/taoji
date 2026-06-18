package com.taoji.modules.institutions;

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
@RequestMapping("/institution")
@RequiredArgsConstructor
@Tag(name = "机构管理", description = "机构信息、配额统计、订阅状态")
public class InstitutionController {

    private final InstitutionService institutionService;

    @GetMapping("/info")
    @Operation(summary = "获取当前机构信息", description = "包含套餐信息和订阅状态")
    public ApiResponse<Map<String, Object>> getMyInstitution(
            @CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(institutionService.getMyInstitution(currentUser));
    }

    @PutMapping("/info")
    @Operation(summary = "更新机构基本信息（管理员）")
    public ApiResponse<Map<String, Object>> updateInstitution(
            @CurrentUser JwtUserDetails currentUser,
            @RequestBody Map<String, Object> updates) {
        return ApiResponse.ok(institutionService.updateInstitution(currentUser, updates));
    }

    @GetMapping("/quota")
    @Operation(summary = "获取配额使用统计", description = "当月AI识别配额使用情况及最近30天调用统计")
    public ApiResponse<Map<String, Object>> getQuotaStats(
            @CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(institutionService.getQuotaStats(currentUser));
    }

    @GetMapping("/all")
    @Operation(summary = "获取所有机构列表（超级管理员）")
    public ApiResponse<List<Map<String, Object>>> listAllInstitutions(
            @CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(institutionService.listAllInstitutions(currentUser));
    }
}
