package com.taoji.modules.customers;

import com.taoji.common.ApiResponse;
import com.taoji.common.PageRequest;
import com.taoji.common.PaginatedResult;
import com.taoji.modules.customers.dto.*;
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
@RequestMapping("/customers")
@RequiredArgsConstructor
@Tag(name = "客户管理", description = "客户档案CRUD、跟进记录、概览")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @Operation(summary = "获取客户列表", description = "支持分页、关键字搜索和状态筛选")
    public ApiResponse<PaginatedResult<CustomerResponse>> listCustomers(
            @CurrentUser JwtUserDetails currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @ModelAttribute PageRequest pageRequest) {
        return ApiResponse.ok(customerService.listCustomers(currentUser, keyword, status, pageRequest));
    }

    @PostMapping
    @Operation(summary = "创建客户", description = "新增客户档案")
    public ApiResponse<CustomerResponse> createCustomer(
            @CurrentUser JwtUserDetails currentUser,
            @Valid @RequestBody CreateCustomerRequest request) {
        return ApiResponse.ok(customerService.createCustomer(currentUser, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取客户详情")
    public ApiResponse<CustomerResponse> getCustomer(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        return ApiResponse.ok(customerService.getCustomerById(currentUser, id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新客户信息")
    public ApiResponse<CustomerResponse> updateCustomer(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id,
            @RequestBody UpdateCustomerRequest request) {
        return ApiResponse.ok(customerService.updateCustomer(currentUser, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除客户（软删除）")
    public ApiResponse<Void> deleteCustomer(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        customerService.deleteCustomer(currentUser, id);
        return ApiResponse.ok();
    }

    @GetMapping("/{id}/overview")
    @Operation(summary = "获取客户概览", description = "包含文档数、跟进数、授权状态、报告任务数")
    public ApiResponse<Map<String, Object>> getOverview(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        return ApiResponse.ok(customerService.getCustomerOverview(currentUser, id));
    }

    @GetMapping("/{id}/follow-ups")
    @Operation(summary = "获取跟进记录列表")
    public ApiResponse<List<Map<String, Object>>> getFollowUps(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        return ApiResponse.ok(customerService.getFollowUps(currentUser, id));
    }

    @PostMapping("/{id}/follow-ups")
    @Operation(summary = "添加跟进记录")
    public ApiResponse<Map<String, Object>> addFollowUp(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id,
            @Valid @RequestBody AddFollowUpRequest request) {
        return ApiResponse.ok(customerService.addFollowUp(currentUser, id, request));
    }
}
