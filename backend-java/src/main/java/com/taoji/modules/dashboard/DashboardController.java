package com.taoji.modules.dashboard;

import com.taoji.common.ApiResponse;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "工作台", description = "今日作业指标汇总")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(summary = "获取工作台指标", description = "返回今日关键指标、客户列表和任务快览，替代前端多接口聚合")
    public ApiResponse<Map<String, Object>> getStats(
            @CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(dashboardService.getStats(currentUser));
    }
}
