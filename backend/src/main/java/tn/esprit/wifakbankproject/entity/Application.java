package tn.esprit.wifakbankproject.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * IMPORTANT — Oracle + ddl-auto=update constraint:
 *
 * Hibernate CANNOT add a NOT NULL column to a populated Oracle table.
 * Oracle throws ORA-01758 and Hibernate only logs a WARN (does not abort).
 * The app then fails later with ORA-00904 when querying the missing column.
 *
 * When adding a new mandatory (NOT NULL) column to any existing entity:
 *
 *   Option A — make the field nullable in the entity (@Column(nullable=false) → true),
 *              then backfill + add the NOT NULL constraint separately once data is clean.
 *
 *   Option B — pre-create the column in Oracle WITH a DEFAULT before starting the app:
 *                ALTER TABLE <TABLE> ADD (<COL> <TYPE> DEFAULT <value> NOT NULL);
 *              Hibernate ddl-auto=update will then detect the column already exists
 *              and skip it cleanly.
 *
 * NEVER rely on ddl-auto=update to add NOT NULL columns to a populated Oracle table.
 *
 * Applied for Phase 1 (LAUNCH_MODE, DISPLAY_ORDER):
 *   ALTER TABLE APPLICATIONS ADD (LAUNCH_MODE  VARCHAR2(20 CHAR) DEFAULT 'IFRAME' NOT NULL);
 *   ALTER TABLE APPLICATIONS ADD (DISPLAY_ORDER NUMBER(10)        DEFAULT 0        NOT NULL);
 */
@Entity
@Table(name = "APPLICATIONS")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "apps_seq")
    @SequenceGenerator(name = "apps_seq", sequenceName = "APPLICATIONS_SEQ", allocationSize = 1)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String nom;

    @Column(length = 500)
    private String description;

    @Column(length = 500)
    private String url;

    /** Material icon name (for Angular frontend) */
    @Column(length = 100)
    private String icon;

    @Column(name = "AUTH_TYPE", length = 10)
    private String authType;

    /**
     * How the frontend should open this application.
     * Phase 1: stored in DB, not yet exposed in AppEntry (Phase 2).
     */
    @Column(name = "LAUNCH_MODE", length = 20, nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private LaunchMode launchMode = LaunchMode.IFRAME;

    /**
     * Optional grouping label shown in the dashboard catalog.
     * Phase 1: stored in DB, not yet exposed in AppEntry (Phase 2).
     */
    @Column(name = "CATEGORY", length = 100)
    private String category;

    /**
     * Sort order within a category on the dashboard.
     * Phase 1: stored in DB, not yet exposed in AppEntry (Phase 2).
     */
    @Column(name = "DISPLAY_ORDER", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    public enum Status { ACTIVE, INACTIVE }

    public enum LaunchMode { IFRAME, NEW_TAB, REDIRECT }
}
