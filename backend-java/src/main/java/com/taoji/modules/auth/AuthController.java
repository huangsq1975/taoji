package com.taoji.modules.auth;

import com.taoji.common.ApiResponse;
import com.taoji.modules.auth.dto.LoginRequest;
import com.taoji.modules.auth.dto.LoginResponse;
import com.taoji.modules.auth.dto.WxLoginRequest;
import com.taoji.security.CurrentUser;
import com.taoji.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "认证", description = "登录、微信登录、Token刷新")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "账号密码登录", description = "顾问/管理员使用手机号+密码登录")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @PostMapping("/wx-login")
    @Operation(summary = "微信小程序登录", description = "C端客户或顾问使用微信授权code登录")
    public ApiResponse<LoginResponse> wxLogin(@Valid @RequestBody WxLoginRequest request) {
        return ApiResponse.ok(authService.wxLogin(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "刷新Token", description = "使用当前有效Token换取新Token")
    public ApiResponse<LoginResponse> refresh(@CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(authService.refresh(currentUser.getUserId()));
    }

    @GetMapping("/me")
    @Operation(summary = "获取当前用户信息", description = "返回当前登录用户的详细信息及权限列表")
    public ApiResponse<Map<String, Object>> me(@CurrentUser JwtUserDetails currentUser) {
        return ApiResponse.ok(authService.getCurrentUser(currentUser.getUserId()));
    }
}
