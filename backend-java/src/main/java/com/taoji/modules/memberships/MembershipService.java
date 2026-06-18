package com.taoji.modules.memberships;

import com.taoji.common.AppException;
import com.taoji.security.JwtUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MembershipService {

    private final DSLContext dsl;

    public List<Map<String, Object>> listPlans() {
        return dsl.select()
                .from(DSL.table("membership_plans"))
                .where(DSL.field("is_active").eq((short) 1))
                .orderBy(DSL.field("sort_order").asc())
                .fetchMaps();
    }

    public Map<String, Object> getPlanById(Integer planId) {
        Map<String, Object> plan = dsl.select()
                .from(DSL.table("membership_plans"))
                .where(DSL.field("id").eq(planId))
                .fetchOneMap();
        if (plan == null) throw AppException.notFound("套餐不存在");
        return plan;
    }

    public List<Map<String, Object>> getSubscriptionHistory(JwtUserDetails currentUser) {
        return dsl.select(
                        DSL.field("s.*"),
                        DSL.field("mp.name").as("plan_name"),
                        DSL.field("mp.price_monthly")
                )
                .from(DSL.table("institution_subscriptions").as("s"))
                .join(DSL.table("membership_plans").as("mp"))
                .on(DSL.field("s.plan_id").eq(DSL.field("mp.id")))
                .where(DSL.field("s.institution_id").eq(currentUser.getInstitutionId()))
                .orderBy(DSL.field("s.created_at").desc())
                .fetchMaps();
    }

    @Transactional
    public Map<String, Object> subscribe(JwtUserDetails currentUser, Integer planId, int months) {
        if (!"ADMIN".equals(currentUser.getRole())) {
            throw AppException.forbidden("只有管理员可以升级套餐");
        }

        Map<String, Object> plan = getPlanById(planId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiredAt = now.plusMonths(months);

        Long subscriptionId = dsl.insertInto(DSL.table("institution_subscriptions"))
                .set(DSL.field("institution_id"), currentUser.getInstitutionId())
                .set(DSL.field("plan_id"), planId)
                .set(DSL.field("started_at"), now)
                .set(DSL.field("expired_at"), expiredAt)
                .set(DSL.field("status"), "active")
                .set(DSL.field("created_at"), now)
                .returningResult(DSL.field("id", Long.class))
                .fetchOneInto(Long.class);

        // Update institution plan info
        int monthlyQuota = (Integer) plan.get("monthly_quota");
        dsl.update(DSL.table("institutions"))
                .set(DSL.field("plan_id"), planId)
                .set(DSL.field("quota_total"), monthlyQuota)
                .set(DSL.field("quota_used"), 0)
                .set(DSL.field("quota_reset_at"), now.plusMonths(1))
                .set(DSL.field("updated_at"), now)
                .where(DSL.field("id").eq(currentUser.getInstitutionId()))
                .execute();

        return dsl.select()
                .from(DSL.table("institution_subscriptions"))
                .where(DSL.field("id").eq(subscriptionId))
                .fetchOneMap();
    }
}
