package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.wifakbankproject.entity.ApplicationRole;
import tn.esprit.wifakbankproject.entity.ApplicationRoleId;

import java.util.List;

public interface ApplicationRoleRepository extends JpaRepository<ApplicationRole, ApplicationRoleId> {
    List<ApplicationRole> findByApplicationId(Long applicationId);
    List<ApplicationRole> findByRoleId(Long roleId);
    boolean existsByApplicationIdAndRoleId(Long applicationId, Long roleId);
}
