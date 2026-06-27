package com.taoji.modules.chat;

import com.taoji.common.AppException;
import com.taoji.modules.chat.dto.SendMessageRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final DSLContext dsl;
    private final WebClient.Builder webClientBuilder;

    @Value("${ai.api-url:https://api.openai.com/v1}")
    private String aiApiUrl;

    @Value("${ai.api-key:}")
    private String aiApiKey;

    @Value("${ai.model:gpt-4o-mini}")
    private String aiModel;

    @PostConstruct
    void logAiConfig() {
        boolean keyPresent = aiApiKey != null && !aiApiKey.isBlank();
        log.info("AI chat config: url={}, model={}, keyConfigured={}", aiApiUrl, aiModel, keyPresent);
    }

    @Transactional
    public Map<String, Object> sendMessage(SendMessageRequest request) {
        String source = request.getSource() != null ? request.getSource() : "c_end";

        // Get or create session
        Long sessionId = request.getSessionId();
        if (sessionId == null) {
            sessionId = dsl.insertInto(DSL.table("chat_sessions"))
                    .set(DSL.field("customer_id"), request.getCustomerId())
                    .set(DSL.field("source", String.class), chatSourceField(source))
                    .set(DSL.field("created_at"), LocalDateTime.now())
                    .returningResult(DSL.field("id", Long.class))
                    .fetchOneInto(Long.class);
        } else {
            // Verify session exists
            Integer exists = dsl.selectCount()
                    .from(DSL.table("chat_sessions"))
                    .where(DSL.field("id").eq(sessionId))
                    .fetchOneInto(Integer.class);
            if (exists == null || exists == 0) {
                throw AppException.notFound("会话不存在");
            }
        }

        // Save user message
        dsl.insertInto(DSL.table("chat_messages"))
                .set(DSL.field("session_id"), sessionId)
                .set(DSL.field("role", String.class), chatRoleField("user"))
                .set(DSL.field("content"), request.getContent())
                .set(DSL.field("created_at"), LocalDateTime.now())
                .execute();

        // Get session history (last 20 messages for context)
        List<Map<String, Object>> history = dsl.select(
                        DSL.field("role"),
                        DSL.field("content")
                )
                .from(DSL.table("chat_messages"))
                .where(DSL.field("session_id").eq(sessionId))
                .orderBy(DSL.field("created_at").desc())
                .limit(20)
                .fetchMaps();

        // Reverse to get chronological order
        java.util.Collections.reverse(history);

        // Call AI API
        String aiResponse = callAiChat(history, request.getContent(), source);

        // Save assistant response
        Long aiMessageId = dsl.insertInto(DSL.table("chat_messages"))
                .set(DSL.field("session_id"), sessionId)
                .set(DSL.field("role", String.class), chatRoleField("assistant"))
                .set(DSL.field("content"), aiResponse)
                .set(DSL.field("created_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Long.class))
                .fetchOneInto(Long.class);

        return Map.of(
                "sessionId", sessionId,
                "messageId", aiMessageId,
                "role", "assistant",
                "content", aiResponse,
                "createdAt", LocalDateTime.now().toString()
        );
    }

    public List<Map<String, Object>> listSessionsForCustomer(Long customerId) {
        // Fetch sessions with first user message (title) and last message (preview)
        List<Map<String, Object>> rows = dsl.fetch(
                "SELECT s.id, s.created_at, " +
                "(SELECT content FROM chat_messages WHERE session_id = s.id AND role = 'user' " +
                " ORDER BY created_at ASC LIMIT 1) AS first_content, " +
                "(SELECT content FROM chat_messages WHERE session_id = s.id " +
                " ORDER BY created_at DESC LIMIT 1) AS last_content, " +
                "(SELECT created_at FROM chat_messages WHERE session_id = s.id " +
                " ORDER BY created_at DESC LIMIT 1) AS last_msg_time " +
                "FROM chat_sessions s WHERE s.customer_id = ? AND s.source = 'c_end' " +
                "ORDER BY s.created_at DESC LIMIT 20",
                customerId
        ).intoMaps();

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String firstContent = row.get("first_content") != null ? row.get("first_content").toString() : null;
            String lastContent  = row.get("last_content")  != null ? row.get("last_content").toString()  : null;

            String title   = firstContent != null && !firstContent.isBlank()
                    ? (firstContent.length() > 24 ? firstContent.substring(0, 24) + "…" : firstContent)
                    : "空对话";
            String preview = lastContent != null && !lastContent.isBlank()
                    ? (lastContent.length() > 40 ? lastContent.substring(0, 40) + "…" : lastContent)
                    : "";

            // Prefer last message time, fall back to session created_at
            Object timeObj = row.get("last_msg_time") != null ? row.get("last_msg_time") : row.get("created_at");
            String time = "";
            if (timeObj instanceof LocalDateTime ldt) {
                time = ldt.format(fmt);
            } else if (timeObj instanceof java.sql.Timestamp ts) {
                time = ts.toLocalDateTime().format(fmt);
            }

            java.util.LinkedHashMap<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("id", row.get("id"));
            item.put("title", title);
            item.put("preview", preview);
            item.put("time", time);
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getSessionMessages(Long sessionId) {
        Integer exists = dsl.selectCount()
                .from(DSL.table("chat_sessions"))
                .where(DSL.field("id").eq(sessionId))
                .fetchOneInto(Integer.class);
        if (exists == null || exists == 0) {
            throw AppException.notFound("会话不存在");
        }

        return dsl.select()
                .from(DSL.table("chat_messages"))
                .where(DSL.field("session_id").eq(sessionId))
                .orderBy(DSL.field("created_at").asc())
                .fetchMaps();
    }

    public Map<String, Object> createSession(Long customerId, String source) {
        String chatSource = source != null ? source : "c_end";
        Long sessionId = dsl.insertInto(DSL.table("chat_sessions"))
                .set(DSL.field("customer_id"), customerId)
                .set(DSL.field("source", String.class), chatSourceField(chatSource))
                .set(DSL.field("created_at"), LocalDateTime.now())
                .returningResult(DSL.field("id", Long.class))
                .fetchOneInto(Long.class);

        return dsl.select()
                .from(DSL.table("chat_sessions"))
                .where(DSL.field("id").eq(sessionId))
                .fetchOneMap();
    }

    private org.jooq.Field<String> chatSourceField(String source) {
        return DSL.field("?::chat_source", String.class, source);
    }

    private org.jooq.Field<String> chatRoleField(String role) {
        return DSL.field("?::chat_role", String.class, role);
    }

    @SuppressWarnings("unchecked")
    private String callAiChat(List<Map<String, Object>> history, String userMessage, String source) {
        if (aiApiKey == null || aiApiKey.isBlank()) {
            log.info("AI API key not configured, returning mock response");
            return generateMockResponse(userMessage);
        }

        try {
            List<Map<String, Object>> messages = new ArrayList<>();

            messages.add(Map.of(
                    "role", "system",
                    "content", systemPromptFor(source)
            ));

            for (Map<String, Object> item : history) {
                messages.add(Map.of(
                        "role", String.valueOf(item.get("role")),
                        "content", String.valueOf(item.get("content"))
                ));
            }

            Map<String, Object> payload = Map.of(
                    "model", aiModel,
                    "messages", messages,
                    "max_tokens", 500,
                    "temperature", 0.7
            );

            Map<String, Object> response = webClientBuilder.build()
                    .post()
                    .uri(aiApiUrl + "/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + aiApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }

            return "抱歉，AI服务暂时不可用，请稍后再试。";

        } catch (Exception e) {
            log.error("AI chat API call failed: {}", e.getMessage(), e);
            return "抱歉，AI 服务调用失败：" + e.getMessage();
        }
    }

    private String systemPromptFor(String source) {
        if ("advisor_pc".equals(source) || "advisor_mobile".equals(source)) {
            return "你是韬纪元AI机构顾问助手，专门帮助贷款顾问撰写沟通话术、整理客户材料说明、辅助银行制式表格填写与复核。" +
                    "请用专业、简洁的语气回答，输出可直接用于工作的文字。" +
                    "重要声明：本平台不直接发放贷款，所有AI生成结果仅供参考，最终以顾问审核为准。";
        }
        return "你是韬纪元AI贷款助手，专门帮助用户了解贷款相关信息、整理申请材料、解答疑问。" +
                "请用专业、友好的语气回答，内容简洁清晰。" +
                "重要声明：本平台不直接发放贷款，所有AI生成结果仅供参考，最终以顾问审核为准。";
    }

    private String generateMockResponse(String userMessage) {
        if (userMessage.contains("贷款") || userMessage.contains("申请")) {
            return "您好！我是韬纪元AI贷款助手。关于贷款申请，我需要了解您的基本情况：\n" +
                    "1. 您是个人申请还是企业申请？\n" +
                    "2. 大概需要的贷款金额是多少？\n" +
                    "3. 贷款用途是什么？\n\n" +
                    "了解这些信息后，我可以为您推荐合适的贷款产品和需要准备的材料。";
        } else if (userMessage.contains("材料") || userMessage.contains("文件")) {
            return "一般贷款申请需要准备以下材料：\n" +
                    "📄 基本材料：\n" +
                    "• 身份证（正反面）\n" +
                    "• 营业执照（企业贷款）\n" +
                    "• 近6个月银行流水\n\n" +
                    "📊 财务材料：\n" +
                    "• 征信报告\n" +
                    "• 税务证明（如有）\n\n" +
                    "具体材料要求因银行和产品不同而有所差异，您的贷款顾问会为您详细说明。";
        } else if (userMessage.contains("利率") || userMessage.contains("利息")) {
            return "目前市场上主要贷款产品利率大致范围：\n" +
                    "• 个人信用贷款：年化 4.8%-15%\n" +
                    "• 企业经营贷款：年化 3.98%-8%\n" +
                    "• 房产抵押贷款：年化 3.5%-6%\n\n" +
                    "具体利率取决于您的信用状况、抵押物情况等因素。建议您联系我们的顾问获取准确报价。\n\n" +
                    "⚠️ 免责声明：AI生成内容仅供参考，最终以顾问审核为准。";
        } else {
            return "您好！我是韬纪元AI贷款助手，我可以帮您：\n" +
                    "• 了解贷款产品和利率信息\n" +
                    "• 整理贷款申请所需材料\n" +
                    "• 解答贷款流程相关问题\n\n" +
                    "请问您有什么需要帮助的？";
        }
    }
}
