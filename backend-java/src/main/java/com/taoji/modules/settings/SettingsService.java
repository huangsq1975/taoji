package com.taoji.modules.settings;

import com.taoji.common.AppException;
import com.taoji.common.PaginatedResult;
import com.taoji.security.JwtUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettingsService {

    private final DSLContext dsl;

    // ─── AI Rules ─────────────────────────────────────────────────────────────

    public List<Map<String, Object>> listAiRules(JwtUserDetails currentUser) {
        return dsl.select()
                .from(DSL.table("ai_rules"))
                .where(DSL.field("institution_id").eq(currentUser.getInstitutionId())
                        .or(DSL.field("institution_id").isNull()))
                .orderBy(
                        DSL.field("CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END"),
                        DSL.field("id").asc()
                )
                .fetchMaps();
    }

    @Transactional
    public Map<String, Object> createAiRule(JwtUserDetails currentUser, CreateAiRuleRequest req) {
        Integer newId = dsl.insertInto(DSL.table("ai_rules"))
                .set(DSL.field("institution_id"), currentUser.getInstitutionId())
                .set(DSL.field("name"), req.name())
                .set(DSL.field("fields"), req.fields())
                .set(DSL.field("trigger"), req.trigger())
                .set(DSL.field("priority"), req.priority() != null ? req.priority() : "MEDIUM")
                .set(DSL.field("status"), "ENABLED")
                .set(DSL.field("description"), req.description())
                .set(DSL.field("created_by"), currentUser.getUserId())
                .set(DSL.field("created_at"), LocalDateTime.now())
                .set(DSL.field("updated_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Integer.class))
                .fetchOneInto(Integer.class);
        return fetchAiRule(newId);
    }

    @Transactional
    public Map<String, Object> updateAiRule(JwtUserDetails currentUser, Integer id, UpdateAiRuleRequest req) {
        Map<String, Object> existing = fetchAiRule(id);
        Long ownInstitution = currentUser.getInstitutionId();
        Object owner = existing.get("institution_id");
        if (owner != null && !owner.toString().equals(ownInstitution.toString())) {
            throw AppException.forbidden("无权修改其他机构的规则");
        }

        var update = dsl.update(DSL.table("ai_rules"))
                .set(DSL.field("updated_at"), LocalDateTime.now());
        if (req.name() != null)        update = update.set(DSL.field("name"), req.name());
        if (req.fields() != null)      update = update.set(DSL.field("fields"), req.fields());
        if (req.trigger() != null)     update = update.set(DSL.field("trigger"), req.trigger());
        if (req.priority() != null)    update = update.set(DSL.field("priority"), req.priority());
        if (req.description() != null) update = update.set(DSL.field("description"), req.description());
        update.where(DSL.field("id").eq(id)).execute();

        return fetchAiRule(id);
    }

    @Transactional
    public Map<String, Object> toggleAiRule(JwtUserDetails currentUser, Integer id) {
        Map<String, Object> existing = fetchAiRule(id);
        Long ownInstitution = currentUser.getInstitutionId();
        Object owner = existing.get("institution_id");
        if (owner != null && !owner.toString().equals(ownInstitution.toString())) {
            throw AppException.forbidden("无权操作其他机构的规则");
        }

        String current = (String) existing.get("status");
        String next = "ENABLED".equals(current) ? "DISABLED" : "ENABLED";
        dsl.update(DSL.table("ai_rules"))
                .set(DSL.field("status"), next)
                .set(DSL.field("updated_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(id))
                .execute();
        return fetchAiRule(id);
    }

    private Map<String, Object> fetchAiRule(Integer id) {
        Map<String, Object> row = dsl.select()
                .from(DSL.table("ai_rules"))
                .where(DSL.field("id").eq(id))
                .fetchOneMap();
        if (row == null) throw AppException.notFound("AI规则不存在");
        return row;
    }

    // ─── Prompt Configs ───────────────────────────────────────────────────────

    public List<Map<String, Object>> listPromptConfigs(JwtUserDetails currentUser) {
        return dsl.select()
                .from(DSL.table("prompt_configs"))
                .where(DSL.field("institution_id").eq(currentUser.getInstitutionId())
                        .or(DSL.field("institution_id").isNull()))
                .orderBy(DSL.field("id").asc())
                .fetchMaps();
    }

    @Transactional
    public Map<String, Object> updatePromptConfig(JwtUserDetails currentUser, Integer id,
                                                   String prompt, String model) {
        Map<String, Object> existing = dsl.select()
                .from(DSL.table("prompt_configs"))
                .where(DSL.field("id").eq(id))
                .fetchOneMap();
        if (existing == null) throw AppException.notFound("Prompt配置不存在");

        Long ownInstitution = currentUser.getInstitutionId();
        Object owner = existing.get("institution_id");
        // 系统默认 Prompt (institution_id=NULL) 需要 ADMIN 权限
        if (owner == null && !"ADMIN".equals(currentUser.getRole())) {
            throw AppException.forbidden("只有管理员可以修改系统默认Prompt");
        }
        if (owner != null && !owner.toString().equals(ownInstitution.toString())) {
            throw AppException.forbidden("无权修改其他机构的Prompt配置");
        }

        var update = dsl.update(DSL.table("prompt_configs"))
                .set(DSL.field("prompt"), prompt)
                .set(DSL.field("updated_at"), LocalDateTime.now());
        if (model != null && !model.isBlank()) {
            update = update.set(DSL.field("model"), model);
        }
        update.where(DSL.field("id").eq(id)).execute();

        return dsl.select()
                .from(DSL.table("prompt_configs"))
                .where(DSL.field("id").eq(id))
                .fetchOneMap();
    }

    // ─── Usage Logs (调用记录) ─────────────────────────────────────────────────

    /** 前端 type 过滤值 → DB call_type 枚举值 */
    private static final Map<String, String> TYPE_LABEL_TO_DB = Map.of(
            "报告生成", "REPORT_FILL",
            "材料整理", "DOC_EXPORT",
            "API调用",  "API_CALL"
    );

    /** DB call_type → 前端显示标签 */
    private static final Map<String, String> DB_TO_TYPE_LABEL = Map.of(
            "AI_RECOGNITION", "材料识别",
            "REPORT_FILL",    "报告生成",
            "DOC_EXPORT",     "材料整理",
            "API_CALL",       "API调用"
    );

    /** DB status → 前端显示标签 */
    private static final Map<String, String> STATUS_LABEL = Map.of(
            "success", "调用成功",
            "pending", "待处理",
            "failed",  "调用失败"
    );

    public PaginatedResult<Map<String, Object>> listUsageLogs(
            JwtUserDetails currentUser, String type, String keyword, int page, int pageSize) {

        Condition where = DSL.field("cr.institution_id").eq(currentUser.getInstitutionId());

        if (type != null && !type.isBlank()) {
            String dbType = TYPE_LABEL_TO_DB.get(type);
            if (dbType != null) {
                where = where.and(DSL.field("cr.call_type").cast(String.class).eq(dbType));
            }
        }

        if (keyword != null && !keyword.isBlank()) {
            String like = "%" + keyword.trim() + "%";
            where = where.and(
                    DSL.field("c.name").likeIgnoreCase(like)
                            .or(DSL.field("u.name").likeIgnoreCase(like))
                            .or(DSL.field("u.phone").like(like))
            );
        }

        long total = dsl.selectCount()
                .from(DSL.table("call_records").as("cr"))
                .leftJoin(DSL.table("customers").as("c"))
                .on(DSL.field("cr.customer_id").eq(DSL.field("c.id")))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("cr.user_id").eq(DSL.field("u.id")))
                .where(where)
                .fetchOneInto(Long.class);

        List<Record> rows = dsl.select(
                        DSL.field("cr.id"),
                        DSL.field("cr.created_at"),
                        DSL.field("cr.call_type"),
                        DSL.field("cr.quota_cost"),
                        DSL.field("cr.status"),
                        DSL.field("cr.detail"),
                        DSL.field("c.name").as("customer_name"),
                        DSL.coalesce(DSL.field("u.name"), DSL.field("u.phone")).as("user_name"),
                        DSL.field("u.phone").as("user_phone")
                )
                .from(DSL.table("call_records").as("cr"))
                .leftJoin(DSL.table("customers").as("c"))
                .on(DSL.field("cr.customer_id").eq(DSL.field("c.id")))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("cr.user_id").eq(DSL.field("u.id")))
                .where(where)
                .orderBy(DSL.field("cr.created_at").desc())
                .limit(pageSize)
                .offset((page - 1) * pageSize)
                .fetch();

        List<Map<String, Object>> items = rows.stream()
                .map(this::mapToUsageLog)
                .collect(Collectors.toList());

        return new PaginatedResult<>(items, total, page, pageSize);
    }

    public Map<String, Object> getUsageSummary(JwtUserDetails currentUser) {
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);

        Condition thisMonth = DSL.field("cr.institution_id").eq(currentUser.getInstitutionId())
                .and(DSL.field("cr.created_at").ge(monthStart));

        // 按 call_type 聚合本月调用次数
        Map<String, Integer> countByType = dsl.select(
                        DSL.field("cr.call_type").cast(String.class).as("call_type"),
                        DSL.sum(DSL.field("cr.quota_cost", Integer.class)).as("cnt")
                )
                .from(DSL.table("call_records").as("cr"))
                .where(thisMonth)
                .groupBy(DSL.field("cr.call_type"))
                .fetchMap(r -> r.get("call_type", String.class),
                          r -> r.get("cnt", Integer.class));

        int reportCount  = countByType.getOrDefault("REPORT_FILL",    0);
        int packageCount = countByType.getOrDefault("DOC_EXPORT",     0);
        int apiCount     = countByType.getOrDefault("API_CALL",       0);
        int aiCount      = countByType.getOrDefault("AI_RECOGNITION", 0);
        int totalThisMonth = reportCount + packageCount + apiCount + aiCount;

        // 机构配额重置日
        LocalDateTime resetAt = dsl.select(DSL.field("quota_reset_at", LocalDateTime.class))
                .from(DSL.table("institutions"))
                .where(DSL.field("id").eq(currentUser.getInstitutionId()))
                .fetchOneInto(LocalDateTime.class);

        String resetDate = resetAt != null
                ? resetAt.format(DateTimeFormatter.ofPattern("每月dd日"))
                : "每月1日";

        // 员工用量（本月，按 user_id 聚合）
        List<Record> empRows = dsl.select(
                        DSL.field("u.id").as("uid"),
                        DSL.coalesce(DSL.field("u.name"), DSL.field("u.phone")).as("name"),
                        DSL.sum(DSL.field("cr.quota_cost", Integer.class)).as("count")
                )
                .from(DSL.table("call_records").as("cr"))
                .join(DSL.table("users").as("u"))
                .on(DSL.field("cr.user_id").eq(DSL.field("u.id")))
                .where(thisMonth)
                .groupBy(DSL.field("u.id"), DSL.field("u.name"), DSL.field("u.phone"))
                .orderBy(DSL.field("count").desc())
                .fetch();

        // 每位员工的配额（取机构套餐月配额，默认30）
        Integer planQuota = dsl.select(DSL.field("mp.monthly_quota", Integer.class))
                .from(DSL.table("membership_plans").as("mp"))
                .join(DSL.table("institutions").as("i"))
                .on(DSL.field("i.plan_id").eq(DSL.field("mp.id")))
                .where(DSL.field("i.id").eq(currentUser.getInstitutionId()))
                .fetchOneInto(Integer.class);
        int defaultQuotaPerUser = planQuota != null ? planQuota : 30;

        List<Map<String, Object>> byEmployee = empRows.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name",  r.get("name", String.class));
            m.put("count", r.get("count", Integer.class));
            m.put("quota", defaultQuotaPerUser);
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalThisMonth", totalThisMonth);
        result.put("reportCount",    reportCount);
        result.put("packageCount",   packageCount);
        result.put("apiCount",       apiCount);
        result.put("resetDate",      resetDate);
        result.put("byEmployee",     byEmployee);
        return result;
    }

    public void exportUsageLogs(JwtUserDetails currentUser, PrintWriter writer) {
        Condition where = DSL.field("cr.institution_id").eq(currentUser.getInstitutionId());

        List<Record> rows = dsl.select(
                        DSL.field("cr.id"),
                        DSL.field("cr.created_at"),
                        DSL.field("cr.call_type"),
                        DSL.field("cr.quota_cost"),
                        DSL.field("cr.status"),
                        DSL.field("cr.detail"),
                        DSL.field("c.name").as("customer_name"),
                        DSL.coalesce(DSL.field("u.name"), DSL.field("u.phone")).as("user_name")
                )
                .from(DSL.table("call_records").as("cr"))
                .leftJoin(DSL.table("customers").as("c"))
                .on(DSL.field("cr.customer_id").eq(DSL.field("c.id")))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("cr.user_id").eq(DSL.field("u.id")))
                .where(where)
                .orderBy(DSL.field("cr.created_at").desc())
                .fetch();

        writer.println("ID,时间,类型,操作目标,操作人,扣次,状态");
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (Record r : rows) {
            LocalDateTime createdAt = r.get("created_at", LocalDateTime.class);
            String dbType = r.get("call_type", String.class);
            String status = r.get("status", String.class);
            writer.printf("%d,%s,%s,%s,%s,%d,%s%n",
                    r.get("id", Long.class),
                    createdAt != null ? createdAt.format(fmt) : "",
                    DB_TO_TYPE_LABEL.getOrDefault(dbType, dbType),
                    csvEscape(r.get("customer_name", String.class)),
                    csvEscape(r.get("user_name", String.class)),
                    r.get("quota_cost", Integer.class),
                    STATUS_LABEL.getOrDefault(status, status));
        }
    }

    private Map<String, Object> mapToUsageLog(Record r) {
        String dbType = r.get("call_type", String.class);
        String dbStatus = r.get("status", String.class);
        String userName = r.get("user_name", String.class);
        String target = r.get("customer_name", String.class);
        if (target == null || target.isBlank()) {
            target = r.get("detail", String.class);
        }

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",        r.get("id", Long.class));
        m.put("createdAt", r.get("created_at", LocalDateTime.class));
        m.put("type",      DB_TO_TYPE_LABEL.getOrDefault(dbType, dbType));
        m.put("target",    target != null ? target : "—");
        m.put("userName",  userName != null ? userName : "—");
        m.put("cost",      r.get("quota_cost", Integer.class));
        m.put("status",    STATUS_LABEL.getOrDefault(dbStatus, dbStatus));
        return m;
    }

    private static String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // ─── Request records ──────────────────────────────────────────────────────

    public record CreateAiRuleRequest(
            String name,
            String fields,
            String trigger,
            String priority,
            String description
    ) {}

    public record UpdateAiRuleRequest(
            String name,
            String fields,
            String trigger,
            String priority,
            String description
    ) {}

    public record UpdatePromptRequest(
            String prompt,
            String model
    ) {}
}
