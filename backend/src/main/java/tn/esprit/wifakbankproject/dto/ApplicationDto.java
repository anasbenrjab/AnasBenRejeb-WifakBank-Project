package tn.esprit.wifakbankproject.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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

    @NotBlank(message = "Le code est obligatoire.")
    @Size(max = 50, message = "Le code ne peut pas dépasser 50 caractères.")
    private String code;

    @NotBlank(message = "Le nom est obligatoire.")
    @Size(max = 200, message = "Le nom ne peut pas dépasser 200 caractères.")
    private String nom;

    private String description;

    @NotBlank(message = "L'URL est obligatoire.")
    @Size(max = 500, message = "L'URL ne peut pas dépasser 500 caractères.")
    private String url;

    private String icon;
    private String status;
    private Long departmentId;
    private String departmentName;
    private List<Long> roleIds;
    private List<RoleDto> roles;
    // ── Phase 2 fields ────────────────────────────────────────────────────
    /** IFRAME | NEW_TAB | REDIRECT — matches Application.LaunchMode enum name */
    private String  launchMode;
    /** Optional grouping label for the dashboard catalog. */
    private String  category;
    /** Sort order within a category (0 = default). */
    private Integer displayOrder;
    /** BOOTSTRAP_ICON | URL | UPLOAD — matches Application.IconType enum name */
    private String  iconType;
}
