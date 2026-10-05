package tn.esprit.wifakbankproject.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Soft-delete: run before first deployment of this change:
 *   ALTER TABLE SUB_DEPARTMENTS ADD (DELETED NUMBER(1) DEFAULT 0 NOT NULL);
 * Hibernate 6 maps Boolean → NUMBER(1) on Oracle via OracleDialect.
 */
@Entity
@Table(name = "SUB_DEPARTMENTS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubDepartment {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sub_departments_seq")
    @SequenceGenerator(name = "sub_departments_seq", sequenceName = "SUB_DEPARTMENTS_SEQ", allocationSize = 1)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    /**
     * Soft-delete flag. When true the sub-department is hidden from all lists and pickers.
     * Users linked to this sub-department are NOT affected.
     *
     * Oracle DDL (run before first deploy):
     *   ALTER TABLE SUB_DEPARTMENTS ADD (DELETED NUMBER(1) DEFAULT 0 NOT NULL);
     */
    @Column(name = "DELETED", nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
