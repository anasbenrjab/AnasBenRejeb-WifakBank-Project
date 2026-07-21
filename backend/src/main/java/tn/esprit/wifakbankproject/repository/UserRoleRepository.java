package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.wifakbankproject.entity.Application;
import tn.esprit.wifakbankproject.entity.UserRole;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    /**
     * Returns the distinct ACTIVE applications that the given user has access to
     * via their assigned roles.
     */
    @Query("""
            SELECT DISTINCT r.application
            FROM UserRole ur
            JOIN ur.role r
            JOIN r.application a
            WHERE ur.user.id = :userId
              AND a.status = tn.esprit.wifakbankproject.entity.Application$Status.ACTIVE
            """)
    List<Application> findAuthorizedApplicationsByUserId(@Param("userId") Long userId);

    /**
     * Checks if there are any user-role assignments for the given role ID
     */
    boolean existsByRoleId(Long roleId);
}
