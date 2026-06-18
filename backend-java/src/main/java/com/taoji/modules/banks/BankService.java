package com.taoji.modules.banks;

import com.taoji.common.AppException;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BankService {

    private final DSLContext dsl;

    public List<BankResponse> listBanks(int status) {
        return dsl.select()
                .from(DSL.table("banks"))
                .where(status == -1
                        ? DSL.trueCondition()
                        : DSL.field("status").eq((short) status))
                .orderBy(DSL.field("sort_order").asc(), DSL.field("id").asc())
                .fetch()
                .stream()
                .map(this::mapToBankResponse)
                .toList();
    }

    public BankResponse getBank(Integer bankId) {
        Record r = dsl.select()
                .from(DSL.table("banks"))
                .where(DSL.field("id").eq(bankId))
                .fetchOne();
        if (r == null) throw AppException.notFound("银行不存在");
        return mapToBankResponse(r);
    }

    @Transactional
    public BankResponse createBank(CreateBankRequest request) {
        LocalDateTime now = LocalDateTime.now();
        Integer bankId = dsl.insertInto(DSL.table("banks"))
                .set(DSL.field("name"), request.getName())
                .set(DSL.field("short_name"), request.getShortName())
                .set(DSL.field("contact_person"), request.getContactPerson())
                .set(DSL.field("contact_phone"), request.getContactPhone())
                .set(DSL.field("notes"), request.getNotes())
                .set(DSL.field("sort_order"), request.getSortOrder() != null ? request.getSortOrder() : 0)
                .set(DSL.field("status"), (short) 1)
                .set(DSL.field("created_at"), now)
                .set(DSL.field("updated_at"), now)
                .returningResult(DSL.field("id", Integer.class))
                .fetchOneInto(Integer.class);
        return getBank(bankId);
    }

    public List<ProductResponse> listProducts(Integer bankId, String productType) {
        Condition condition = DSL.trueCondition();
        if (bankId != null) {
            condition = condition.and(DSL.field("bp.bank_id").eq(bankId));
        }
        if (productType != null && !productType.isBlank()) {
            condition = condition.and(DSL.field("bp.product_type").eq(productType));
        }
        condition = condition.and(DSL.field("bp.status").eq((short) 1));

        return dsl.select(
                        DSL.field("bp.*"),
                        DSL.field("b.name").as("bank_name")
                )
                .from(DSL.table("bank_products").as("bp"))
                .join(DSL.table("banks").as("b"))
                .on(DSL.field("bp.bank_id").eq(DSL.field("b.id")))
                .where(condition)
                .orderBy(DSL.field("b.sort_order"), DSL.field("bp.sort_order"))
                .fetch()
                .stream()
                .map(r -> {
                    Integer productId = r.get(DSL.field("bp.id", Integer.class));
                    List<Map<String, Object>> configs = loadMaterialConfigs(productId);
                    return mapToProductResponse(r, configs);
                })
                .toList();
    }

    public ProductResponse getProduct(Integer productId) {
        Record r = dsl.select(
                        DSL.field("bp.*"),
                        DSL.field("b.name").as("bank_name")
                )
                .from(DSL.table("bank_products").as("bp"))
                .join(DSL.table("banks").as("b"))
                .on(DSL.field("bp.bank_id").eq(DSL.field("b.id")))
                .where(DSL.field("bp.id").eq(productId))
                .fetchOne();

        if (r == null) throw AppException.notFound("产品不存在");

        List<Map<String, Object>> configs = loadMaterialConfigs(productId);
        return mapToProductResponse(r, configs);
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        Integer productId = dsl.insertInto(DSL.table("bank_products"))
                .set(DSL.field("bank_id"), request.getBankId())
                .set(DSL.field("name"), request.getName())
                .set(DSL.field("product_type"), request.getProductType())
                .set(DSL.field("loan_min"), request.getLoanMin())
                .set(DSL.field("loan_max"), request.getLoanMax())
                .set(DSL.field("rate_min"), request.getRateMin())
                .set(DSL.field("description"), request.getDescription())
                .set(DSL.field("requirements"), request.getRequirements())
                .set(DSL.field("sort_order"), request.getSortOrder())
                .set(DSL.field("status"), (short) 1)
                .set(DSL.field("created_at"), LocalDateTime.now())
                .set(DSL.field("updated_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Integer.class))
                .fetchOneInto(Integer.class);

        return getProduct(productId);
    }

    @Transactional
    public ProductResponse createProductForBank(Integer bankId, CreateBankProductRequest request) {
        // Verify bank exists
        boolean bankExists = dsl.fetchExists(
                DSL.select().from(DSL.table("banks")).where(DSL.field("id").eq(bankId))
        );
        if (!bankExists) throw AppException.notFound("银行不存在");

        LocalDateTime now = LocalDateTime.now();
        Integer productId = dsl.insertInto(DSL.table("bank_products"))
                .set(DSL.field("bank_id"), bankId)
                .set(DSL.field("name"), request.getName())
                .set(DSL.field("product_type"), request.getProductType() != null ? request.getProductType() : "credit")
                .set(DSL.field("loan_amount"), request.getLoanAmount())
                .set(DSL.field("loan_term"), request.getLoanTerm())
                .set(DSL.field("sort_order"), request.getSortOrder() != null ? request.getSortOrder() : 0)
                .set(DSL.field("status"), (short) 1)
                .set(DSL.field("created_at"), now)
                .set(DSL.field("updated_at"), now)
                .returningResult(DSL.field("id", Integer.class))
                .fetchOneInto(Integer.class);

        return getProduct(productId);
    }

    public List<Map<String, Object>> getMaterialConfigs(Integer productId) {
        return loadMaterialConfigs(productId);
    }

    @Transactional
    public Map<String, Object> saveMaterialConfig(Integer productId, Map<String, Object> config) {
        Integer configId = (Integer) config.get("id");
        if (configId != null) {
            // Update
            dsl.update(DSL.table("bank_material_configs"))
                    .set(DSL.field("field_label"), config.get("fieldLabel"))
                    .set(DSL.field("field_type"), config.get("fieldType"))
                    .set(DSL.field("required"), config.get("required"))
                    .set(DSL.field("review_required"), config.get("reviewRequired"))
                    .set(DSL.field("source_hint"), config.get("sourceHint"))
                    .set(DSL.field("sort_order"), config.get("sortOrder"))
                    .where(DSL.field("id").eq(configId))
                    .execute();
        } else {
            // Insert
            configId = dsl.insertInto(DSL.table("bank_material_configs"))
                    .set(DSL.field("product_id"), productId)
                    .set(DSL.field("field_key"), config.get("fieldKey"))
                    .set(DSL.field("field_label"), config.get("fieldLabel"))
                    .set(DSL.field("field_type"), config.get("fieldType"))
                    .set(DSL.field("required"), config.get("required"))
                    .set(DSL.field("review_required"), config.get("reviewRequired"))
                    .set(DSL.field("source_hint"), config.get("sourceHint"))
                    .set(DSL.field("sort_order"), config.get("sortOrder"))
                    .returningResult(DSL.field("id", Integer.class))
                    .fetchOneInto(Integer.class);
        }
        return dsl.select()
                .from(DSL.table("bank_material_configs"))
                .where(DSL.field("id").eq(configId))
                .fetchOneMap();
    }

    // ---- Material Items ----

    public List<MaterialItemResponse> getMaterialItems(Integer productId) {
        // Verify product exists
        boolean exists = dsl.fetchExists(
                DSL.select().from(DSL.table("bank_products")).where(DSL.field("id").eq(productId))
        );
        if (!exists) throw AppException.notFound("产品不存在");

        return dsl.select()
                .from(DSL.table("bank_material_items"))
                .where(DSL.field("product_id").eq(productId))
                .orderBy(DSL.field("sort_order").asc(), DSL.field("id").asc())
                .fetch()
                .stream()
                .map(this::mapToMaterialItemResponse)
                .toList();
    }

    @Transactional
    public MaterialItemResponse createMaterialItem(Integer productId, CreateMaterialItemRequest request) {
        boolean exists = dsl.fetchExists(
                DSL.select().from(DSL.table("bank_products")).where(DSL.field("id").eq(productId))
        );
        if (!exists) throw AppException.notFound("产品不存在");

        Integer itemId = dsl.insertInto(DSL.table("bank_material_items"))
                .set(DSL.field("product_id"), productId)
                .set(DSL.field("name"), request.getName())
                .set(DSL.field("required"), request.getRequired() != null ? request.getRequired() : false)
                .set(DSL.field("source"), request.getSource())
                .set(DSL.field("format"), request.getFormat())
                .set(DSL.field("note"), request.getNote())
                .set(DSL.field("category"), request.getCategory())
                .set(DSL.field("sort_order"), request.getSortOrder() != null ? request.getSortOrder() : 0)
                .set(DSL.field("created_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Integer.class))
                .fetchOneInto(Integer.class);

        Record r = dsl.select()
                .from(DSL.table("bank_material_items"))
                .where(DSL.field("id").eq(itemId))
                .fetchOne();
        return mapToMaterialItemResponse(r);
    }

    @Transactional
    public void deleteMaterialItem(Integer itemId) {
        int deleted = dsl.deleteFrom(DSL.table("bank_material_items"))
                .where(DSL.field("id").eq(itemId))
                .execute();
        if (deleted == 0) throw AppException.notFound("资料条目不存在");
    }

    // ---- Field Mappings ----

    public List<FieldMappingResponse> getFieldMappings(Integer productId) {
        boolean exists = dsl.fetchExists(
                DSL.select().from(DSL.table("bank_products")).where(DSL.field("id").eq(productId))
        );
        if (!exists) throw AppException.notFound("产品不存在");

        return dsl.select()
                .from(DSL.table("bank_field_mappings"))
                .where(DSL.field("product_id").eq(productId))
                .orderBy(DSL.field("id").asc())
                .fetch()
                .stream()
                .map(this::mapToFieldMappingResponse)
                .toList();
    }

    @Transactional
    public FieldMappingResponse createFieldMapping(Integer productId, CreateFieldMappingRequest request) {
        boolean exists = dsl.fetchExists(
                DSL.select().from(DSL.table("bank_products")).where(DSL.field("id").eq(productId))
        );
        if (!exists) throw AppException.notFound("产品不存在");

        Integer mappingId = dsl.insertInto(DSL.table("bank_field_mappings"))
                .set(DSL.field("product_id"), productId)
                .set(DSL.field("sys_field"), request.getSysField())
                .set(DSL.field("bank_field"), request.getBankField())
                .set(DSL.field("source"), request.getSource())
                .set(DSL.field("note"), request.getNote())
                .set(DSL.field("created_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Integer.class))
                .fetchOneInto(Integer.class);

        Record r = dsl.select()
                .from(DSL.table("bank_field_mappings"))
                .where(DSL.field("id").eq(mappingId))
                .fetchOne();
        return mapToFieldMappingResponse(r);
    }

    @Transactional
    public void deleteFieldMapping(Integer mappingId) {
        int deleted = dsl.deleteFrom(DSL.table("bank_field_mappings"))
                .where(DSL.field("id").eq(mappingId))
                .execute();
        if (deleted == 0) throw AppException.notFound("字段口径不存在");
    }

    // ---- Templates ----

    public List<TemplateResponse> getTemplates(Integer productId) {
        boolean exists = dsl.fetchExists(
                DSL.select().from(DSL.table("bank_products")).where(DSL.field("id").eq(productId))
        );
        if (!exists) throw AppException.notFound("产品不存在");

        return dsl.select()
                .from(DSL.table("bank_templates"))
                .where(DSL.field("product_id").eq(productId))
                .orderBy(DSL.field("id").asc())
                .fetch()
                .stream()
                .map(this::mapToTemplateResponse)
                .toList();
    }

    @Transactional
    public TemplateResponse createTemplate(Integer productId, CreateTemplateRequest request) {
        boolean exists = dsl.fetchExists(
                DSL.select().from(DSL.table("bank_products")).where(DSL.field("id").eq(productId))
        );
        if (!exists) throw AppException.notFound("产品不存在");

        Integer templateId = dsl.insertInto(DSL.table("bank_templates"))
                .set(DSL.field("product_id"), productId)
                .set(DSL.field("name"), request.getName())
                .set(DSL.field("key_fields"), request.getKeyFields())
                .set(DSL.field("note"), request.getNote())
                .set(DSL.field("created_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Integer.class))
                .fetchOneInto(Integer.class);

        Record r = dsl.select()
                .from(DSL.table("bank_templates"))
                .where(DSL.field("id").eq(templateId))
                .fetchOne();
        return mapToTemplateResponse(r);
    }

    @Transactional
    public void deleteTemplate(Integer templateId) {
        int deleted = dsl.deleteFrom(DSL.table("bank_templates"))
                .where(DSL.field("id").eq(templateId))
                .execute();
        if (deleted == 0) throw AppException.notFound("模板不存在");
    }

    // ---- Private helpers ----

    private List<Map<String, Object>> loadMaterialConfigs(Integer productId) {
        return dsl.select()
                .from(DSL.table("bank_material_configs"))
                .where(DSL.field("product_id").eq(productId))
                .orderBy(DSL.field("sort_order").asc())
                .fetchMaps();
    }

    private BankResponse mapToBankResponse(Record r) {
        return BankResponse.builder()
                .id(r.get(DSL.field("id", Integer.class)))
                .name(r.get(DSL.field("name", String.class)))
                .shortName(r.get(DSL.field("short_name", String.class)))
                .logoUrl(r.get(DSL.field("logo_url", String.class)))
                .sortOrder(r.get(DSL.field("sort_order", Integer.class)))
                .status(r.get(DSL.field("status", Short.class)).intValue())
                .contactPerson(r.get(DSL.field("contact_person", String.class)))
                .contactPhone(r.get(DSL.field("contact_phone", String.class)))
                .notes(r.get(DSL.field("notes", String.class)))
                .createdAt(r.get(DSL.field("created_at", LocalDateTime.class)))
                .updatedAt(r.get(DSL.field("updated_at", LocalDateTime.class)))
                .build();
    }

    private ProductResponse mapToProductResponse(Record r, List<Map<String, Object>> configs) {
        return ProductResponse.builder()
                .id(r.get(DSL.field("bp.id", Integer.class)))
                .bankId(r.get(DSL.field("bp.bank_id", Integer.class)))
                .bankName(r.get(DSL.field("bank_name", String.class)))
                .name(r.get(DSL.field("bp.name", String.class)))
                .productType(r.get(DSL.field("bp.product_type", String.class)))
                .loanMin(r.get(DSL.field("bp.loan_min", java.math.BigDecimal.class)))
                .loanMax(r.get(DSL.field("bp.loan_max", java.math.BigDecimal.class)))
                .rateMin(r.get(DSL.field("bp.rate_min", java.math.BigDecimal.class)))
                .loanAmount(r.get(DSL.field("bp.loan_amount", String.class)))
                .loanTerm(r.get(DSL.field("bp.loan_term", String.class)))
                .description(r.get(DSL.field("bp.description", String.class)))
                .requirements(r.get(DSL.field("bp.requirements", String.class)))
                .sortOrder(r.get(DSL.field("bp.sort_order", Integer.class)))
                .status(r.get(DSL.field("bp.status", Short.class)).intValue())
                .createdAt(r.get(DSL.field("bp.created_at", LocalDateTime.class)))
                .updatedAt(r.get(DSL.field("bp.updated_at", LocalDateTime.class)))
                .materialConfigs(configs)
                .build();
    }

    private MaterialItemResponse mapToMaterialItemResponse(Record r) {
        return MaterialItemResponse.builder()
                .id(r.get(DSL.field("id", Integer.class)))
                .productId(r.get(DSL.field("product_id", Integer.class)))
                .name(r.get(DSL.field("name", String.class)))
                .required(r.get(DSL.field("required", Boolean.class)))
                .source(r.get(DSL.field("source", String.class)))
                .format(r.get(DSL.field("format", String.class)))
                .note(r.get(DSL.field("note", String.class)))
                .category(r.get(DSL.field("category", String.class)))
                .sortOrder(r.get(DSL.field("sort_order", Integer.class)))
                .build();
    }

    private FieldMappingResponse mapToFieldMappingResponse(Record r) {
        return FieldMappingResponse.builder()
                .id(r.get(DSL.field("id", Integer.class)))
                .productId(r.get(DSL.field("product_id", Integer.class)))
                .sysField(r.get(DSL.field("sys_field", String.class)))
                .bankField(r.get(DSL.field("bank_field", String.class)))
                .source(r.get(DSL.field("source", String.class)))
                .note(r.get(DSL.field("note", String.class)))
                .build();
    }

    private TemplateResponse mapToTemplateResponse(Record r) {
        return TemplateResponse.builder()
                .id(r.get(DSL.field("id", Integer.class)))
                .productId(r.get(DSL.field("product_id", Integer.class)))
                .name(r.get(DSL.field("name", String.class)))
                .keyFields(r.get(DSL.field("key_fields", String.class)))
                .note(r.get(DSL.field("note", String.class)))
                .fileUrl(r.get(DSL.field("file_url", String.class)))
                .build();
    }
}
