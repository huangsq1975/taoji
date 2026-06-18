package com.taoji.modules.dashboard;

import com.taoji.security.JwtUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final DSLContext dsl;

    public Map<String, Object> getStats(JwtUserDetails currentUser) {
        Long institutionId = currentUser.getInstitutionId();
        Condition customerCond = buildCustomerAccessCondition(currentUser);

        // 1. 资料缺口客户数（doc_completeness < 80 且未完成/未删除）
        Integer docGapCount = dsl.selectCount()
                .from(DSL.table("customers").as("c"))
                .where(customerCond)
                .and(DSL.field("c.deleted_at").isNull())
                .and(DSL.field("c.status::text").notIn("DONE", "PAUSED"))
                .and(DSL.field("c.doc_completeness").lt(80))
                .fetchOneInto(Integer.class);

        // 2. 待处理作业总数（报告任务总数）
        Integer taskTotal = dsl.selectCount()
                .from(DSL.table("report_tasks"))
                .where(DSL.field("institution_id").eq(institutionId))
                .fetchOneInto(Integer.class);

        // 3. AI识别待处理数
        Integer aiPending = dsl.selectCount()
                .from(DSL.table("customer_documents").as("d"))
                .join(DSL.table("customers").as("c"))
                .on(DSL.field("d.customer_id").eq(DSL.field("c.id")))
                .where(DSL.field("c.institution_id").eq(institutionId))
                .and(DSL.field("d.ai_parse_status").eq("PENDING"))
                .fetchOneInto(Integer.class);

        // 4. 机构配额
        Map<String, Object> institution = dsl.select(
                        DSL.field("quota_total"),
                        DSL.field("quota_used")
                )
                .from(DSL.table("institutions"))
                .where(DSL.field("id").eq(institutionId))
                .fetchOneMap();

        int reportQuota = institution != null && institution.get("quota_total") != null
                ? ((Number) institution.get("quota_total")).intValue() : -1;
        int reportUsed = institution != null && institution.get("quota_used") != null
                ? ((Number) institution.get("quota_used")).intValue() : 0;

        // 5. 今日客户作业列表（优先显示资料不全、进行中的客户，最多6条）
        List<Map<String, Object>> rawCustomers = dsl.select(
                        DSL.field("c.id"),
                        DSL.field("c.name"),
                        DSL.field("c.status"),
                        DSL.field("c.doc_completeness").as("docCompleteness"),
                        DSL.field("c.risk_notes").as("riskNotes"),
                        DSL.field("c.loan_amount").as("loanAmount"),
                        DSL.field("c.institution_id").as("institutionId"),
                        DSL.field("c.advisor_id").as("advisorId"),
                        DSL.field("c.created_at").as("createdAt"),
                        DSL.field("c.updated_at").as("updatedAt"),
                        DSL.field("u.name").as("advisorName")
                )
                .from(DSL.table("customers").as("c"))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("c.advisor_id").eq(DSL.field("u.id")))
                .where(customerCond)
                .and(DSL.field("c.deleted_at").isNull())
                .and(DSL.field("c.status::text").notIn("DONE", "PAUSED"))
                .orderBy(DSL.field("c.doc_completeness").asc(), DSL.field("c.updated_at").desc())
                .limit(6)
                .fetchMaps();

        // 附加空 labels 以兼容前端 ApiCustomer 类型
        List<Map<String, Object>> todayCustomers = rawCustomers.stream()
                .map(r -> {
                    Map<String, Object> m = new HashMap<>(r);
                    m.put("labels", List.of());
                    return m;
                })
                .toList();

        // 6. 最近AI填表任务（最多3条，排除已导出）
        List<Map<String, Object>> recentTasks = dsl.select(
                        DSL.field("rt.*"),
                        DSL.field("c.name").as("customer_name"),
                        DSL.field("bp.name").as("product_name"),
                        DSL.field("b.short_name").as("bank_short_name"),
                        DSL.field("u.name").as("advisor_name")
                )
                .from(DSL.table("report_tasks").as("rt"))
                .join(DSL.table("customers").as("c"))
                .on(DSL.field("rt.customer_id").eq(DSL.field("c.id")))
                .join(DSL.table("bank_products").as("bp"))
                .on(DSL.field("rt.product_id").eq(DSL.field("bp.id")))
                .join(DSL.table("banks").as("b"))
                .on(DSL.field("bp.bank_id").eq(DSL.field("b.id")))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("rt.advisor_id").eq(DSL.field("u.id")))
                .where(DSL.field("rt.institution_id").eq(institutionId))
                .and(DSL.field("rt.status::text").notEqual("EXPORTED"))
                .orderBy(DSL.field("rt.updated_at").desc())
                .limit(3)
                .fetchMaps();

        Map<String, Object> result = new HashMap<>();
        result.put("docGapCount", docGapCount != null ? docGapCount : 0);
        result.put("taskTotal", taskTotal != null ? taskTotal : 0);
        result.put("aiPending", aiPending != null ? aiPending : 0);
        result.put("reportQuota", reportQuota);
        result.put("reportUsed", reportUsed);
        result.put("todayCustomers", todayCustomers);
        result.put("recentTasks", recentTasks);
        return result;
    }

    private Condition buildCustomerAccessCondition(JwtUserDetails user) {
        if ("SELF".equals(user.getDataScope())) {
            return DSL.field("c.institution_id").eq(user.getInstitutionId())
                    .and(DSL.field("c.advisor_id").eq(user.getUserId()));
        }
        return DSL.field("c.institution_id").eq(user.getInstitutionId());
    }
}
