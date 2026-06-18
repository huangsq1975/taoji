package com.taoji.modules.reports;

import com.taoji.common.AppException;
import com.taoji.common.PageRequest;
import com.taoji.common.PaginatedResult;
import com.taoji.modules.reports.dto.CreateReportTaskRequest;
import com.taoji.modules.reports.dto.ReviewFieldRequest;
import com.taoji.security.JwtUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.compress.archivers.zip.ZipArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveOutputStream;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final DSLContext dsl;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Value("${upload.url-prefix:http://localhost:3000/uploads}")
    private String urlPrefix;

    public PaginatedResult<Map<String, Object>> listReportTasks(JwtUserDetails currentUser,
                                                                  Long customerId,
                                                                  String status,
                                                                  PageRequest pageRequest) {
        var condition = DSL.field("rt.institution_id").eq(currentUser.getInstitutionId());
        if (customerId != null) condition = condition.and(DSL.field("rt.customer_id").eq(customerId));
        if (status != null && !status.isBlank()) condition = condition.and(DSL.field("rt.status").eq(status));

        Integer total = dsl.selectCount()
                .from(DSL.table("report_tasks").as("rt"))
                .where(condition)
                .fetchOneInto(Integer.class);

        List<Map<String, Object>> tasks = dsl.select(
                        DSL.field("rt.*"),
                        DSL.field("c.name").as("customer_name"),
                        DSL.field("bp.name").as("product_name"),
                        DSL.field("b.short_name").as("bank_short_name"),
                        DSL.field("u.name").as("advisor_name")
                )
                .from(DSL.table("report_tasks").as("rt"))
                .join(DSL.table("customers").as("c")).on(DSL.field("rt.customer_id").eq(DSL.field("c.id")))
                .join(DSL.table("bank_products").as("bp")).on(DSL.field("rt.product_id").eq(DSL.field("bp.id")))
                .join(DSL.table("banks").as("b")).on(DSL.field("bp.bank_id").eq(DSL.field("b.id")))
                .leftJoin(DSL.table("users").as("u")).on(DSL.field("rt.advisor_id").eq(DSL.field("u.id")))
                .where(condition)
                .orderBy(DSL.field("rt.created_at").desc())
                .limit(pageRequest.getPageSize())
                .offset(pageRequest.offset())
                .fetchMaps();

        return PaginatedResult.of(tasks, total == null ? 0 : total, pageRequest);
    }

    @Transactional
    public Map<String, Object> createReportTask(JwtUserDetails currentUser, CreateReportTaskRequest request) {
        // Verify customer access
        Integer custExists = dsl.selectCount()
                .from(DSL.table("customers"))
                .where(DSL.field("id").eq(request.getCustomerId()))
                .and(DSL.field("institution_id").eq(currentUser.getInstitutionId()))
                .and(DSL.field("deleted_at").isNull())
                .fetchOneInto(Integer.class);
        if (custExists == null || custExists == 0) {
            throw AppException.notFound("客户不存在");
        }

        Long taskId = dsl.insertInto(DSL.table("report_tasks"))
                .set(DSL.field("institution_id"), currentUser.getInstitutionId())
                .set(DSL.field("customer_id"), request.getCustomerId())
                .set(DSL.field("advisor_id"), currentUser.getUserId())
                .set(DSL.field("product_id"), request.getProductId())
                .set(DSL.field("status"), "PENDING")
                .set(DSL.field("issue_count"), 0)
                .set(DSL.field("created_at"), LocalDateTime.now())
                .set(DSL.field("updated_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Long.class))
                .fetchOneInto(Long.class);

        return getReportTask(currentUser, taskId);
    }

    public Map<String, Object> getReportTask(JwtUserDetails currentUser, Long taskId) {
        Map<String, Object> task = dsl.select(
                        DSL.field("rt.*"),
                        DSL.field("c.name").as("customer_name"),
                        DSL.field("bp.name").as("product_name"),
                        DSL.field("b.short_name").as("bank_short_name")
                )
                .from(DSL.table("report_tasks").as("rt"))
                .join(DSL.table("customers").as("c")).on(DSL.field("rt.customer_id").eq(DSL.field("c.id")))
                .join(DSL.table("bank_products").as("bp")).on(DSL.field("rt.product_id").eq(DSL.field("bp.id")))
                .join(DSL.table("banks").as("b")).on(DSL.field("bp.bank_id").eq(DSL.field("b.id")))
                .where(DSL.field("rt.id").eq(taskId))
                .and(DSL.field("rt.institution_id").eq(currentUser.getInstitutionId()))
                .fetchOneMap();

        if (task == null) throw AppException.notFound("报告任务不存在");
        return task;
    }

    public List<Map<String, Object>> getReportFieldDrafts(JwtUserDetails currentUser, Long taskId) {
        // Verify task access
        getReportTask(currentUser, taskId);
        return dsl.select()
                .from(DSL.table("report_field_drafts"))
                .where(DSL.field("task_id").eq(taskId))
                .orderBy(DSL.field("field_key").asc())
                .fetchMaps();
    }

    @Transactional
    public Map<String, Object> reviewField(JwtUserDetails currentUser, Long taskId, ReviewFieldRequest request) {
        getReportTask(currentUser, taskId); // verify access

        Record field = dsl.select()
                .from(DSL.table("report_field_drafts"))
                .where(DSL.field("id").eq(request.getFieldId()))
                .and(DSL.field("task_id").eq(taskId))
                .fetchOne();

        if (field == null) throw AppException.notFound("字段不存在");

        String finalValue = "corrected".equals(request.getReviewStatus())
                ? request.getFinalValue()
                : field.get(DSL.field("ai_value", String.class));

        dsl.update(DSL.table("report_field_drafts"))
                .set(DSL.field("review_status"), request.getReviewStatus())
                .set(DSL.field("final_value"), finalValue)
                .set(DSL.field("reviewed_by"), currentUser.getUserId())
                .set(DSL.field("reviewed_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(request.getFieldId()))
                .execute();

        // Count remaining issues
        Integer issueCount = dsl.selectCount()
                .from(DSL.table("report_field_drafts"))
                .where(DSL.field("task_id").eq(taskId))
                .and(DSL.field("review_status").eq("pending"))
                .and(DSL.field("ai_status").notEqual("ok"))
                .fetchOneInto(Integer.class);

        dsl.update(DSL.table("report_tasks"))
                .set(DSL.field("issue_count"), issueCount != null ? issueCount : 0)
                .set(DSL.field("updated_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(taskId))
                .execute();

        return dsl.select()
                .from(DSL.table("report_field_drafts"))
                .where(DSL.field("id").eq(request.getFieldId()))
                .fetchOneMap();
    }

    @Transactional
    public Map<String, Object> exportReport(JwtUserDetails currentUser, Long taskId) {
        Map<String, Object> task = getReportTask(currentUser, taskId);

        // Update status to EXPORTING
        dsl.update(DSL.table("report_tasks"))
                .set(DSL.field("status"), "EXPORTING")
                .set(DSL.field("updated_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(taskId))
                .execute();

        // Get all field drafts
        List<Map<String, Object>> fields = dsl.select()
                .from(DSL.table("report_field_drafts"))
                .where(DSL.field("task_id").eq(taskId))
                .orderBy(DSL.field("field_key"))
                .fetchMaps();

        // Create a simple CSV/text report and ZIP it
        String exportUrl = createZipExport(currentUser.getInstitutionId(), taskId, task, fields);

        dsl.update(DSL.table("report_tasks"))
                .set(DSL.field("status"), "EXPORTED")
                .set(DSL.field("export_url"), exportUrl)
                .set(DSL.field("exported_at"), LocalDateTime.now())
                .set(DSL.field("updated_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(taskId))
                .execute();

        // Record call usage
        dsl.insertInto(DSL.table("call_records"))
                .set(DSL.field("institution_id"), currentUser.getInstitutionId())
                .set(DSL.field("user_id"), currentUser.getUserId())
                .set(DSL.field("task_id"), taskId)
                .set(DSL.field("call_type"), "DOC_EXPORT")
                .set(DSL.field("quota_cost"), 1)
                .set(DSL.field("status"), "success")
                .set(DSL.field("created_at"), LocalDateTime.now())
                .execute();

        return getReportTask(currentUser, taskId);
    }

    private String createZipExport(Long institutionId, Long taskId,
                                    Map<String, Object> task, List<Map<String, Object>> fields) {
        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        Path dirPath = Paths.get(uploadDir, String.valueOf(institutionId), "reports", datePath);

        try {
            Files.createDirectories(dirPath);
            String zipName = "report_" + taskId + "_" + UUID.randomUUID().toString().substring(0, 8) + ".zip";
            Path zipPath = dirPath.resolve(zipName);

            try (ZipArchiveOutputStream zos = new ZipArchiveOutputStream(new FileOutputStream(zipPath.toFile()))) {
                // Create report CSV
                StringBuilder csv = new StringBuilder("字段名,AI填写值,最终值,AI状态,审核状态\n");
                for (Map<String, Object> field : fields) {
                    csv.append(csvEscape(String.valueOf(field.getOrDefault("field_label", ""))))
                            .append(",")
                            .append(csvEscape(String.valueOf(field.getOrDefault("ai_value", ""))))
                            .append(",")
                            .append(csvEscape(String.valueOf(field.getOrDefault("final_value", ""))))
                            .append(",")
                            .append(csvEscape(String.valueOf(field.getOrDefault("ai_status", ""))))
                            .append(",")
                            .append(csvEscape(String.valueOf(field.getOrDefault("review_status", ""))))
                            .append("\n");
                }

                byte[] csvBytes = csv.toString().getBytes(StandardCharsets.UTF_8);
                ZipArchiveEntry entry = new ZipArchiveEntry("report_fields.csv");
                entry.setSize(csvBytes.length);
                zos.putArchiveEntry(entry);
                zos.write(csvBytes);
                zos.closeArchiveEntry();
            }

            String relPath = "/" + institutionId + "/reports/" + datePath + "/" + zipName;
            return urlPrefix + relPath;

        } catch (IOException e) {
            log.error("Failed to create ZIP export: {}", e.getMessage(), e);
            throw AppException.internalError("导出文件创建失败");
        }
    }

    private String csvEscape(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
