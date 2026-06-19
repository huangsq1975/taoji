package com.taoji.modules.users;

import com.taoji.common.ApiResponse;
import com.taoji.common.PageRequest;
import com.taoji.common.PaginatedResult;
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

import java.util.Map;

@RestController
@RequestMapping("/institution")
@RequiredArgsConstructor
@Tag(name = "用户管理", description = "机构成员管理")
public class UserController {

    private final UserService userService;

    @GetMapping("/members")
    @Operation(summary = "获取机构成员列表", description = "支持分页和关键字搜索")
    public ApiResponse<PaginatedResult<MemberResponse>> listMembers(
            @CurrentUser JwtUserDetails currentUser,
            @RequestParam(required = false) String keyword,
            @ModelAttribute PageRequest pageRequest) {
        return ApiResponse.ok(userService.listMembers(currentUser.getInstitutionId(), keyword, pageRequest));
    }

    @PostMapping("/members")
    @Operation(summary = "创建机构成员", description = "创建新的顾问或主管账号")
    public ApiResponse<MemberResponse> createMember(
            @CurrentUser JwtUserDetails currentUser,
            @Valid @RequestBody CreateMemberRequest request) {
        return ApiResponse.ok(userService.createMember(currentUser.getInstitutionId(), request));
    }

    @PutMapping("/members/{id}/permissions")
    @Operation(summary = "更新成员权限", description = "更新指定成员的角色、数据范围和功能权限")
    public ApiResponse<MemberResponse> updatePermissions(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePermissionsRequest request) {
        return ApiResponse.ok(userService.updatePermissions(currentUser.getInstitutionId(), id, currentUser.getUserId(), request));
    }

    @PutMapping("/members/{id}/status")
    @Operation(summary = "更新成员状态", description = "启用或禁用成员账号")
    public ApiResponse<MemberResponse> updateStatus(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {
        Integer status = body.get("status");
        if (status == null || (status != 0 && status != 1)) {
            throw new IllegalArgumentException("status must be 0 or 1");
        }
        return ApiResponse.ok(userService.updateStatus(currentUser.getInstitutionId(), id, status));
    }

    @GetMapping("/members/{id}")
    @Operation(summary = "获取成员详情")
    public ApiResponse<MemberResponse> getMember(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        return ApiResponse.ok(userService.getMemberById(currentUser.getInstitutionId(), id));
    }
}
