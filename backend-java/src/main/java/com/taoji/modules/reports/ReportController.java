package com.taoji.modules.reports;

import com.taoji.common.ApiResponse;
import com.taoji.common.PageRequest;
import com.taoji.common.PaginatedResult;
import com.taoji.modules.reports.dto.CreateReportTaskRequest;
import com.taoji.modules.reports.dto.ReviewFieldRequest;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "报告任务", description = "AI填报任务管理、字段审核、导出")
public class ReportController {

    private final ReportService reportService;

    @GetMapping
    @Operation(summary = "获取报告任务列表")
    public ApiResponse<PaginatedResult<Map<String, Object>>> listReportTasks(
            @CurrentUser JwtUserDetails currentUser,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String status,
            @ModelAttribute PageRequest pageRequest) {
        return ApiResponse.ok(reportService.listReportTasks(currentUser, customerId, status, pageRequest));
    }

    @PostMapping
    @Operation(summary = "创建报告任务", description = "选择客户和银行产品，创建AI填报任务")
    public ApiResponse<Map<String, Object>> createReportTask(
            @CurrentUser JwtUserDetails currentUser,
            @Valid @RequestBody CreateReportTaskRequest request) {
        return ApiResponse.ok(reportService.createReportTask(currentUser, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取报告任务详情")
    public ApiResponse<Map<String, Object>> getReportTask(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        return ApiResponse.ok(reportService.getReportTask(currentUser, id));
    }

    @GetMapping("/{id}/fields")
    @Operation(summary = "获取字段草稿列表", description = "包含AI填写值、置信度、状态")
    public ApiResponse<List<Map<String, Object>>> getReportFields(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        return ApiResponse.ok(reportService.getReportFieldDrafts(currentUser, id));
    }

    @PostMapping("/{id}/review")
    @Operation(summary = "审核字段", description = "顾问审核AI填写值：批准/修正/拒绝")
    public ApiResponse<Map<String, Object>> reviewField(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id,
            @Valid @RequestBody ReviewFieldRequest request) {
        return ApiResponse.ok(reportService.reviewField(currentUser, id, request));
    }

    @PostMapping("/{id}/export")
    @Operation(summary = "导出报告", description = "将字段打包成ZIP并记录导出记录")
    public ApiResponse<Map<String, Object>> exportReport(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        return ApiResponse.ok(reportService.exportReport(currentUser, id));
    }
}
