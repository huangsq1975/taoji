package com.taoji.modules.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoji.common.AppException;
import com.taoji.modules.auth.dto.ChangePasswordRequest;
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
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final DSLContext dsl;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

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

        // ── QR code scan flow: customer scanned advisor's invite QR code ──
        if (request.getAdvisorId() != null) {
            return wxLoginAsCustomer(openid, request.getAdvisorId());
        }

        // Try to find existing user by wx_openid
        Record userRecord = dsl.select()
                .from(DSL.table("users"))
                .where(DSL.field("wx_openid").eq(openid))
                .and(DSL.field("deleted_at").isNull())
                .and(DSL.field("status").eq((short) 1))
                .fetchOne();

        if (userRecord == null) {
            LoginResponse customerLogin = wxLoginExistingCustomer(openid);
            if (customerLogin != null) {
                return customerLogin;
            }
            // Try to match customer and auto-associate if customerId provided
            if (request.getCustomerId() != null) {
                // Update customer with wx_openid
                dsl.update(DSL.table("customers"))
                        .set(DSL.field("wx_openid"), openid)
                        .where(DSL.field("id").eq(request.getCustomerId()))
                        .execute();
            }
            // New user with no linked account and no advisor — return null so the
            // client can prompt the user to select an advisor from the list.
            log.info("New WeChat user (openid={}) has no account; prompting advisor selection", openid);
            return null;
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

    /**
     * Returning C-end customer login (no advisorId in request).
     * Returns null if no customer exists, or customer exists but has no advisor yet.
     */
    private LoginResponse wxLoginExistingCustomer(String openid) {
        Record existing = dsl.select(
                        DSL.field("id", Long.class),
                        DSL.field("institution_id", Long.class),
                        DSL.field("advisor_id", Long.class),
                        DSL.field("name", String.class))
                .from(DSL.table("customers"))
                .where(DSL.field("wx_openid").eq(openid))
                .and(DSL.field("deleted_at").isNull())
                .fetchOne();

        if (existing == null) {
            return null;
        }

        Long customerId = existing.get(DSL.field("id", Long.class));
        Long institutionId = existing.get(DSL.field("institution_id", Long.class));
        Long advisorId = existing.get(DSL.field("advisor_id", Long.class));
        String customerName = existing.get(DSL.field("name", String.class));

        if (advisorId == null) {
            log.info("Customer {} has no advisor yet; prompting advisor selection", customerId);
            return null;
        }

        String token = jwtUtil.generateToken(customerId, institutionId, "CUSTOMER", null, "SELF");
        log.info("Customer {} logged in with advisor {}", customerId, advisorId);
        return LoginResponse.builder()
                .token(token)
                .userId(customerId)
                .name(customerName)
                .role("CUSTOMER")
                .institutionId(institutionId)
                .advisorId(advisorId)
                .build();
    }

    /**
     * Customer scanned an advisor's invite QR code, or manually selected an advisor.
     * Find or create a customer record and return a CUSTOMER-role JWT.
     */
    private LoginResponse wxLoginAsCustomer(String openid, Long advisorId) {
        // Look up advisor to get institution
        Record advisorRecord = dsl.select(
                        DSL.field("institution_id", Long.class),
                        DSL.field("name", String.class))
                .from(DSL.table("users"))
                .where(DSL.field("id").eq(advisorId))
                .and(DSL.field("deleted_at").isNull())
                .and(DSL.field("status").eq((short) 1))
                .fetchOne();

        if (advisorRecord == null) {
            throw AppException.notFound("顾问不存在");
        }
        Long institutionId = advisorRecord.get(DSL.field("institution_id", Long.class));

        // Check if customer already exists with this openid
        Record existing = dsl.select(
                        DSL.field("id", Long.class),
                        DSL.field("advisor_id", Long.class),
                        DSL.field("name", String.class))
                .from(DSL.table("customers"))
                .where(DSL.field("wx_openid").eq(openid))
                .and(DSL.field("deleted_at").isNull())
                .fetchOne();

        Long customerId;
        String customerName;

        if (existing != null) {
            customerId = existing.get(DSL.field("id", Long.class));
            customerName = existing.get(DSL.field("name", String.class));
            Long existingAdvisorId = existing.get(DSL.field("advisor_id", Long.class));
            // Bind to this advisor if not yet assigned
            if (existingAdvisorId == null) {
                dsl.update(DSL.table("customers"))
                        .set(DSL.field("advisor_id"), advisorId)
                        .set(DSL.field("updated_at"), LocalDateTime.now())
                        .where(DSL.field("id").eq(customerId))
                        .execute();
                log.info("Existing customer {} bound to advisor {} via QR scan", customerId, advisorId);
            }
        } else {
            // Create new customer record
            customerId = dsl.insertInto(DSL.table("customers"))
                    .set(DSL.field("institution_id"), institutionId)
                    .set(DSL.field("advisor_id"), advisorId)
                    .set(DSL.field("wx_openid"), openid)
                    .set(DSL.field("name"), "微信用户")
                    .returning(DSL.field("id", Long.class))
                    .fetchOne(DSL.field("id", Long.class));
            customerName = "微信用户";
            log.info("New customer {} created under advisor {} via QR scan", customerId, advisorId);
        }

        String token = jwtUtil.generateToken(customerId, institutionId, "CUSTOMER", null, "SELF");
        return LoginResponse.builder()
                .token(token)
                .userId(customerId)
                .name(customerName)
                .role("CUSTOMER")
                .institutionId(institutionId)
                .advisorId(advisorId)
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

    public void changePassword(Long userId, ChangePasswordRequest request) {
        Record userRecord = dsl.select(DSL.field("password_hash", String.class))
                .from(DSL.table("users"))
                .where(DSL.field("id").eq(userId))
                .and(DSL.field("deleted_at").isNull())
                .fetchOne();

        if (userRecord == null) {
            throw AppException.notFound("用户不存在");
        }

        String storedHash = userRecord.get(DSL.field("password_hash", String.class));
        if (!passwordEncoder.matches(request.getOldPassword(), storedHash)) {
            throw AppException.badRequest("原密码错误");
        }

        dsl.update(DSL.table("users"))
                .set(DSL.field("password_hash"), passwordEncoder.encode(request.getNewPassword()))
                .where(DSL.field("id").eq(userId))
                .execute();
    }

    // ── WeChat access token cache ────────────────────────────────────────────────
    private final AtomicReference<String> cachedAccessToken = new AtomicReference<>();
    private volatile long accessTokenExpiry = 0;

    /**
     * Generate a WeChat mini program QR code (wxacode) for an advisor's invite link.
     * Scene parameter: "a={advisorId}" (≤32 chars).
     * Returns PNG bytes from WeChat API, or throws if credentials are not configured.
     */
    @SuppressWarnings("unchecked")
    public byte[] generateAdvisorInviteQrcode(Long advisorId) {
        if (wxAppId.isBlank() || wxAppSecret.isBlank()) {
            throw AppException.badRequest("微信凭证未配置，请联系管理员设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET");
        }
        String accessToken = getWxAccessToken();
        try {
            String scene = "a=" + advisorId;
            Map<String, Object> body = Map.of(
                    "scene", scene,
                    "page", "pages/index/index",
                    "check_path", false,
                    "env_version", "release"
            );
            byte[] png = webClientBuilder.build()
                    .post()
                    .uri("https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=" + accessToken)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .block();
            if (png == null || png.length == 0) {
                throw AppException.internalError("微信二维码生成失败：空响应");
            }
            // WeChat returns JSON on error (not PNG), detect by checking magic bytes
            if (png[0] == '{') {
                String errMsg = new String(png, java.nio.charset.StandardCharsets.UTF_8);
                log.error("WeChat QR code API error: {}", errMsg);
                throw AppException.internalError("微信二维码生成失败：" + errMsg);
            }
            return png;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to generate advisor invite QR code: {}", e.getMessage(), e);
            throw AppException.internalError("二维码生成失败，请稍后重试");
        }
    }

    private Map<String, Object> fetchWeChatJson(String url) throws Exception {
        String body = webClientBuilder.build()
                .get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        if (body == null || body.isBlank()) {
            return null;
        }
        return objectMapper.readValue(body, new TypeReference<>() {});
    }

    private String getWxAccessToken() {
        long now = System.currentTimeMillis();
        if (cachedAccessToken.get() != null && now < accessTokenExpiry) {
            return cachedAccessToken.get();
        }
        try {
            String url = String.format(
                    "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s",
                    wxAppId, wxAppSecret);
            Map<String, Object> result = fetchWeChatJson(url);
            if (result == null || result.containsKey("errcode")) {
                throw AppException.internalError("获取微信 access_token 失败：" + (result != null ? result.get("errmsg") : "无响应"));
            }
            String token = (String) result.get("access_token");
            int expiresIn = ((Number) result.get("expires_in")).intValue();
            cachedAccessToken.set(token);
            // Refresh 5 minutes early
            accessTokenExpiry = now + (expiresIn - 300) * 1000L;
            return token;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to get WeChat access token: {}", e.getMessage(), e);
            throw AppException.internalError("微信服务暂时不可用");
        }
    }

    private String fetchWxOpenid(String code) {
        if (wxAppId.isBlank() || wxAppSecret.isBlank()) {
            log.warn("WeChat credentials not configured, using code as mock openid for dev");
            return "mock_openid_" + code;
        }
        try {
            String url = String.format(
                    "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                    wxAppId, wxAppSecret, code);
            Map<String, Object> result = fetchWeChatJson(url);
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
