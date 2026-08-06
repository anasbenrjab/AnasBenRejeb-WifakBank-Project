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
public class UserApplicationRoleId implements Serializable {

    @Column(name = "USER_ID", nullable = false)
    private Long userId;

    @Column(name = "APPLICATION_ID", nullable = false)
    private Long applicationId;

    @Column(name = "ROLE_ID", nullable = false)
    private Long roleId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserApplicationRoleId that)) return false;
        return Objects.equals(userId, that.userId)
            && Objects.equals(applicationId, that.applicationId)
            && Objects.equals(roleId, that.roleId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, applicationId, roleId);
    }
}
