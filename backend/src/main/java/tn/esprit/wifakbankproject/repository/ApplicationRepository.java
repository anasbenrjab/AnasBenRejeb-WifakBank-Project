package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.wifakbankproject.entity.Application;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // ── Soft-delete aware queries ──────────────────────────────────────────────
    // All list/lookup methods used by the admin API and dashboard must filter
    // deleted = false so soft-deleted apps never surface in responses.

    /** Admin list — all non-deleted apps regardless of status. */
    List<Application> findByDeletedFalse();

    /** Registry / dashboard — only ACTIVE, non-deleted apps. */
    List<Application> findByStatusAndDeletedFalse(Application.Status status);

    /** Lookup by code, non-deleted only (used by DataInitializer idempotency check). */
    Optional<Application> findByCodeAndDeletedFalse(String code);

    // ── Uniqueness helpers (operate across ALL rows including deleted) ─────────
    // We keep the unique constraint on CODE (Option A from the spec).
    // These two methods are used by AdminService duplicate-code checks and still
    // need to look at ALL rows so a soft-deleted code blocks reuse of the same code.
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, Long id);

    // Nom uniqueness — case-insensitive (Spring Data derives the query correctly).
    boolean existsByNomIgnoreCase(String nom);
    boolean existsByNomIgnoreCaseAndIdNot(String nom, Long id);

    // URL uniqueness — case-insensitive.
    // NOTE: Spring Data cannot derive existsByUrlIgnoreCase reliably on all JPA
    // providers because 'Url' is treated as a multi-part word (U-r-l).
    // Using @Query to be explicit and provider-independent.
    @org.springframework.data.jpa.repository.Query(
        "SELECT CASE WHEN COUNT(a) > 0 THEN TRUE ELSE FALSE END " +
        "FROM Application a WHERE LOWER(a.url) = LOWER(:url)")
    boolean existsByUrlIgnoreCase(@org.springframework.data.repository.query.Param("url") String url);

    @org.springframework.data.jpa.repository.Query(
        "SELECT CASE WHEN COUNT(a) > 0 THEN TRUE ELSE FALSE END " +
        "FROM Application a WHERE LOWER(a.url) = LOWER(:url) AND a.id <> :id")
    boolean existsByUrlIgnoreCaseAndIdNot(
        @org.springframework.data.repository.query.Param("url") String url,
        @org.springframework.data.repository.query.Param("id")  Long id);

    // ── Legacy: kept for backward compat with DataInitializer which needs to
    //    find seeded apps by code (including ones seeded before soft-delete existed).
    //    DataInitializer is idempotent — if the row exists (deleted or not) it skips.
    Optional<Application> findByCode(String code);
}
