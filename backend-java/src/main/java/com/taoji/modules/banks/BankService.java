package com.taoji.modules.banks;

import com.taoji.common.AppException;
import com.taoji.modules.banks.dto.BankResponse;
import com.taoji.modules.banks.dto.CreateProductRequest;
import com.taoji.modules.banks.dto.ProductResponse;
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
                .createdAt(r.get(DSL.field("created_at", LocalDateTime.class)))
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
                .description(r.get(DSL.field("bp.description", String.class)))
                .requirements(r.get(DSL.field("bp.requirements", String.class)))
                .sortOrder(r.get(DSL.field("bp.sort_order", Integer.class)))
                .status(r.get(DSL.field("bp.status", Short.class)).intValue())
                .createdAt(r.get(DSL.field("bp.created_at", LocalDateTime.class)))
                .materialConfigs(configs)
                .build();
    }
}
