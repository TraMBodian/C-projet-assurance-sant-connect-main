package com.assurance.sante.connect.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Email requis")
    @Email(message = "Format email invalide")
    private String email;

    @NotBlank(message = "Mot de passe requis")
    private String password;
}
