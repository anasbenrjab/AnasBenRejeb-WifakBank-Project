package tn.esprit.wifakbankproject.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "USER_ROLES",
       uniqueConstraints = @UniqueConstraint(columnNames = {"USER_ID", "ROLE_ID"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_roles_seq")
    @SequenceGenerator(name = "user_roles_seq", sequenceName = "USER_ROLES_SEQ", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "USER_ID", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ROLE_ID", nullable = false)
    private Role role;
}
