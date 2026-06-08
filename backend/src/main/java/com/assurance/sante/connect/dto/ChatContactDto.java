package com.assurance.sante.connect.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Contact d'une conversation : utilisateur avec qui l'appelant a déjà échangé.
 * N'expose pas l'email (minimisation des données — RGPD).
 */
@Data
@Builder
public class ChatContactDto {
    private Long id;
    private String fullName;
    private String role;
    private String lastMessage;
    private String lastTime;
    private long unread;
}
