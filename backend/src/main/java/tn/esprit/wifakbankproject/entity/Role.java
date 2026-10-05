package tn.esprit.wifakbankproject.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Soft-delete: run before first deployment of this change:
 *   ALTER TABLE ROLES ADD (DELETED NUMBER(1) DEFAULT 0 NOT NULL);
 * Hibernate 6 maps Boolean → NUMBER(1) on Oracle via OracleDialect.
 */
@Entity
@Table(name = "ROLES")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "roles_seq")
    @SequenceGenerator(name = "roles_seq", sequenceName = "ROLES_SEQ", allocationSize = 1)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(length = 500)
    private String description;

    /**
     * Soft-delete flag. When true the role is hidden from all lists and pickers.
     * APPLICATION_ROLES and USER_APPLICATION_ROLES rows are NOT affected.
     *
     * Oracle DDL (run before first deploy):
     *   ALTER TABLE ROLES ADD (DELETED NUMBER(1) DEFAULT 0 NOT NULL);
     */
    @Column(name = "DELETED", nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
