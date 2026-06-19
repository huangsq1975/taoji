package com.taoji.modules.users;

import com.taoji.common.ApiResponse;
import com.taoji.common.AppException;
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
    @Operation(summary = "获取机构账号列表", description = "返回全部账号，不分页。需要 manage_account 或 config_permission 权限")
    public ApiResponse<List<MemberResponse>> listAccounts(
            @CurrentUser JwtUserDetails currentUser) {
        requireManageAccountOrAdmin(currentUser);
        return ApiResponse.ok(userService.listAllMembers(currentUser.getInstitutionId()));
    }

    @PostMapping
    @Operation(summary = "新增机构账号", description = "未提供密码时使用默认密码 Taoji@123。需要 manage_account 权限")
    public ApiResponse<MemberResponse> createAccount(
            @CurrentUser JwtUserDetails currentUser,
            @Valid @RequestBody CreateMemberRequest request) {
        requireManageAccount(currentUser);
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            request.setPassword("Taoji@123");
        }
        return ApiResponse.ok(userService.createMember(currentUser.getInstitutionId(), request));
    }

    @PostMapping("/{id}/toggle")
    @Operation(summary = "切换账号状态", description = "启用 → 停用 或 停用 → 启用。需要 manage_account 权限，不能操作自己")
    public ApiResponse<MemberResponse> toggleAccount(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        requireManageAccount(currentUser);
        return ApiResponse.ok(userService.toggleMember(currentUser.getInstitutionId(), id, currentUser.getUserId()));
    }

    @PutMapping("/{id}/permissions")
    @Operation(summary = "更新账号权限", description = "更新指定账号的角色、数据范围和功能权限。需要 config_permission 权限，不能操作自己")
    public ApiResponse<MemberResponse> updatePermissions(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePermissionsRequest request) {
        requireConfigPermission(currentUser);
        return ApiResponse.ok(userService.updatePermissions(currentUser.getInstitutionId(), id, currentUser.getUserId(), request));
    }

    // ─── Permission helpers ───────────────────────────────────────────────────

    private void requireManageAccountOrAdmin(JwtUserDetails user) {
        if ("ADMIN".equals(user.getRole())) return;
        if (userService.hasPermission(user.getUserId(), "manage_account")) return;
        if (userService.hasPermission(user.getUserId(), "config_permission")) return;
        throw AppException.forbidden("无权限：需要账号管理权限");
    }

    private void requireManageAccount(JwtUserDetails user) {
        if ("ADMIN".equals(user.getRole())) return;
        if (userService.hasPermission(user.getUserId(), "manage_account")) return;
        throw AppException.forbidden("无权限：需要账号启停权限");
    }

    private void requireConfigPermission(JwtUserDetails user) {
        if ("ADMIN".equals(user.getRole())) return;
        if (userService.hasPermission(user.getUserId(), "config_permission")) return;
        throw AppException.forbidden("无权限：需要权限配置权限");
    }
}
