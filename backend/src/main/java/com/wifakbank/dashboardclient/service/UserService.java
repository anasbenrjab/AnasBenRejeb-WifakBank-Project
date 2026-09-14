package com.wifakbank.dashboardclient.service;

import com.wifakbank.dashboardclient.dto.LoginRequestDto;
import com.wifakbank.dashboardclient.dto.LoginResponseDto;
import com.wifakbank.dashboardclient.entity.User;
import com.wifakbank.dashboardclient.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    /**
     * Validates credentials against the local USERS table and issues a JWT.
     * NOTE: plain text password comparison — development only.
     * Replace with BCryptPasswordEncoder.matches() before production.
     */
    public LoginResponseDto login(LoginRequestDto request) {
        if (request.getUsername() == null || request.getUsername().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and password are required");
        }

        User user = userRepository.findByUsernameAndActiveTrue(request.getUsername())
                .orElseThrow(() -> {
                    log.warn("Login attempt for unknown user: {}", request.getUsername());
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
                });

        // Plain text check — PASSWORD_HASH column stores plain text in dev mode
        if (!request.getPassword().equals(user.getPasswordHash())) {
            log.warn("Invalid password for user: {}", request.getUsername());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtService.generateToken(user.getUsername(), List.of(user.getRole()));
        log.info("Standalone login successful for user: {}", user.getUsername());

        return LoginResponseDto.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }
}
