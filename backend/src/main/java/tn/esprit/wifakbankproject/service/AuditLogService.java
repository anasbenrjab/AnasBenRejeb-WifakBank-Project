package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.entity.AuditLog;
import tn.esprit.wifakbankproject.repository.AuditLogRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Persists an audit entry.
     * Uses REQUIRES_NEW so that a failed login (which may roll back the outer
     * transaction) still gets recorded.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String attemptedLogin, Long userId, AuditLog.Action action, String ip) {
        AuditLog entry = AuditLog.builder()
                .attemptedLogin(attemptedLogin)
                .userId(userId)
                .action(action)
                .dateAction(LocalDateTime.now())
                .ipAddress(ip)
                .build();
        auditLogRepository.save(entry);
    }
}
