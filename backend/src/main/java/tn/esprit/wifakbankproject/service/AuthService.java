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
import tn.esprit.wifakbankproject.entity.AuditLog;
import tn.esprit.wifakbankproject.entity.User;
import tn.esprit.wifakbankproject.exception.AuthenticationException;
import tn.esprit.wifakbankproject.security.JwtUtil;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager     authManager;
    private final JwtUtil                   jwtUtil;
    private final UserProvisioningService   provisioningService;
    private final AuditLogService           auditLogService;

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

            // 4. Issue JWT
            String token = jwtUtil.generateToken(login);

            // 5. Audit
            auditLogService.log(login, user.getId(), AuditLog.Action.LOGIN, clientIp);

            return LoginResponse.builder()
                    .token(token)
                    .login(user.getLogin())
                    .nom(user.getNom())
                    .prenom(user.getPrenom())
                    .email(user.getEmail())
                    .build();

        } catch (AuthenticationException e) {
            throw e; // already audited above
        } catch (BadCredentialsException e) {
            auditLogService.log(login, null, AuditLog.Action.LOGIN_FAILED, clientIp);
            throw new AuthenticationException("Identifiants incorrects.");
        } catch (DisabledException e) {
            auditLogService.log(login, null, AuditLog.Action.LOGIN_INACTIVE, clientIp);
            throw new AuthenticationException("Compte désactivé.");
        } catch (Exception e) {
            log.error("Unexpected auth error for login '{}': {}", login, e.getMessage());
            auditLogService.log(login, null, AuditLog.Action.LOGIN_FAILED, clientIp);
            throw new AuthenticationException("Erreur d'authentification. Réessayez.");
        }
    }
}
