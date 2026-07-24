package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.wifakbankproject.entity.UserRole;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    /**
     * Checks if there are any user-role assignments for the given role ID
     */
    boolean existsByRoleId(Long roleId);
}
