package com.taoji.modules.advisor;

import com.taoji.modules.auth.AuthService;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/advisor")
@RequiredArgsConstructor
@Tag(name = "顾问", description = "顾问个人功能：邀请码等")
public class AdvisorController {

    private final AuthService authService;

    @GetMapping("/invite-qrcode")
    @Operation(
            summary = "获取顾问邀请二维码",
            description = "返回一张 PNG 图片（微信小程序码），客户用微信扫码后自动进入小程序并绑定到该顾问名下"
    )
    public ResponseEntity<byte[]> getInviteQrcode(@CurrentUser JwtUserDetails currentUser) {
        byte[] png = authService.generateAdvisorInviteQrcode(currentUser.getUserId());
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(png);
    }
}
