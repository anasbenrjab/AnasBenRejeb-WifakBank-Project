package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ldap.core.DirContextOperations;
import org.springframework.security.ldap.userdetails.LdapUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.entity.User;
import tn.esprit.wifakbankproject.repository.UserRepository;

import java.time.LocalDateTime;

/**
 * Just-In-Time (JIT) provisioning: on first successful AD login,
 * create a local USERS row to hold roles and track last_login.
 * AD owns the credentials; we never store the AD password.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserProvisioningService {

    private final UserRepository userRepository;

    @Transactional
    public User provisionOrUpdate(String login, Object principalDetails) {
        return userRepository.findByLogin(login)
                .map(existing -> {
                    existing.setLastLogin(LocalDateTime.now());
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    log.info("JIT provisioning new AD user: {}", login);
                    User newUser = buildFromPrincipal(login, principalDetails);
                    return userRepository.save(newUser);
                });
    }

    // ── private ──────────────────────────────────────────────────────────────

    private User buildFromPrincipal(String login, Object details) {
        User.UserBuilder builder = User.builder()
                .login(login)
                .authType(User.AuthType.AD)
                .status(User.Status.ACTIVE)
                .lastLogin(LocalDateTime.now());

        // Try to enrich from LDAP attributes when available
        if (details instanceof DirContextOperations ctx) {
            builder.nom(getAttr(ctx, "sn", login));
            builder.prenom(getAttr(ctx, "givenName", ""));
            builder.email(getAttr(ctx, "mail", login + "@wifakbank.tn"));
        } else if (details instanceof LdapUserDetails ldap) {
            // Fallback: extract from DN
            builder.nom(extractFromDn(ldap.getDn()));
            builder.email(login + "@wifakbank.tn");
        } else {
            builder.nom(login);
            builder.email(login + "@wifakbank.tn");
        }

        return builder.build();
    }

    private String getAttr(DirContextOperations ctx, String attr, String fallback) {
        String val = ctx.getStringAttribute(attr);
        return (val != null && !val.isBlank()) ? val : fallback;
    }

    private String extractFromDn(String dn) {
        // uid=ahmed,ou=people,... → ahmed
        if (dn != null && dn.contains("=")) {
            return dn.split(",")[0].split("=")[1];
        }
        return dn;
    }
}
