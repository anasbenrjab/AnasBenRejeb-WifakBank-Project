package tn.esprit.wifakbankproject.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationDto {
    private Long id;
    private String code;
    private String nom;
    private String description;
    private String url;
    private String icon;
    private String status;
    private Long departmentId;
    private String departmentName;
    private List<Long> roleIds;
    private List<RoleDto> roles;
}
