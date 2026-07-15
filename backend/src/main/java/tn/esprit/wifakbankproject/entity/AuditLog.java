package tn.esprit.wifakbankproject.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "AUDIT_LOG")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "audit_seq")
    @SequenceGenerator(name = "audit_seq", sequenceName = "AUDIT_LOG_SEQ", allocationSize = 1)
    private Long id;

    /** Nullable – failed attempts may not resolve to a known user. */
    @Column(name = "USER_ID")
    private Long userId;

    @Column(name = "ATTEMPTED_LOGIN", length = 100)
    private String attemptedLogin;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private Action action;

    @Column(name = "DATE_ACTION", nullable = false)
    private LocalDateTime dateAction;

    @Column(name = "IP_ADDRESS", length = 50)
    private String ipAddress;

    @PrePersist
    void prePersist() {
        if (dateAction == null) dateAction = LocalDateTime.now();
    }

    public enum Action { LOGIN, LOGOUT, LOGIN_FAILED, LOGIN_INACTIVE, OTP_GENERATED, OTP_VERIFIED, OTP_FAILED }
}
