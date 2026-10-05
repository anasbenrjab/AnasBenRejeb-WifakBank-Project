package tn.esprit.wifakbankproject.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Soft-delete: run before first deployment of this change:
 *   ALTER TABLE DEPARTMENTS ADD (DELETED NUMBER(1) DEFAULT 0 NOT NULL);
 * Hibernate 6 maps Boolean → NUMBER(1) on Oracle via OracleDialect.
 */
@Entity
@Table(name = "DEPARTMENTS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "departments_seq")
    @SequenceGenerator(name = "departments_seq", sequenceName = "DEPARTMENTS_SEQ", allocationSize = 1)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 500)
    private String description;

    /**
     * Soft-delete flag. When true the department is hidden from all lists and pickers.
     * Sub-departments and users linked to this department are NOT affected.
     *
     * Oracle DDL (run before first deploy):
     *   ALTER TABLE DEPARTMENTS ADD (DELETED NUMBER(1) DEFAULT 0 NOT NULL);
     */
    @Column(name = "DELETED", nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
