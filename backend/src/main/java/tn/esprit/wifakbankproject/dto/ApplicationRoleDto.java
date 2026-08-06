package tn.esprit.wifakbankproject.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationRoleDto {
    private Long applicationId;
    private String applicationCode;
    private String applicationNom;
    private Long roleId;
    private String roleNom;
    private String roleDescription;
}
