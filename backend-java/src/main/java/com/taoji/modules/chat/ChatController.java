package com.taoji.modules.chat;

import com.taoji.common.ApiResponse;
import com.taoji.modules.chat.dto.SendMessageRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/c/chat")
@RequiredArgsConstructor
@Tag(name = "AI聊天（C端公开）", description = "客户端无需登录即可使用的AI对话接口")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/sessions")
    @Operation(summary = "创建会话", description = "为客户创建新的聊天会话")
    public ApiResponse<Map<String, Object>> createSession(
            @RequestParam(required = false) Long customerId,
            @RequestParam(defaultValue = "c_end") String source) {
        return ApiResponse.ok(chatService.createSession(customerId, source));
    }

    @PostMapping("/send")
    @Operation(summary = "发送消息", description = "发送消息并获取AI回复，支持新建或继续会话")
    public ApiResponse<Map<String, Object>> sendMessage(
            @Valid @RequestBody SendMessageRequest request) {
        return ApiResponse.ok(chatService.sendMessage(request));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    @Operation(summary = "获取会话消息历史")
    public ApiResponse<List<Map<String, Object>>> getMessages(
            @PathVariable Long sessionId) {
        return ApiResponse.ok(chatService.getSessionMessages(sessionId));
    }
}
