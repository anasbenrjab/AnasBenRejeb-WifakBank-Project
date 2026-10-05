package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.wifakbankproject.entity.Department;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    // ── Soft-delete aware — used by admin lists and pickers ───────────────────
    List<Department> findByDeletedFalse();

    // ── Uniqueness checks — operate across ALL rows including soft-deleted ────
    // Consistent with Application policy: a soft-deleted code/name still blocks reuse.
    Optional<Department> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, Long id);

    /** Name uniqueness — case-insensitive. */
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
