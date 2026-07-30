package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.entity.Otp;
import tn.esprit.wifakbankproject.repository.OtpRepository;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository  otpRepository;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Generates a 6-digit OTP, invalidates any previous active OTP for the
     * same login, persists the new one, and attempts to send it by email.
     * If SMTP delivery fails, the OTP remains valid and is logged for manual use.
     */
    @Transactional
    public void generateAndSendOtp(String login, String email) {
        // Invalidate all currently active OTPs for this user before creating a new one
        otpRepository.invalidateActiveOtps(login, LocalDateTime.now());

        // Generate 6-digit code, zero-padded
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        Otp otp = Otp.builder()
                .login(login)
                .code(code)
                .createdAt(LocalDateTime.now())
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .build();

        otpRepository.save(otp);
        log.info("OTP generated for login '{}', expires at {}", login, otp.getExpiryTime());

        try {
            sendEmail(email, code, login);
        } catch (Exception e) {
            log.warn("Email send failed, OTP for {} is: {}", login, code, e);
            Throwable cause = e;
            while (cause != null) {
                log.warn("Mail error cause: {} -> {}", cause.getClass().getName(), cause.getMessage());
                cause = cause.getCause();
            }
        }
    }

    // ── private ──────────────────────────────────────────────────────────────

    private void sendEmail(String to, String code, String login) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject("WifakConnect — Votre code de vérification");
        message.setText(
                "Bonjour,\n\n" +
                "Votre code de vérification WifakConnect est :\n\n" +
                "    " + code + "\n\n" +
                "Ce code est valable 5 minutes. Ne le communiquez à personne.\n\n" +
                "Si vous n'avez pas demandé ce code, ignorez ce message.\n\n" +
                "— L'équipe WifakBank"
        );
        mailSender.send(message);
        log.info("OTP email sent to '{}' (login: '{}')", to, login);
    }
}
