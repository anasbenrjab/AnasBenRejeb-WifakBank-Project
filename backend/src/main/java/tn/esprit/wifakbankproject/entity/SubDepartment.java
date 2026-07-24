package tn.esprit.wifakbankproject.entity;

import jakarta.persistence.*;
import lombok.*;

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
}
