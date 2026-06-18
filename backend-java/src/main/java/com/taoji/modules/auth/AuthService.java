package com.taoji.modules.auth;

import com.taoji.common.AppException;
import com.taoji.modules.auth.dto.LoginRequest;
import com.taoji.modules.auth.dto.LoginResponse;
import com.taoji.modules.auth.dto.WxLoginRequest;
import com.taoji.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final DSLContext dsl;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final WebClient.Builder webClientBuilder;

    @Value("${wechat.app-id:}")
    private String wxAppId;

    @Value("${wechat.app-secret:}")
    private String wxAppSecret;

    public LoginResponse login(LoginRequest request) {
        // Find active user by phone
        Record userRecord = dsl.select()
                .from(DSL.table("users"))
                .where(DSL.field("phone").eq(request.getPhone()))
                .and(DSL.field("deleted_at").isNull())
                .and(DSL.field("status").eq((short) 1))
                .fetchOne();

        if (userRecord == null) {
            throw AppException.badRequest("手机号或密码错误");
        }

        String storedHash = userRecord.get(DSL.field("password_hash", String.class));
        if (!passwordEncoder.matches(request.getPassword(), storedHash)) {
            throw AppException.badRequest("手机号或密码错误");
        }

        Long userId = userRecord.get(DSL.field("id", Long.class));
        Long institutionId = userRecord.get(DSL.field("institution_id", Long.class));
        String role = userRecord.get(DSL.field("role", String.class));
        String phone = userRecord.get(DSL.field("phone", String.class));
        String dataScope = userRecord.get(DSL.field("data_scope", String.class));
        String name = userRecord.get(DSL.field("name", String.class));

        // Update last_login_at
        dsl.update(DSL.table("users"))
                .set(DSL.field("last_login_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(userId))
                .execute();

        // Get institution name
        String institutionName = dsl.select(DSL.field("name", String.class))
                .from(DSL.table("institutions"))
                .where(DSL.field("id").eq(institutionId))
                .fetchOneInto(String.class);

        String token = jwtUtil.generateToken(userId, institutionId, role, phone, dataScope);

        return LoginResponse.builder()
                .token(token)
                .userId(userId)
                .name(name)
                .role(role)
                .institutionId(institutionId)
                .institutionName(institutionName)
                .phone(phone)
                .dataScope(dataScope)
                .build();
    }

    public LoginResponse wxLogin(WxLoginRequest request) {
        // Exchange code for openid via WeChat API
        String openid = fetchWxOpenid(request.getCode());

        // Try to find existing user by wx_openid
        Record userRecord = dsl.select()
                .from(DSL.table("users"))
                .where(DSL.field("wx_openid").eq(openid))
                .and(DSL.field("deleted_at").isNull())
                .and(DSL.field("status").eq((short) 1))
                .fetchOne();

        if (userRecord == null) {
            // Try to match customer and auto-associate if customerId provided
            if (request.getCustomerId() != null) {
                // Update customer with wx_openid
                dsl.update(DSL.table("customers"))
                        .set(DSL.field("wx_openid"), openid)
                        .where(DSL.field("id").eq(request.getCustomerId()))
                        .execute();
            }
            // For C-end mini program, return a limited guest token
            throw AppException.notFound("未找到关联的用户账号，请联系您的贷款顾问");
        }

        Long userId = userRecord.get(DSL.field("id", Long.class));
        Long institutionId = userRecord.get(DSL.field("institution_id", Long.class));
        String role = userRecord.get(DSL.field("role", String.class));
        String phone = userRecord.get(DSL.field("phone", String.class));
        String dataScope = userRecord.get(DSL.field("data_scope", String.class));
        String name = userRecord.get(DSL.field("name", String.class));

        dsl.update(DSL.table("users"))
                .set(DSL.field("last_login_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(userId))
                .execute();

        String institutionName = dsl.select(DSL.field("name", String.class))
                .from(DSL.table("institutions"))
                .where(DSL.field("id").eq(institutionId))
                .fetchOneInto(String.class);

        String token = jwtUtil.generateToken(userId, institutionId, role, phone, dataScope);

        return LoginResponse.builder()
                .token(token)
                .userId(userId)
                .name(name)
                .role(role)
                .institutionId(institutionId)
                .institutionName(institutionName)
                .phone(phone)
                .dataScope(dataScope)
                .build();
    }

    public LoginResponse refresh(Long userId) {
        Record userRecord = dsl.select()
                .from(DSL.table("users"))
                .where(DSL.field("id").eq(userId))
                .and(DSL.field("deleted_at").isNull())
                .and(DSL.field("status").eq((short) 1))
                .fetchOne();

        if (userRecord == null) {
            throw AppException.notFound("用户不存在");
        }

        Long institutionId = userRecord.get(DSL.field("institution_id", Long.class));
        String role = userRecord.get(DSL.field("role", String.class));
        String phone = userRecord.get(DSL.field("phone", String.class));
        String dataScope = userRecord.get(DSL.field("data_scope", String.class));
        String name = userRecord.get(DSL.field("name", String.class));

        String institutionName = dsl.select(DSL.field("name", String.class))
                .from(DSL.table("institutions"))
                .where(DSL.field("id").eq(institutionId))
                .fetchOneInto(String.class);

        String token = jwtUtil.generateToken(userId, institutionId, role, phone, dataScope);

        return LoginResponse.builder()
                .token(token)
                .userId(userId)
                .name(name)
                .role(role)
                .institutionId(institutionId)
                .institutionName(institutionName)
                .phone(phone)
                .dataScope(dataScope)
                .build();
    }

    public Map<String, Object> getCurrentUser(Long userId) {
        Record userRecord = dsl.select(
                        DSL.field("u.id"),
                        DSL.field("u.name"),
                        DSL.field("u.phone"),
                        DSL.field("u.role"),
                        DSL.field("u.data_scope"),
                        DSL.field("u.institution_id"),
                        DSL.field("u.status"),
                        DSL.field("u.last_login_at"),
                        DSL.field("i.name").as("institution_name")
                )
                .from(DSL.table("users").as("u"))
                .join(DSL.table("institutions").as("i"))
                .on(DSL.field("u.institution_id").eq(DSL.field("i.id")))
                .where(DSL.field("u.id").eq(userId))
                .and(DSL.field("u.deleted_at").isNull())
                .fetchOne();

        if (userRecord == null) {
            throw AppException.notFound("用户不存在");
        }

        // Load permissions
        var permissions = dsl.select(DSL.field("permission", String.class))
                .from(DSL.table("user_permissions"))
                .where(DSL.field("user_id").eq(userId))
                .fetchInto(String.class);

        return Map.of(
                "id", userRecord.get(DSL.field("id", Long.class)),
                "name", userRecord.get(DSL.field("name", String.class)),
                "phone", userRecord.get(DSL.field("phone", String.class)),
                "role", userRecord.get(DSL.field("role", String.class)),
                "dataScope", userRecord.get(DSL.field("data_scope", String.class)),
                "institutionId", userRecord.get(DSL.field("institution_id", Long.class)),
                "institutionName", userRecord.get(DSL.field("institution_name", String.class)),
                "permissions", permissions
        );
    }

    @SuppressWarnings("unchecked")
    private String fetchWxOpenid(String code) {
        if (wxAppId.isBlank() || wxAppSecret.isBlank()) {
            log.warn("WeChat credentials not configured, using code as mock openid for dev");
            return "mock_openid_" + code;
        }
        try {
            String url = String.format(
                    "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                    wxAppId, wxAppSecret, code);
            Map<String, Object> result = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            if (result == null || result.containsKey("errcode")) {
                throw AppException.badRequest("微信登录失败：" + (result != null ? result.get("errmsg") : "无响应"));
            }
            return (String) result.get("openid");
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("WeChat login error: {}", e.getMessage(), e);
            throw AppException.internalError("微信服务暂时不可用");
        }
    }
}
