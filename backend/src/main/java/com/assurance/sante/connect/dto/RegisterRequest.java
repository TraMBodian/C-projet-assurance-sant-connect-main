package com.assurance.sante.connect.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "Email requis")
    @Email(message = "Format email invalide")
    private String email;

    @NotBlank(message = "Mot de passe requis")
    @Size(min = 8, message = "Mot de passe : 8 caractères minimum")
    private String password;

    @NotBlank(message = "Nom complet requis")
    private String fullName;

    @NotBlank(message = "Rôle requis")
    private String role;

    private String organization;
    private String telephone;
    private String adresse;
}
