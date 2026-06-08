package com.assurance.sante.connect.dto;

import com.assurance.sante.connect.entity.User;
import lombok.Builder;
import lombok.Data;

/**
 * Vue minimale d'un utilisateur pour le sélecteur de conversation.
 * N'expose volontairement PAS l'email ni d'informations internes
 * (minimisation des données — RGPD).
 */
@Data
@Builder
public class ChatUserDto {
    private Long id;
    private String fullName;
    private String role;

    public static ChatUserDto fromEntity(User u) {
        return ChatUserDto.builder()
            .id(u.getId())
            .fullName(u.getFullName())
            .role(u.getRole() != null ? u.getRole().name() : null)
            .build();
    }
}
