package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.wifakbankproject.entity.Otp;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<Otp, Long> {

    /**
     * Returns the most recent OTP for the given login, regardless of status.
     * Used by verifyOtp to find the latest code.
     */
    Optional<Otp> findTopByLoginOrderByExpiryTimeDesc(String login);

    /**
     * Invalidates (marks used) all unexpired OTPs for a login before issuing
     * a new one — prevents accumulation of valid codes on resend.
     */
    @Modifying
    @Query("UPDATE Otp o SET o.used = true WHERE o.login = :login AND o.used = false AND o.expiryTime > :now")
    void invalidateActiveOtps(@Param("login") String login, @Param("now") LocalDateTime now);
}
