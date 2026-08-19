package com.wifakbank.dashboardclient.controller;

import com.wifakbank.dashboardclient.dto.DashboardDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    /**
     * Protected endpoint — requires a valid JWT (enforced by SecurityConfig + JwtAuthenticationFilter).
     * Returns dashboard statistics for the authenticated user.
     */
    @GetMapping("/data")
    public ResponseEntity<DashboardDataDto> getDashboardData(Authentication authentication) {
        String username = authentication.getName();
        log.info("Dashboard data requested by user: {}", username);

        return ResponseEntity.ok(DashboardDataDto.builder()
                .username(username)
                .welcomeMessage("Welcome to Dashboard Client, " + username)
                .totalApplications(3)
                .activeSessions(1)
                .lastLogin(new Date())
                .build());
    }
}
