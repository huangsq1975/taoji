package com.taoji.modules.institutions;

import com.taoji.common.AppException;
import com.taoji.security.JwtUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class InstitutionService {

    private final DSLContext dsl;

    public Map<String, Object> getMyInstitution(JwtUserDetails currentUser) {
        Map<String, Object> institution = dsl.select(
                        DSL.field("i.*"),
                        DSL.field("mp.name").as("plan_name"),
                        DSL.field("mp.monthly_quota"),
                        DSL.field("mp.max_advisors"),
                        DSL.field("mp.features"),
                        DSL.field("mp.price_monthly")
                )
                .from(DSL.table("institutions").as("i"))
                .leftJoin(DSL.table("membership_plans").as("mp"))
                .on(DSL.field("i.plan_id").eq(DSL.field("mp.id")))
                .where(DSL.field("i.id").eq(currentUser.getInstitutionId()))
                .fetchOneMap();

        if (institution == null) throw AppException.notFound("机构不存在");

        // Get active subscription
        Map<String, Object> subscription = dsl.select(
                        DSL.field("s.*"),
                        DSL.field("mp.name").as("plan_name")
                )
                .from(DSL.table("institution_subscriptions").as("s"))
                .join(DSL.table("membership_plans").as("mp"))
                .on(DSL.field("s.plan_id").eq(DSL.field("mp.id")))
                .where(DSL.field("s.institution_id").eq(currentUser.getInstitutionId()))
                .and(DSL.field("s.status").eq("active"))
                .orderBy(DSL.field("s.expired_at").desc())
                .limit(1)
                .fetchOneMap();

        institution.put("activeSubscription", subscription);
        return institution;
    }

    @Transactional
    public Map<String, Object> updateInstitution(JwtUserDetails currentUser, Map<String, Object> updates) {
        // Only ADMIN can update institution info
        if (!"ADMIN".equals(currentUser.getRole())) {
            throw AppException.forbidden("只有管理员可以修改机构信息");
        }

        var update = dsl.update(DSL.table("institutions"))
                .set(DSL.field("updated_at"), LocalDateTime.now());

        if (updates.containsKey("name")) {
            update = update.set(DSL.field("name"), updates.get("name"));
        }

        update.where(DSL.field("id").eq(currentUser.getInstitutionId())).execute();

        return getMyInstitution(currentUser);
    }

    public Map<String, Object> getQuotaStats(JwtUserDetails currentUser) {
        Record institution = dsl.select(
                        DSL.field("quota_total"),
                        DSL.field("quota_used"),
                        DSL.field("quota_reset_at")
                )
                .from(DSL.table("institutions"))
                .where(DSL.field("id").eq(currentUser.getInstitutionId()))
                .fetchOne();

        if (institution == null) throw AppException.notFound("机构不存在");

        int total = institution.get(DSL.field("quota_total", Integer.class));
        int used = institution.get(DSL.field("quota_used", Integer.class));
        int remaining = total == -1 ? -1 : Math.max(0, total - used);

        // Recent call records (last 30 days)
        List<Map<String, Object>> recentCalls = dsl.select(
                        DSL.field("call_type"),
                        DSL.count().as("count")
                )
                .from(DSL.table("call_records"))
                .where(DSL.field("institution_id").eq(currentUser.getInstitutionId()))
                .and(DSL.field("created_at").gt(LocalDateTime.now().minusDays(30)))
                .groupBy(DSL.field("call_type"))
                .fetchMaps();

        return Map.of(
                "quotaTotal", total,
                "quotaUsed", used,
                "quotaRemaining", remaining,
                "quotaResetAt", institution.get(DSL.field("quota_reset_at", LocalDateTime.class)),
                "recentCallStats", recentCalls
        );
    }

    public List<Map<String, Object>> listAllInstitutions(JwtUserDetails currentUser) {
        if (!"ADMIN".equals(currentUser.getRole())) {
            throw AppException.forbidden("只有管理员可以查看所有机构");
        }
        return dsl.select(
                        DSL.field("i.*"),
                        DSL.field("mp.name").as("plan_name")
                )
                .from(DSL.table("institutions").as("i"))
                .leftJoin(DSL.table("membership_plans").as("mp"))
                .on(DSL.field("i.plan_id").eq(DSL.field("mp.id")))
                .where(DSL.field("i.deleted_at").isNull())
                .orderBy(DSL.field("i.created_at").desc())
                .fetchMaps();
    }
}
