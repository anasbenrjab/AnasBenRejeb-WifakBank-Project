package tn.esprit.wifakbankproject.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AppEntry {
    // ── Original 6 fields — order must not change ─────────────────────────
    private Long   id;
    private String code;
    private String nom;
    private String description;
    private String url;
    private String icon;

    // ── Phase 2 fields — appended at end to preserve positional compat ────
    /** How the frontend should open this app: IFRAME | NEW_TAB | REDIRECT */
    private String  launchMode;
    /** Optional grouping label for the dashboard catalog. */
    private String  category;
    /** Sort order within a category (0 = default). */
    private Integer displayOrder;
    /** How to render the icon value: BOOTSTRAP_ICON | URL | UPLOAD */
    private String  iconType;
}
