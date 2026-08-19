package com.wifakbank.dashboardclient.controller;

import com.wifakbank.dashboardclient.dto.UserInfoDto;
import com.wifakbank.dashboardclient.service.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final JwtService jwtService;

    /**
     * Public endpoint — validates the incoming JWT and returns basic user info.
     * Called by the Angular frontend immediately after receiving the token via URL param.
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
