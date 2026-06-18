package com.taoji.modules.users;

import com.taoji.common.ApiResponse;
import com.taoji.modules.users.dto.CreateMemberRequest;
import com.taoji.modules.users.dto.MemberResponse;
import com.taoji.modules.users.dto.UpdatePermissionsRequest;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/settings/accounts")
@RequiredArgsConstructor
@Tag(name = "机构账号管理", description = "机构员工账号的增删改查与权限配置")
public class SettingsUserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "获取机构账号列表", description = "返回全部账号，不分页")
    public ApiResponse<List<MemberResponse>> listAccounts(
            @CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(userService.listAllMembers(currentUser.getInstitutionId()));
    }

    @PostMapping
    @Operation(summary = "新增机构账号", description = "未提供密码时使用默认密码 Taoji@123")
    public ApiResponse<MemberResponse> createAccount(
            @CurrentUser JwtUserDetails currentUser,
            @RequestBody CreateMemberRequest request) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            request.setPassword("Taoji@123");
        }
        return ApiResponse.ok(userService.createMember(currentUser.getInstitutionId(), request));
    }

    @PostMapping("/{id}/toggle")
    @Operation(summary = "切换账号状态", description = "启用 → 停用 或 停用 → 启用")
    public ApiResponse<MemberResponse> toggleAccount(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        return ApiResponse.ok(userService.toggleMember(currentUser.getInstitutionId(), id));
    }

    @PutMapping("/{id}/permissions")
    @Operation(summary = "更新账号权限", description = "更新指定账号的角色、数据范围和功能权限")
    public ApiResponse<MemberResponse> updatePermissions(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePermissionsRequest request) {
        return ApiResponse.ok(userService.updatePermissions(currentUser.getInstitutionId(), id, request));
    }
}
