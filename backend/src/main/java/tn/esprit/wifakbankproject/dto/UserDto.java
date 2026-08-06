package tn.esprit.wifakbankproject.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.wifakbankproject.entity.User;
import tn.esprit.wifakbankproject.entity.UserStatus;

import java.time.LocalDateTime;
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
    private UserStatus status;
    private DepartmentDto department;
    private Long subDepartmentId;
    private SubDepartmentDto subDepartment;
    private List<UserApplicationRoleDto> applicationRoles;
    private Long applicationId;
    private Long roleId;
    private List<Long> applicationRoleApplicationIds;
    private List<Long> applicationRoleRoleIds;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    // Only used for LOCAL user creation/update
    private String password;
}
