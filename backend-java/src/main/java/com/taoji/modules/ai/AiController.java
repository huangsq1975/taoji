package com.taoji.modules.ai;

import com.taoji.common.ApiResponse;
import com.taoji.modules.ai.dto.TriggerRecognitionRequest;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Tag(name = "AI识别", description = "触发AI文档识别、查询任务状态")
public class AiController {

    private final AiService aiService;

    @PostMapping("/recognize")
    @Operation(summary = "触发AI识别", description = "异步触发文档AI识别，立即返回任务ID供轮询")
    public ApiResponse<Map<String, Object>> triggerRecognition(
            @CurrentUser JwtUserDetails currentUser,
            @Valid @RequestBody TriggerRecognitionRequest request) {
        return ApiResponse.ok(aiService.triggerRecognition(currentUser, request));
    }

    @GetMapping("/recognize/{taskId}")
    @Operation(summary = "查询识别任务状态", description = "轮询任务状态：QUEUED → PROCESSING → DONE/FAILED")
    public ApiResponse<Map<String, Object>> getTaskStatus(
            @CurrentUser JwtUserDetails currentUser,
            @PathVariable Long taskId) {
        return ApiResponse.ok(aiService.getTaskStatus(currentUser, taskId));
    }
}
