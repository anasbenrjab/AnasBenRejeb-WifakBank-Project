package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.wifakbankproject.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
