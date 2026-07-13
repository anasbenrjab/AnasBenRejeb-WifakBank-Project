package tn.esprit.wifakbankproject.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    public enum Status { ACTIVE, INACTIVE }
}
