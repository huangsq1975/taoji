package com.taoji.modules.appconfig;

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
public class AppConfigService {

    private final DSLContext dsl;

    public List<Map<String, Object>> listConfigs(JwtUserDetails currentUser) {
        if (!"ADMIN".equals(currentUser.getRole())) {
            throw AppException.forbidden("只有管理员可以查看平台配置");
        }
        return dsl.select()
                .from(DSL.table("platform_configs"))
                .orderBy(DSL.field("id").asc())
                .fetchMaps();
    }

    public Map<String, Object> getConfig(String key) {
        Map<String, Object> config = dsl.select()
                .from(DSL.table("platform_configs"))
                .where(DSL.field("config_key").eq(key))
                .fetchOneMap();
        if (config == null) throw AppException.notFound("配置项不存在: " + key);
        return config;
    }

    public String getConfigValue(String key, String defaultValue) {
        String val = dsl.select(DSL.field("config_val", String.class))
                .from(DSL.table("platform_configs"))
                .where(DSL.field("config_key").eq(key))
                .fetchOneInto(String.class);
        return val != null ? val : defaultValue;
    }

    @Transactional
    public Map<String, Object> upsertConfig(JwtUserDetails currentUser, String key,
                                             String value, String description) {
        if (!"ADMIN".equals(currentUser.getRole())) {
            throw AppException.forbidden("只有管理员可以修改平台配置");
        }

        int exists = dsl.selectCount()
                .from(DSL.table("platform_configs"))
                .where(DSL.field("config_key").eq(key))
                .fetchOneInto(Integer.class);

        if (exists != null && exists > 0) {
            dsl.update(DSL.table("platform_configs"))
                    .set(DSL.field("config_val"), value)
                    .set(DSL.field("updated_at"), LocalDateTime.now())
                    .where(DSL.field("config_key").eq(key))
                    .execute();
        } else {
            dsl.insertInto(DSL.table("platform_configs"))
                    .set(DSL.field("config_key"), key)
                    .set(DSL.field("config_val"), value)
                    .set(DSL.field("description"), description)
                    .set(DSL.field("updated_at"), LocalDateTime.now())
                    .execute();
        }

        return getConfig(key);
    }

    @Transactional
    public void deleteConfig(JwtUserDetails currentUser, String key) {
        if (!"ADMIN".equals(currentUser.getRole())) {
            throw AppException.forbidden("只有管理员可以删除平台配置");
        }
        int deleted = dsl.deleteFrom(DSL.table("platform_configs"))
                .where(DSL.field("config_key").eq(key))
                .execute();
        if (deleted == 0) throw AppException.notFound("配置项不存在: " + key);
    }

    public List<Map<String, Object>> listAiFillRules(JwtUserDetails currentUser) {
        return dsl.select()
                .from(DSL.table("ai_fill_rules"))
                .where(DSL.field("institution_id").eq(currentUser.getInstitutionId())
                        .or(DSL.field("institution_id").isNull()))
                .and(DSL.field("status").eq((short) 1))
                .orderBy(DSL.field("sort_order").asc())
                .fetchMaps();
    }

    @Transactional
    public Map<String, Object> upsertAiFillRule(JwtUserDetails currentUser, Map<String, Object> rule) {
        Integer ruleId = rule.get("id") != null ? (Integer) rule.get("id") : null;

        if (ruleId != null) {
            dsl.update(DSL.table("ai_fill_rules"))
                    .set(DSL.field("name"), rule.get("name"))
                    .set(DSL.field("scene"), rule.get("scene"))
                    .set(DSL.field("review_policy"), rule.get("reviewPolicy"))
                    .set(DSL.field("mapping_desc"), rule.get("mappingDesc"))
                    .set(DSL.field("updated_at"), LocalDateTime.now())
                    .where(DSL.field("id").eq(ruleId))
                    .execute();
        } else {
            ruleId = dsl.insertInto(DSL.table("ai_fill_rules"))
                    .set(DSL.field("institution_id"), currentUser.getInstitutionId())
                    .set(DSL.field("name"), rule.get("name"))
                    .set(DSL.field("scene"), rule.get("scene"))
                    .set(DSL.field("review_policy"), rule.getOrDefault("reviewPolicy", "advisor_confirm"))
                    .set(DSL.field("mapping_desc"), rule.get("mappingDesc"))
                    .set(DSL.field("created_by"), currentUser.getUserId())
                    .set(DSL.field("status"), (short) 1)
                    .set(DSL.field("sort_order"), rule.getOrDefault("sortOrder", 0))
                    .set(DSL.field("created_at"), LocalDateTime.now())
                    .set(DSL.field("updated_at"), LocalDateTime.now())
                    .returningResult(DSL.field("id", Integer.class))
                    .fetchOneInto(Integer.class);
        }

        return dsl.select()
                .from(DSL.table("ai_fill_rules"))
                .where(DSL.field("id").eq(ruleId))
                .fetchOneMap();
    }
}
