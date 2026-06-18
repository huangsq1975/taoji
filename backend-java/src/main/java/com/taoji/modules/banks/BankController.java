package com.taoji.modules.banks;

import com.taoji.common.ApiResponse;
import com.taoji.modules.banks.dto.BankResponse;
import com.taoji.modules.banks.dto.CreateBankProductRequest;
import com.taoji.modules.banks.dto.CreateBankRequest;
import com.taoji.modules.banks.dto.CreateFieldMappingRequest;
import com.taoji.modules.banks.dto.CreateMaterialItemRequest;
import com.taoji.modules.banks.dto.CreateProductRequest;
import com.taoji.modules.banks.dto.CreateTemplateRequest;
import com.taoji.modules.banks.dto.FieldMappingResponse;
import com.taoji.modules.banks.dto.MaterialItemResponse;
import com.taoji.modules.banks.dto.ProductResponse;
import com.taoji.modules.banks.dto.TemplateResponse;
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

    // ---- Banks ----

    @GetMapping
    @Operation(summary = "获取银行列表")
    public ApiResponse<List<BankResponse>> listBanks(
            @RequestParam(defaultValue = "1") int status) {
        return ApiResponse.ok(bankService.listBanks(status));
    }

    @PostMapping
    @Operation(summary = "创建银行（管理员）")
    public ApiResponse<BankResponse> createBank(
            @CurrentUser JwtUserDetails currentUser,
            @Valid @RequestBody CreateBankRequest request) {
        return ApiResponse.ok(bankService.createBank(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取银行详情")
    public ApiResponse<BankResponse> getBank(@PathVariable Integer id) {
        return ApiResponse.ok(bankService.getBank(id));
    }

    // ---- Products ----

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
    @Operation(summary = "创建贷款产品（管理员，旧路径兼容）")
    public ApiResponse<ProductResponse> createProduct(
            @CurrentUser JwtUserDetails currentUser,
            @Valid @RequestBody CreateProductRequest request) {
        return ApiResponse.ok(bankService.createProduct(request));
    }

    @PostMapping("/{bankId}/products")
    @Operation(summary = "在指定银行下创建产品（管理员）")
    public ApiResponse<ProductResponse> createProductForBank(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Integer bankId,
            @Valid @RequestBody CreateBankProductRequest request) {
        return ApiResponse.ok(bankService.createProductForBank(bankId, request));
    }

    // ---- Material Configs (legacy) ----

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

    // ---- Material Items ----

    @GetMapping("/products/{id}/materials")
    @Operation(summary = "获取产品资料条目列表")
    public ApiResponse<List<MaterialItemResponse>> getMaterialItems(@PathVariable Integer id) {
        return ApiResponse.ok(bankService.getMaterialItems(id));
    }

    @PostMapping("/products/{id}/materials")
    @Operation(summary = "新增产品资料条目")
    public ApiResponse<MaterialItemResponse> createMaterialItem(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody CreateMaterialItemRequest request) {
        return ApiResponse.ok(bankService.createMaterialItem(id, request));
    }

    @DeleteMapping("/materials/{id}")
    @Operation(summary = "删除资料条目")
    public ApiResponse<Void> deleteMaterialItem(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Integer id) {
        bankService.deleteMaterialItem(id);
        return ApiResponse.ok(null);
    }

    // ---- Field Mappings ----

    @GetMapping("/products/{id}/field-mappings")
    @Operation(summary = "获取产品字段口径列表")
    public ApiResponse<List<FieldMappingResponse>> getFieldMappings(@PathVariable Integer id) {
        return ApiResponse.ok(bankService.getFieldMappings(id));
    }

    @PostMapping("/products/{id}/field-mappings")
    @Operation(summary = "新增产品字段口径")
    public ApiResponse<FieldMappingResponse> createFieldMapping(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody CreateFieldMappingRequest request) {
        return ApiResponse.ok(bankService.createFieldMapping(id, request));
    }

    @DeleteMapping("/field-mappings/{id}")
    @Operation(summary = "删除字段口径")
    public ApiResponse<Void> deleteFieldMapping(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Integer id) {
        bankService.deleteFieldMapping(id);
        return ApiResponse.ok(null);
    }

    // ---- Templates ----

    @GetMapping("/products/{id}/templates")
    @Operation(summary = "获取产品制式表格列表")
    public ApiResponse<List<TemplateResponse>> getTemplates(@PathVariable Integer id) {
        return ApiResponse.ok(bankService.getTemplates(id));
    }

    @PostMapping("/products/{id}/templates")
    @Operation(summary = "新增产品制式表格")
    public ApiResponse<TemplateResponse> createTemplate(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody CreateTemplateRequest request) {
        return ApiResponse.ok(bankService.createTemplate(id, request));
    }

    @DeleteMapping("/templates/{id}")
    @Operation(summary = "删除制式表格")
    public ApiResponse<Void> deleteTemplate(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Integer id) {
        bankService.deleteTemplate(id);
        return ApiResponse.ok(null);
    }
}
