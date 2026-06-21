package com.taoji.modules.advisor;

import com.taoji.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Public (no-auth) endpoints for the C-end mini-program.
 * Mounted under /c/** which is whitelisted in SecurityConfig.
 */
@RestController
@RequestMapping("/c")
@RequiredArgsConstructor
@Tag(name = "客户端公开接口", description = "C端小程序无需登录的公开接口")
public class AdvisorsPublicController {

    private final DSLContext dsl;

    @GetMapping("/advisors")
    @Operation(
            summary = "顾问列表",
            description = "返回平台所有在职顾问，供新客户未绑定顾问时选择"
    )
    public ApiResponse<List<Map<String, Object>>> listAdvisors() {
        List<Map<String, Object>> advisors = dsl
                .select(
                        DSL.field("u.id").as("id"),
                        DSL.field("u.name").as("name"),
                        DSL.field("u.role").as("role"),
                        DSL.field("i.name").as("institutionName"))
                .from(DSL.table("users").as("u"))
                .join(DSL.table("institutions").as("i"))
                .on(DSL.field("u.institution_id").eq(DSL.field("i.id")))
                .where(DSL.field("u.role").in("ADVISOR", "SUPERVISOR"))
                .and(DSL.field("u.status").eq((short) 1))
                .and(DSL.field("u.deleted_at").isNull())
                .orderBy(DSL.field("u.name").asc())
                .fetchMaps();

        return ApiResponse.ok(advisors);
    }
}
