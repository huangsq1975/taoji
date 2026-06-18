package com.taoji.modules.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotBlank(message = "消息内容不能为空")
    private String content;

    /**
     * Session ID. If null, a new session will be created.
     */
    private Long sessionId;

    /**
     * c_end | advisor_mobile | advisor_pc
     */
    private String source = "c_end";

    /**
     * Optional customer context
     */
    private Long customerId;
}
