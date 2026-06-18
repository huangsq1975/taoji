package com.taoji.modules.memberships;

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
@RequestMapping("/memberships")
@RequiredArgsConstructor
@Tag(name = "套餐管理", description = "会员套餐列表、订阅升级、历史记录")
public class MembershipController {

    private final MembershipService membershipService;

    @GetMapping("/plans")
    @Operation(summary = "获取所有套餐列表")
    public ApiResponse<List<Map<String, Object>>> listPlans() {
        return ApiResponse.ok(membershipService.listPlans());
    }

    @GetMapping("/plans/{id}")
    @Operation(summary = "获取套餐详情")
    public ApiResponse<Map<String, Object>> getPlan(@PathVariable Integer id) {
        return ApiResponse.ok(membershipService.getPlanById(id));
    }

    @GetMapping("/subscriptions")
    @Operation(summary = "获取机构订阅历史")
    public ApiResponse<List<Map<String, Object>>> getSubscriptionHistory(
            @CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(membershipService.getSubscriptionHistory(currentUser));
    }

    @PostMapping("/subscribe")
    @Operation(summary = "订阅套餐（管理员）", description = "选择套餐和订阅月数进行升级")
    public ApiResponse<Map<String, Object>> subscribe(
            @CurrentUser JwtUserDetails currentUser,
            @RequestBody Map<String, Object> body) {
        Integer planId = (Integer) body.get("planId");
        int months = body.containsKey("months") ? (Integer) body.get("months") : 1;
        return ApiResponse.ok(membershipService.subscribe(currentUser, planId, months));
    }
}
