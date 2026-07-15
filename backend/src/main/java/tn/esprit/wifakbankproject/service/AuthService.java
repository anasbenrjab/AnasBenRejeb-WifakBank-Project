package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import tn.esprit.wifakbankproject.dto.LoginRequest;
import tn.esprit.wifakbankproject.dto.LoginResponse;
import tn.esprit.wifakbankproject.dto.VerifyOtpRequest;
import tn.esprit.wifakbankproject.entity.AuditLog;
import tn.esprit.wifakbankproject.entity.Otp;
import tn.esprit.wifakbankproject.entity.User;
import tn.esprit.wifakbankproject.exception.AuthenticationException;
import tn.esprit.wifakbankproject.repository.OtpRepository;
import tn.esprit.wifakbankproject.repository.UserRepository;
import tn.esprit.wifakbankproject.security.JwtUtil;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager     authManager;
    private final JwtUtil                   jwtUtil;
    private final UserProvisioningService   provisioningService;
    private final AuditLogService           auditLogService;
    private final OtpService                otpService;
    private final OtpRepository             otpRepository;
    private final UserRepository             userRepository;

    public LoginResponse login(LoginRequest request, String clientIp) {
        String login = request.getLogin().trim().toLowerCase();

        try {
            // 1. Bind against AD (or embedded LDAP in dev)
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(login, request.getPassword()));

            // 2. JIT provision / update last_login
            User user = provisioningService.provisionOrUpdate(login, auth.getPrincipal());

            // 3. Check local status (allows manual INACTIVE override)
            if (user.getStatus() == User.Status.INACTIVE) {
                auditLogService.log(login, user.getId(), AuditLog.Action.LOGIN_INACTIVE, clientIp);
                throw new AuthenticationException("Compte désactivé. Contactez l'administrateur.");
            }

            // 4. Generate & Send OTP
            otpService.generateAndSendOtp(user.getLogin(), user.getEmail());

            // 5. Audit OTP Generation
            auditLogService.log(user.getLogin(), user.getId(), AuditLog.Action.OTP_GENERATED, clientIp);

            // 6. Return response with otpRequired = true
            return LoginResponse.builder()
                    .login(user.getLogin())
                    .email(user.getEmail())
                    .otpRequired(true)
                    .build();

        } catch (AuthenticationException e) {
            throw e; // already audited
        } catch (BadCredentialsException e) {
            auditLogService.log(login, null, AuditLog.Action.LOGIN_FAILED, clientIp);
            throw new AuthenticationException("Identifiants incorrects.");
        } catch (DisabledException e) {
            auditLogService.log(login, null, AuditLog.Action.LOGIN_INACTIVE, clientIp);
            throw new AuthenticationException("Compte désactivé.");
        } catch (Exception e) {
            log.error("Unexpected auth error for login '{}': {}", login, e.getMessage(), e);
            auditLogService.log(login, null, AuditLog.Action.LOGIN_FAILED, clientIp);
            throw new AuthenticationException("Erreur d'authentification. Réessayez.");
        }
    }

    public LoginResponse verifyOtp(VerifyOtpRequest request, String clientIp) {
        String login = request.getLogin().trim().toLowerCase();
        User user = userRepository.findByLogin(login)
                .orElseThrow(() -> new AuthenticationException("Utilisateur non trouvé."));

        if (user.getStatus() == User.Status.INACTIVE) {
            auditLogService.log(login, user.getId(), AuditLog.Action.LOGIN_INACTIVE, clientIp);
            throw new AuthenticationException("Compte désactivé. Contactez l'administrateur.");
        }

        Otp otp = otpRepository.findTopByLoginOrderByExpiryTimeDesc(login)
                .orElseThrow(() -> {
                    auditLogService.log(login, user.getId(), AuditLog.Action.OTP_FAILED, clientIp);
                    return new AuthenticationException("Aucun code OTP généré pour cet utilisateur.");
                });

        if (otp.isUsed()) {
            auditLogService.log(login, user.getId(), AuditLog.Action.OTP_FAILED, clientIp);
            throw new AuthenticationException("Le code OTP a déjà été utilisé.");
        }

        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            auditLogService.log(login, user.getId(), AuditLog.Action.OTP_FAILED, clientIp);
            throw new AuthenticationException("Le code OTP a expiré.");
        }

        if (!otp.getCode().equals(request.getCode())) {
            auditLogService.log(login, user.getId(), AuditLog.Action.OTP_FAILED, clientIp);
            throw new AuthenticationException("Code OTP incorrect.");
        }

        // Mark OTP as used
        otp.setUsed(true);
        otpRepository.save(otp);

        // Issue JWT
        String token = jwtUtil.generateToken(login);

        // Audit success: log both verification and final login success
        auditLogService.log(login, user.getId(), AuditLog.Action.OTP_VERIFIED, clientIp);
        auditLogService.log(login, user.getId(), AuditLog.Action.LOGIN, clientIp);

        return LoginResponse.builder()
                .token(token)
                .login(user.getLogin())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .otpRequired(false)
                .build();
    }

    public void resendOtp(String attemptedLogin, String clientIp) {
        String login = attemptedLogin.trim().toLowerCase();
        User user = userRepository.findByLogin(login)
                .orElseThrow(() -> new AuthenticationException("Utilisateur non trouvé."));

        if (user.getStatus() == User.Status.INACTIVE) {
            auditLogService.log(login, user.getId(), AuditLog.Action.LOGIN_INACTIVE, clientIp);
            throw new AuthenticationException("Compte désactivé. Contactez l'administrateur.");
        }

        // Generate and send new OTP
        otpService.generateAndSendOtp(user.getLogin(), user.getEmail());

        // Audit OTP Generation
        auditLogService.log(user.getLogin(), user.getId(), AuditLog.Action.OTP_GENERATED, clientIp);
    }
}
