package com.taoji.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WxLoginRequest {

    @NotBlank(message = "微信授权code不能为空")
    private String code;

    /**
     * Optional: associate this wx user with an existing customer record
     */
    private Long customerId;

    /**
     * Optional: customer scanned advisor's QR code — create/bind customer under this advisor
     */
    private Long advisorId;
}
