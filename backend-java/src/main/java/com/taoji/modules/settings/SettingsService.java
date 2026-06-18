package com.taoji.modules.settings;

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
