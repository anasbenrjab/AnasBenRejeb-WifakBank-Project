package tn.esprit.wifakbankproject.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Stores a one-time password generated after successful LDAP authentication.
 * The OTP is valid for 5 minutes and can only be used once.
 */
@Entity
@Table(name = "OTP_TOKENS")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Otp {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "otp_seq")
    @SequenceGenerator(name = "otp_seq", sequenceName = "OTP_TOKENS_SEQ", allocationSize = 1)
    private Long id;

    /** The login (username) this OTP was issued for. */
    @Column(nullable = false, length = 100)
    private String login;

    /** 6-digit numeric code. */
    @Column(nullable = false, length = 6)
    private String code;

    /** When the OTP was created. */
    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    /** When the OTP expires (createdAt + 5 minutes). */
    @Column(name = "EXPIRY_TIME", nullable = false)
    private LocalDateTime expiryTime;

    /** True after the OTP has been successfully verified. */
    @Column(nullable = false)
    @Builder.Default
    private boolean used = false;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (expiryTime == null) expiryTime = createdAt.plusMinutes(5);
    }
}
