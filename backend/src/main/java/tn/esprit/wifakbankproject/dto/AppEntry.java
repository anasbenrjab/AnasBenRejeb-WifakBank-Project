package tn.esprit.wifakbankproject.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AppEntry {
    private Long   id;
    private String code;
    private String nom;
    private String description;
    private String url;
    private String icon;
}
