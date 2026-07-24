package tn.esprit.wifakbankproject.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.wifakbankproject.entity.User;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String login;
    private String nom;
    private String prenom;
    private String email;
    private User.AuthType authType;
    private User.Status status;
    private DepartmentDto department;
    private Long subDepartmentId;
    private List<RoleDto> roles;
    private Long roleId;
    // Only used for LOCAL user creation/update
    private String password;
}
