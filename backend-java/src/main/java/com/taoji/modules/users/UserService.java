package com.taoji.modules.users;

import com.taoji.common.AppException;
import com.taoji.common.PageRequest;
import com.taoji.common.PaginatedResult;
import com.taoji.modules.users.dto.CreateMemberRequest;
import com.taoji.modules.users.dto.MemberResponse;
import com.taoji.modules.users.dto.UpdatePermissionsRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final DSLContext dsl;
    private final PasswordEncoder passwordEncoder;

    public PaginatedResult<MemberResponse> listMembers(Long institutionId, String keyword, PageRequest pageRequest) {
        var baseCondition = DSL.field("institution_id").eq(institutionId)
                .and(DSL.field("deleted_at").isNull());

        if (keyword != null && !keyword.isBlank()) {
            baseCondition = baseCondition.and(
                    DSL.field("name").likeIgnoreCase("%" + keyword + "%")
                            .or(DSL.field("phone").like("%" + keyword + "%"))
            );
        }

        Integer total = dsl.selectCount()
                .from(DSL.table("users"))
                .where(baseCondition)
                .fetchOneInto(Integer.class);

        List<Record> records = dsl.select()
                .from(DSL.table("users"))
                .where(baseCondition)
                .orderBy(DSL.field("created_at").desc())
                .limit(pageRequest.getPageSize())
                .offset(pageRequest.offset())
                .fetch();

        List<MemberResponse> members = records.stream().map(r -> {
            Long userId = r.get(DSL.field("id", Long.class));
            List<String> permissions = loadPermissions(userId);
            return mapToMemberResponse(r, permissions);
        }).toList();

        return PaginatedResult.of(members, total == null ? 0 : total, pageRequest);
    }

    @Transactional
    public MemberResponse createMember(Long institutionId, CreateMemberRequest request) {
        // Check phone uniqueness
        int exists = dsl.selectCount()
                .from(DSL.table("users"))
                .where(DSL.field("phone").eq(request.getPhone()))
                .and(DSL.field("deleted_at").isNull())
                .fetchOneInto(Integer.class);
        if (exists > 0) {
            throw AppException.badRequest("该手机号已被注册");
        }

        // Check plan advisor limit
        checkAdvisorLimit(institutionId);

        String passwordHash = passwordEncoder.encode(request.getPassword());

        Long userId = dsl.insertInto(DSL.table("users"))
                .set(DSL.field("institution_id"), institutionId)
                .set(DSL.field("name"), request.getName())
                .set(DSL.field("phone"), request.getPhone())
                .set(DSL.field("password_hash"), passwordHash)
                .set(DSL.field("role"), DSL.field("?::user_role", Object.class, request.getRole()))
                .set(DSL.field("data_scope"), DSL.field("?::data_scope", Object.class, request.getDataScope()))
                .set(DSL.field("status"), (short) 1)
                .set(DSL.field("created_at"), LocalDateTime.now())
                .set(DSL.field("updated_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Long.class))
                .fetchOneInto(Long.class);

        if (userId == null) {
            throw AppException.internalError("创建用户失败");
        }

        // Save permissions
        if (request.getPermissions() != null && !request.getPermissions().isEmpty()) {
            savePermissions(userId, request.getPermissions());
        }

        return getMemberById(institutionId, userId);
    }

    @Transactional
    public MemberResponse updatePermissions(Long institutionId, Long memberId, UpdatePermissionsRequest request) {
        Record userRecord = dsl.select()
                .from(DSL.table("users"))
                .where(DSL.field("id").eq(memberId))
                .and(DSL.field("institution_id").eq(institutionId))
                .and(DSL.field("deleted_at").isNull())
                .fetchOne();

        if (userRecord == null) {
            throw AppException.notFound("用户不存在");
        }

        // Update role and dataScope if provided
        var update = dsl.update(DSL.table("users"))
                .set(DSL.field("updated_at"), LocalDateTime.now());

        if (request.getRole() != null) {
            dsl.update(DSL.table("users"))
                    .set(DSL.field("role"), DSL.field("?::user_role", Object.class, request.getRole()))
                    .set(DSL.field("updated_at"), LocalDateTime.now())
                    .where(DSL.field("id").eq(memberId))
                    .execute();
        }
        if (request.getDataScope() != null) {
            dsl.update(DSL.table("users"))
                    .set(DSL.field("data_scope"), DSL.field("?::data_scope", Object.class, request.getDataScope()))
                    .set(DSL.field("updated_at"), LocalDateTime.now())
                    .where(DSL.field("id").eq(memberId))
                    .execute();
        }

        // Replace permissions
        dsl.deleteFrom(DSL.table("user_permissions"))
                .where(DSL.field("user_id").eq(memberId))
                .execute();

        savePermissions(memberId, request.getPermissions());

        return getMemberById(institutionId, memberId);
    }

    @Transactional
    public MemberResponse updateStatus(Long institutionId, Long memberId, int status) {
        int updated = dsl.update(DSL.table("users"))
                .set(DSL.field("status"), (short) status)
                .set(DSL.field("updated_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(memberId))
                .and(DSL.field("institution_id").eq(institutionId))
                .and(DSL.field("deleted_at").isNull())
                .execute();

        if (updated == 0) {
            throw AppException.notFound("用户不存在");
        }
        return getMemberById(institutionId, memberId);
    }

    public MemberResponse getMemberById(Long institutionId, Long memberId) {
        Record r = dsl.select()
                .from(DSL.table("users"))
                .where(DSL.field("id").eq(memberId))
                .and(DSL.field("institution_id").eq(institutionId))
                .and(DSL.field("deleted_at").isNull())
                .fetchOne();

        if (r == null) {
            throw AppException.notFound("用户不存在");
        }

        List<String> permissions = loadPermissions(memberId);
        return mapToMemberResponse(r, permissions);
    }

    public List<MemberResponse> listAllMembers(Long institutionId) {
        List<Record> records = dsl.select()
                .from(DSL.table("users"))
                .where(DSL.field("institution_id").eq(institutionId))
                .and(DSL.field("deleted_at").isNull())
                .orderBy(DSL.field("created_at").desc())
                .fetch();

        return records.stream().map(r -> {
            Long userId = r.get(DSL.field("id", Long.class));
            List<String> permissions = loadPermissions(userId);
            return mapToMemberResponse(r, permissions);
        }).toList();
    }

    @Transactional
    public MemberResponse toggleMember(Long institutionId, Long memberId) {
        Record userRecord = dsl.select()
                .from(DSL.table("users"))
                .where(DSL.field("id").eq(memberId))
                .and(DSL.field("institution_id").eq(institutionId))
                .and(DSL.field("deleted_at").isNull())
                .fetchOne();

        if (userRecord == null) {
            throw AppException.notFound("用户不存在");
        }

        Short currentStatus = userRecord.get(DSL.field("status", Short.class));
        short newStatus = Short.valueOf((short)1).equals(currentStatus) ? (short) 0 : (short) 1;

        dsl.update(DSL.table("users"))
                .set(DSL.field("status"), newStatus)
                .set(DSL.field("updated_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(memberId))
                .execute();

        return getMemberById(institutionId, memberId);
    }

    private void savePermissions(Long userId, List<String> permissions) {
        for (String perm : permissions) {
            dsl.insertInto(DSL.table("user_permissions"))
                    .set(DSL.field("user_id"), userId)
                    .set(DSL.field("permission"), perm)
                    .onConflictDoNothing()
                    .execute();
        }
    }

    private List<String> loadPermissions(Long userId) {
        return dsl.select(DSL.field("permission", String.class))
                .from(DSL.table("user_permissions"))
                .where(DSL.field("user_id").eq(userId))
                .fetchInto(String.class);
    }

    private void checkAdvisorLimit(Long institutionId) {
        // Get plan max_advisors for this institution
        Record planRecord = dsl.select(DSL.field("mp.max_advisors", Integer.class))
                .from(DSL.table("institutions").as("i"))
                .join(DSL.table("membership_plans").as("mp"))
                .on(DSL.field("i.plan_id").eq(DSL.field("mp.id")))
                .where(DSL.field("i.id").eq(institutionId))
                .fetchOne();

        if (planRecord == null) return;

        int maxAdvisors = planRecord.get(DSL.field("mp.max_advisors", Integer.class));
        if (maxAdvisors == -1) return; // Unlimited

        Integer currentCount = dsl.selectCount()
                .from(DSL.table("users"))
                .where(DSL.field("institution_id").eq(institutionId))
                .and(DSL.field("deleted_at").isNull())
                .and(DSL.field("status").eq((short) 1))
                .fetchOneInto(Integer.class);

        if (currentCount != null && currentCount >= maxAdvisors) {
            throw AppException.badRequest("已达到当前套餐的最大用户数限制(" + maxAdvisors + "人)，请升级套餐");
        }
    }

    private MemberResponse mapToMemberResponse(Record r, List<String> permissions) {
        return MemberResponse.builder()
                .id(r.get(DSL.field("id", Long.class)))
                .institutionId(r.get(DSL.field("institution_id", Long.class)))
                .name(r.get(DSL.field("name", String.class)))
                .phone(r.get(DSL.field("phone", String.class)))
                .role(r.get(DSL.field("role", String.class)))
                .dataScope(r.get(DSL.field("data_scope", String.class)))
                .status(Short.valueOf((short)1).equals(r.get(DSL.field("status", Short.class))) ? "ACTIVE" : "INACTIVE")
                .lastLoginAt(toLocalDateTime(r.get("last_login_at")))
                .createdAt(toLocalDateTime(r.get("created_at")))
                .permissions(permissions)
                .build();
    }

    private static LocalDateTime toLocalDateTime(Object val) {
        if (val == null) return null;
        if (val instanceof LocalDateTime ldt) return ldt;
        if (val instanceof java.sql.Timestamp ts) return ts.toLocalDateTime();
        return null;
    }
}
