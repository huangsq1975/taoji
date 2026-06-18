package com.taoji.modules.banks;

import com.taoji.common.ApiResponse;
import com.taoji.modules.banks.dto.BankResponse;
import com.taoji.modules.banks.dto.CreateProductRequest;
import com.taoji.modules.banks.dto.ProductResponse;
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
@RequestMapping("/banks")
@RequiredArgsConstructor
@Tag(name = "银行产品", description = "银行列表、产品查询、材料配置管理")
public class BankController {

    private final BankService bankService;

    @GetMapping
    @Operation(summary = "获取银行列表")
    public ApiResponse<List<BankResponse>> listBanks(
            @RequestParam(defaultValue = "1") int status) {
        return ApiResponse.ok(bankService.listBanks(status));
    }

    @GetMapping("/products")
    @Operation(summary = "获取贷款产品列表", description = "支持按银行ID和产品类型筛选")
    public ApiResponse<List<ProductResponse>> listProducts(
            @RequestParam(required = false) Integer bankId,
            @RequestParam(required = false) String productType) {
        return ApiResponse.ok(bankService.listProducts(bankId, productType));
    }

    @GetMapping("/products/{id}")
    @Operation(summary = "获取产品详情（含材料配置）")
    public ApiResponse<ProductResponse> getProduct(@PathVariable Integer id) {
        return ApiResponse.ok(bankService.getProduct(id));
    }

    @PostMapping("/products")
    @Operation(summary = "创建贷款产品（管理员）")
    public ApiResponse<ProductResponse> createProduct(
            @CurrentUser JwtUserDetails currentUser,
            @Valid @RequestBody CreateProductRequest request) {
        return ApiResponse.ok(bankService.createProduct(request));
    }

    @GetMapping("/products/{id}/material-configs")
    @Operation(summary = "获取产品材料配置")
    public ApiResponse<List<Map<String, Object>>> getMaterialConfigs(@PathVariable Integer id) {
        return ApiResponse.ok(bankService.getMaterialConfigs(id));
    }

    @PostMapping("/products/{id}/material-configs")
    @Operation(summary = "保存材料配置（新增或更新）")
    public ApiResponse<Map<String, Object>> saveMaterialConfig(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Integer id,
            @RequestBody Map<String, Object> config) {
        return ApiResponse.ok(bankService.saveMaterialConfig(id, config));
    }
}
