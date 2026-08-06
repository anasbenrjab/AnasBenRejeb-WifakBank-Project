package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.wifakbankproject.entity.UserApplicationRole;
import tn.esprit.wifakbankproject.entity.UserApplicationRoleId;

import java.util.List;
import java.util.Set;

public interface UserApplicationRoleRepository extends JpaRepository<UserApplicationRole, UserApplicationRoleId> {
    List<UserApplicationRole> findByUserId(Long userId);
    List<UserApplicationRole> findByApplicationId(Long applicationId);
    List<UserApplicationRole> findByRoleId(Long roleId);
    boolean existsByUserIdAndApplicationIdAndRoleId(Long userId, Long applicationId, Long roleId);
    boolean existsByUserId(Long userId);
    boolean existsByRoleId(Long roleId);

    /**
     * Deletes the single row for (userId, applicationId) regardless of which
     * role is currently assigned. Used by updateUser() to replace an assignment
     * for one application without touching assignments for other applications.
     */
    @Modifying
    @Query("DELETE FROM UserApplicationRole uar WHERE uar.user.id = :userId AND uar.application.id = :applicationId")
    void deleteByUserIdAndApplicationId(@Param("userId") Long userId, @Param("applicationId") Long applicationId);

    @Query("SELECT r.nom FROM UserApplicationRole uar " +
           "JOIN uar.role r " +
           "WHERE uar.user.login = :login")
    Set<String> findRoleNamesByLogin(@Param("login") String login);

    @Query("SELECT COUNT(uar) > 0 FROM UserApplicationRole uar " +
           "JOIN uar.application a " +
           "JOIN uar.role r " +
           "WHERE uar.user.login = :login " +
           "  AND a.code = 'SYSTEM' " +
           "  AND r.nom = 'ROLE_ADMIN'")
    boolean isSystemAdminByLogin(@Param("login") String login);

    @Query("SELECT uar.user.login FROM UserApplicationRole uar " +
           "WHERE uar.application.id = :applicationId " +
           "  AND uar.role.id = :roleId " +
           "ORDER BY uar.user.login")
    List<String> findUserLoginsByApplicationIdAndRoleId(@Param("applicationId") Long applicationId, @Param("roleId") Long roleId);
}
