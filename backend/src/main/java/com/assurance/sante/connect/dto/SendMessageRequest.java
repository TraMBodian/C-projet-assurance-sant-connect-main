package com.assurance.sante.connect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Requête d'envoi de message.
 *
 * IMPORTANT (anti-usurpation) : aucun {@code senderId} n'est accepté ici.
 * L'expéditeur est TOUJOURS déterminé côté serveur à partir de l'utilisateur
 * authentifié — jamais à partir d'une donnée fournie par le client.
 */
@Data
public class SendMessageRequest {

    @NotNull(message = "Destinataire requis")
    private Long receiverId;

    @NotBlank(message = "Message requis")
    @Size(max = 2000, message = "Message trop long (max 2000 caractères)")
    private String content;
}
