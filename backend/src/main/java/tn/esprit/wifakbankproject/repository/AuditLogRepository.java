package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.wifakbankproject.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Nullifies the USER_ID FK on all audit log entries for the given user
     * before that user is deleted. Audit history is preserved — only the
     * user reference is severed so the FK constraint doesn't block deletion.
     */
    @Modifying
    @Query("UPDATE AuditLog a SET a.userId = NULL WHERE a.userId = :userId")
    void detachUser(@Param("userId") Long userId);
}
