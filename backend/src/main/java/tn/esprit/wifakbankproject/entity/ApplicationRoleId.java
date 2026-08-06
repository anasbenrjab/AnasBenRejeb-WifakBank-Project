package tn.esprit.wifakbankproject.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ApplicationRoleId implements Serializable {

    @Column(name = "APPLICATION_ID", nullable = false)
    private Long applicationId;

    @Column(name = "ROLE_ID", nullable = false)
    private Long roleId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ApplicationRoleId that)) return false;
        return Objects.equals(applicationId, that.applicationId)
            && Objects.equals(roleId, that.roleId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(applicationId, roleId);
    }
}
