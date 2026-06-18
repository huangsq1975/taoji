package com.taoji.modules.customers;

import com.taoji.common.AppException;
import com.taoji.common.PageRequest;
import com.taoji.common.PaginatedResult;
import com.taoji.modules.customers.dto.*;
import com.taoji.security.JwtUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final DSLContext dsl;

    public PaginatedResult<CustomerResponse> listCustomers(JwtUserDetails currentUser,
                                                            String keyword,
                                                            String status,
                                                            PageRequest pageRequest) {
        Condition condition = buildAccessCondition(currentUser);
        condition = condition.and(DSL.field("c.deleted_at").isNull());

        if (keyword != null && !keyword.isBlank()) {
            condition = condition.and(
                    DSL.field("c.name").likeIgnoreCase("%" + keyword + "%")
                            .or(DSL.field("c.contact_phone").like("%" + keyword + "%"))
            );
        }
        if (status != null && !status.isBlank()) {
            condition = condition.and(DSL.field("c.status").eq(status));
        }

        int total = dsl.selectCount()
                .from(DSL.table("customers").as("c"))
                .where(condition)
                .fetchOneInto(Integer.class);

        List<Record> records = dsl.select(
                        DSL.field("c.*"),
                        DSL.field("u.name").as("advisor_name")
                )
                .from(DSL.table("customers").as("c"))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("c.advisor_id").eq(DSL.field("u.id")))
                .where(condition)
                .orderBy(DSL.field("c.updated_at").desc())
                .limit(pageRequest.getPageSize())
                .offset(pageRequest.offset())
                .fetch();

        List<CustomerResponse> customers = records.stream()
                .map(r -> mapToCustomerResponse(r, loadLabels(r.get(DSL.field("c.id", Long.class)))))
                .toList();

        return PaginatedResult.of(customers, total == null ? 0 : total, pageRequest);
    }

    @Transactional
    public CustomerResponse createCustomer(JwtUserDetails currentUser, CreateCustomerRequest request) {
        Long advisorId = request.getAdvisorId() != null ? request.getAdvisorId() : currentUser.getUserId();

        Long customerId = dsl.insertInto(DSL.table("customers"))
                .set(DSL.field("institution_id"), currentUser.getInstitutionId())
                .set(DSL.field("advisor_id"), advisorId)
                .set(DSL.field("name"), request.getName())
                .set(DSL.field("contact_name"), request.getContactName())
                .set(DSL.field("contact_phone"), request.getContactPhone())
                .set(DSL.field("financing_need"), request.getFinancingNeed())
                .set(DSL.field("loan_purpose"), request.getLoanPurpose())
                .set(DSL.field("loan_amount"), request.getLoanAmount())
                .set(DSL.field("status"), "COLLECTING")
                .set(DSL.field("doc_completeness"), (short) 0)
                .set(DSL.field("created_at"), LocalDateTime.now())
                .set(DSL.field("updated_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Long.class))
                .fetchOneInto(Long.class);

        if (customerId == null) {
            throw AppException.internalError("创建客户失败");
        }
        return getCustomerById(currentUser, customerId);
    }

    public CustomerResponse getCustomerById(JwtUserDetails currentUser, Long customerId) {
        Condition condition = buildAccessCondition(currentUser);
        condition = condition.and(DSL.field("c.id").eq(customerId))
                .and(DSL.field("c.deleted_at").isNull());

        Record r = dsl.select(
                        DSL.field("c.*"),
                        DSL.field("u.name").as("advisor_name")
                )
                .from(DSL.table("customers").as("c"))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("c.advisor_id").eq(DSL.field("u.id")))
                .where(condition)
                .fetchOne();

        if (r == null) {
            throw AppException.notFound("客户不存在或无访问权限");
        }

        return mapToCustomerResponse(r, loadLabels(customerId));
    }

    @Transactional
    public CustomerResponse updateCustomer(JwtUserDetails currentUser, Long customerId,
                                           UpdateCustomerRequest request) {
        ensureAccess(currentUser, customerId);

        var update = dsl.update(DSL.table("customers"))
                .set(DSL.field("updated_at"), LocalDateTime.now());

        if (request.getName() != null) update = update.set(DSL.field("name"), request.getName());
        if (request.getContactName() != null) update = update.set(DSL.field("contact_name"), request.getContactName());
        if (request.getContactPhone() != null) update = update.set(DSL.field("contact_phone"), request.getContactPhone());
        if (request.getFinancingNeed() != null) update = update.set(DSL.field("financing_need"), request.getFinancingNeed());
        if (request.getLoanPurpose() != null) update = update.set(DSL.field("loan_purpose"), request.getLoanPurpose());
        if (request.getLoanAmount() != null) update = update.set(DSL.field("loan_amount"), request.getLoanAmount());
        if (request.getStatus() != null) update = update.set(DSL.field("status"), request.getStatus());
        if (request.getAiSummary() != null) update = update.set(DSL.field("ai_summary"), request.getAiSummary());
        if (request.getRiskNotes() != null) update = update.set(DSL.field("risk_notes"), request.getRiskNotes());

        update.where(DSL.field("id").eq(customerId)).execute();

        // Update labels
        if (request.getLabels() != null) {
            dsl.deleteFrom(DSL.table("customer_labels"))
                    .where(DSL.field("customer_id").eq(customerId))
                    .execute();
            for (String label : request.getLabels()) {
                dsl.insertInto(DSL.table("customer_labels"))
                        .set(DSL.field("customer_id"), customerId)
                        .set(DSL.field("label"), label)
                        .set(DSL.field("label_type"), "manual")
                        .execute();
            }
        }

        return getCustomerById(currentUser, customerId);
    }

    @Transactional
    public void deleteCustomer(JwtUserDetails currentUser, Long customerId) {
        ensureAccess(currentUser, customerId);
        dsl.update(DSL.table("customers"))
                .set(DSL.field("deleted_at"), LocalDateTime.now())
                .where(DSL.field("id").eq(customerId))
                .execute();
    }

    public List<Map<String, Object>> getFollowUps(JwtUserDetails currentUser, Long customerId) {
        ensureAccess(currentUser, customerId);
        return dsl.select(
                        DSL.field("f.id"),
                        DSL.field("f.type"),
                        DSL.field("f.content"),
                        DSL.field("f.created_at"),
                        DSL.field("u.name").as("advisor_name")
                )
                .from(DSL.table("follow_up_records").as("f"))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("f.advisor_id").eq(DSL.field("u.id")))
                .where(DSL.field("f.customer_id").eq(customerId))
                .orderBy(DSL.field("f.created_at").desc())
                .fetchMaps();
    }

    @Transactional
    public Map<String, Object> addFollowUp(JwtUserDetails currentUser, Long customerId,
                                           AddFollowUpRequest request) {
        ensureAccess(currentUser, customerId);

        Long followUpId = dsl.insertInto(DSL.table("follow_up_records"))
                .set(DSL.field("customer_id"), customerId)
                .set(DSL.field("advisor_id"), currentUser.getUserId())
                .set(DSL.field("type"), request.getType())
                .set(DSL.field("content"), request.getContent())
                .set(DSL.field("created_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Long.class))
                .fetchOneInto(Long.class);

        return dsl.select(
                        DSL.field("f.id"),
                        DSL.field("f.type"),
                        DSL.field("f.content"),
                        DSL.field("f.created_at"),
                        DSL.field("u.name").as("advisor_name")
                )
                .from(DSL.table("follow_up_records").as("f"))
                .leftJoin(DSL.table("users").as("u"))
                .on(DSL.field("f.advisor_id").eq(DSL.field("u.id")))
                .where(DSL.field("f.id").eq(followUpId))
                .fetchOneMap();
    }

    public Map<String, Object> getCustomerOverview(JwtUserDetails currentUser, Long customerId) {
        CustomerResponse customer = getCustomerById(currentUser, customerId);

        // Count documents
        int docCount = dsl.selectCount()
                .from(DSL.table("customer_documents"))
                .where(DSL.field("customer_id").eq(customerId))
                .and(DSL.field("deleted_at").isNull())
                .fetchOneInto(Integer.class);

        // Count follow-ups
        int followUpCount = dsl.selectCount()
                .from(DSL.table("follow_up_records"))
                .where(DSL.field("customer_id").eq(customerId))
                .fetchOneInto(Integer.class);

        // Count authorizations
        int authCount = dsl.selectCount()
                .from(DSL.table("customer_authorizations"))
                .where(DSL.field("customer_id").eq(customerId))
                .and(DSL.field("status").eq("signed"))
                .fetchOneInto(Integer.class);

        // Count report tasks
        int reportCount = dsl.selectCount()
                .from(DSL.table("report_tasks"))
                .where(DSL.field("customer_id").eq(customerId))
                .fetchOneInto(Integer.class);

        return Map.of(
                "customer", customer,
                "docCount", docCount != null ? docCount : 0,
                "followUpCount", followUpCount != null ? followUpCount : 0,
                "authSignedCount", authCount != null ? authCount : 0,
                "reportCount", reportCount != null ? reportCount : 0
        );
    }

    private Condition buildAccessCondition(JwtUserDetails user) {
        String dataScope = user.getDataScope();
        if ("SELF".equals(dataScope)) {
            return DSL.field("c.institution_id").eq(user.getInstitutionId())
                    .and(DSL.field("c.advisor_id").eq(user.getUserId()));
        } else if ("TEAM".equals(dataScope)) {
            // For TEAM scope, can view all customers in institution (simplified: same as ALL for now)
            return DSL.field("c.institution_id").eq(user.getInstitutionId());
        } else {
            // ALL
            return DSL.field("c.institution_id").eq(user.getInstitutionId());
        }
    }

    private void ensureAccess(JwtUserDetails user, Long customerId) {
        Condition condition = buildAccessCondition(user);
        condition = condition.and(DSL.field("c.id").eq(customerId))
                .and(DSL.field("c.deleted_at").isNull());

        int count = dsl.selectCount()
                .from(DSL.table("customers").as("c"))
                .where(condition)
                .fetchOneInto(Integer.class);

        if (count == null || count == 0) {
            throw AppException.notFound("客户不存在或无访问权限");
        }
    }

    private List<String> loadLabels(Long customerId) {
        return dsl.select(DSL.field("label", String.class))
                .from(DSL.table("customer_labels"))
                .where(DSL.field("customer_id").eq(customerId))
                .fetchInto(String.class);
    }

    private CustomerResponse mapToCustomerResponse(Record r, List<String> labels) {
        return CustomerResponse.builder()
                .id(r.get(DSL.field("c.id", Long.class)))
                .institutionId(r.get(DSL.field("c.institution_id", Long.class)))
                .advisorId(r.get(DSL.field("c.advisor_id", Long.class)))
                .advisorName(r.get(DSL.field("advisor_name", String.class)))
                .name(r.get(DSL.field("c.name", String.class)))
                .contactName(r.get(DSL.field("c.contact_name", String.class)))
                .contactPhone(r.get(DSL.field("c.contact_phone", String.class)))
                .financingNeed(r.get(DSL.field("c.financing_need", String.class)))
                .loanPurpose(r.get(DSL.field("c.loan_purpose", String.class)))
                .loanAmount(r.get(DSL.field("c.loan_amount", java.math.BigDecimal.class)))
                .status(r.get(DSL.field("c.status", String.class)))
                .docCompleteness(r.get(DSL.field("c.doc_completeness", Short.class)).intValue())
                .aiSummary(r.get(DSL.field("c.ai_summary", String.class)))
                .riskNotes(r.get(DSL.field("c.risk_notes", String.class)))
                .createdAt(r.get(DSL.field("c.created_at", LocalDateTime.class)))
                .updatedAt(r.get(DSL.field("c.updated_at", LocalDateTime.class)))
                .labels(labels)
                .build();
    }
}
