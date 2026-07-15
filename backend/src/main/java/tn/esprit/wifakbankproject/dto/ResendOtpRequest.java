package tn.esprit.wifakbankproject.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResendOtpRequest {

    @NotBlank(message = "Le login est obligatoire")
    private String login;
}
