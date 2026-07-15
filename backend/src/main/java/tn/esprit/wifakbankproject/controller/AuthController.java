package tn.esprit.wifakbankproject.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.wifakbankproject.dto.LoginRequest;
import tn.esprit.wifakbankproject.dto.LoginResponse;
import tn.esprit.wifakbankproject.dto.VerifyOtpRequest;
import tn.esprit.wifakbankproject.dto.ResendOtpRequest;
import tn.esprit.wifakbankproject.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/login
     * Body: { "login": "ahmed", "password": "Ahmed1234!" }
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        LoginResponse response = authService.login(request, clientIp);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/verify-otp
     * Body: { "login": "ahmed", "code": "123456" }
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<LoginResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        LoginResponse response = authService.verifyOtp(request, clientIp);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/resend-otp
     * Body: { "login": "ahmed" }
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<Void> resendOtp(
            @Valid @RequestBody ResendOtpRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        authService.resendOtp(request.getLogin(), clientIp);
        return ResponseEntity.ok().build();
    }

    // ── helper ───────────────────────────────────────────────────────────────

    private String resolveClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
