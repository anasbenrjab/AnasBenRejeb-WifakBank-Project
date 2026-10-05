package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.wifakbankproject.entity.Role;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    // ── Soft-delete aware — used by admin lists and pickers ───────────────────
    List<Role> findByDeletedFalse();

    // ── Legacy lookup (DataInitializer, ApplicationRegistry whitelist checks) ─
    Optional<Role> findByNom(String nom);

    // ── Uniqueness checks — operate across ALL rows including soft-deleted ────
    boolean existsByNom(String nom);
    boolean existsByNomAndIdNot(String nom, Long id);

    /** Case-insensitive nom uniqueness. */
    boolean existsByNomIgnoreCase(String nom);
    boolean existsByNomIgnoreCaseAndIdNot(String nom, Long id);
}
