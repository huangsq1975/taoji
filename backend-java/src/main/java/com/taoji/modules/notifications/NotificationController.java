package com.taoji.modules.notifications;

import com.taoji.common.ApiResponse;
import com.taoji.common.AppException;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/c/notifications")
@RequiredArgsConstructor
@Tag(name = "客户通知接口", description = "C端客户通知列表与已读标记")
public class NotificationController {

    private final DSLContext dsl;

    private static final DateTimeFormatter DISPLAY_FMT = DateTimeFormatter.ofPattern("MM-dd HH:mm");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @GetMapping
    @Operation(summary = "获取通知列表", description = "基于顾问跟进记录派生，返回近7天通知，附带已读状态")
    public ApiResponse<List<Map<String, Object>>> listNotifications(
            @CurrentUser JwtUserDetails currentUser) {
        if (currentUser == null) {
            throw AppException.unauthorized("请先登录");
        }
        Long customerId = currentUser.getUserId();
        LocalDateTime since = LocalDateTime.now().minusDays(7);

        // Fetch follow_up_records for this customer within last 7 days
        var records = dsl.select(
                        DSL.field("f.id", Long.class),
                        DSL.field("f.type", String.class),
                        DSL.field("f.content", String.class),
                        DSL.field("f.created_at", LocalDateTime.class),
                        DSL.field("u.name", String.class).as("advisor_name")
                )
                .from(DSL.table("follow_up_records").as("f"))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("f.advisor_id").eq(DSL.field("u.id")))
                .where(DSL.field("f.customer_id").eq(customerId))
                .and(DSL.field("f.created_at").greaterOrEqual(since))
                .orderBy(DSL.field("f.created_at").desc())
                .limit(30)
                .fetch();

        // Fetch already-read source IDs for this customer
        Set<Long> readIds = dsl.select(DSL.field("source_id", Long.class))
                .from(DSL.table("customer_notification_reads"))
                .where(DSL.field("customer_id").eq(customerId))
                .fetchSet(DSL.field("source_id", Long.class));

        List<Map<String, Object>> notifications = new ArrayList<>();
        for (var r : records) {
            Long id = r.get(0, Long.class);
            String type = r.get(1, String.class);
            String content = r.get(2, String.class);
            LocalDateTime createdAt = r.get(3, LocalDateTime.class);
            String advisorName = r.get(4, String.class);
            if (advisorName == null) advisorName = "顾问";

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", id);
            item.put("title", buildTitle(type, advisorName));
            item.put("body", content);
            item.put("time", formatTime(createdAt));
            item.put("dotColor", dotColor(type));
            item.put("read", readIds.contains(id));
            notifications.add(item);
        }
        return ApiResponse.ok(notifications);
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "标记通知为已读")
    public ApiResponse<Void> markRead(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long id) {
        if (currentUser == null) {
            throw AppException.unauthorized("请先登录");
        }
        Long customerId = currentUser.getUserId();
        dsl.insertInto(DSL.table("customer_notification_reads"))
                .columns(DSL.field("customer_id"), DSL.field("source_id"), DSL.field("read_at"))
                .values(customerId, id, LocalDateTime.now())
                .onConflictDoNothing()
                .execute();
        return ApiResponse.ok();
    }

    private String buildTitle(String type, String advisorName) {
        return switch (type) {
            case "SUPPLEMENT_REQUEST" -> "请补充材料";
            case "NOTE"              -> advisorName + " 留言";
            case "BANK_SUBMIT"       -> "材料已提交银行";
            case "BANK_FEEDBACK"     -> "银行反馈通知";
            case "SYSTEM"            -> "系统通知";
            default                  -> "顾问通知";
        };
    }

    private String dotColor(String type) {
        return switch (type) {
            case "SUPPLEMENT_REQUEST" -> "orange";
            case "BANK_FEEDBACK"      -> "green";
            case "BANK_SUBMIT"        -> "green";
            default                   -> "blue";
        };
    }

    private String formatTime(LocalDateTime dt) {
        if (dt == null) return "";
        LocalDateTime now = LocalDateTime.now();
        long hours = ChronoUnit.HOURS.between(dt, now);
        if (hours < 1) {
            long mins = ChronoUnit.MINUTES.between(dt, now);
            return mins <= 0 ? "刚刚" : mins + "分钟前";
        }
        if (hours < 24) return hours + "小时前";
        long days = ChronoUnit.DAYS.between(dt.toLocalDate(), now.toLocalDate());
        if (days == 1) return "昨天 " + dt.format(DateTimeFormatter.ofPattern("HH:mm"));
        if (days == 2) return "前天 " + dt.format(DateTimeFormatter.ofPattern("HH:mm"));
        return dt.format(DATE_FMT);
    }
}
