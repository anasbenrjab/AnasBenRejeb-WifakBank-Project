package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.wifakbankproject.entity.SubDepartment;

import java.util.List;

@Repository
public interface SubDepartmentRepository extends JpaRepository<SubDepartment, Long> {

    // ── Soft-delete aware — used by admin lists and pickers ───────────────────
    List<SubDepartment> findByDeletedFalse();
    List<SubDepartment> findByDepartmentIdAndDeletedFalse(Long departmentId);

    // ── Legacy: kept for backward-compat calls that don't filter deleted ──────
    List<SubDepartment> findByDepartmentId(Long departmentId);

    // ── Uniqueness checks within a department — all rows including deleted ────
    boolean existsByNameIgnoreCaseAndDepartmentId(String name, Long departmentId);
    boolean existsByNameIgnoreCaseAndDepartmentIdAndIdNot(String name, Long departmentId, Long id);
}
