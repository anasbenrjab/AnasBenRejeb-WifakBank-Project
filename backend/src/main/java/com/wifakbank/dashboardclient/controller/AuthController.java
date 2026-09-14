package com.wifakbank.dashboardclient.controller;

import com.wifakbank.dashboardclient.dto.LoginRequestDto;
import com.wifakbank.dashboardclient.dto.LoginResponseDto;
import com.wifakbank.dashboardclient.dto.UserInfoDto;
import com.wifakbank.dashboardclient.service.JwtService;
import com.wifakbank.dashboardclient.service.UserService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final JwtService jwtService;
    private final UserService userService;

    /**
     * STANDALONE MODE — validates local credentials, issues a JWT.
     * POST http://localhost:8082/api/auth/login
     * Body: { "username": "test", "password": "test123" }
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto request) {
        LoginResponseDto response = userService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * BOTH MODES — validates any JWT (portal-issued or locally-issued) and returns user info.
     * GET http://localhost:8082/api/auth/validate
     * Header: Authorization: Bearer <token>
     */
    @GetMapping("/validate")
    public ResponseEntity<UserInfoDto> validateToken(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        Claims claims = jwtService.validateToken(token);

        log.info("Token validated successfully for user: {}", jwtService.extractUsername(claims));

        return ResponseEntity.ok(UserInfoDto.builder()
                .username(jwtService.extractUsername(claims))
                .roles(jwtService.extractRoles(claims))
                .build());
    }
}
