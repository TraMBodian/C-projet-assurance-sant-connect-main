package com.assurance.sante.connect.logging;

import ch.qos.logback.classic.pattern.MessageConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;

import java.util.regex.Pattern;

/**
 * Masque les données médicales sensibles dans les logs (motif, diagnostic, médicament...).
 * Utilisé dans logback-spring.xml via <conversionRule>.
 */
public class MedicalDataMaskingConverter extends MessageConverter {

    private static final Pattern[] PATTERNS = {
        Pattern.compile("(\"motif\"\\s*:\\s*)\"[^\"]*\"", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(\"diagnostic\"\\s*:\\s*)\"[^\"]*\"", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(\"medicament\"\\s*:\\s*)\"[^\"]*\"", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(\"produitNom\"\\s*:\\s*)\"[^\"]*\"", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(\"motifAnnulation\"\\s*:\\s*)\"[^\"]*\"", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(\"posologie\"\\s*:\\s*)\"[^\"]*\"", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(password|mot_de_passe|mdp)(\"\\s*:\\s*)\"[^\"]*\"", Pattern.CASE_INSENSITIVE),
    };

    private static final String MASK = "\"[MASQUÉ]\"";

    @Override
    public String convert(ILoggingEvent event) {
        String message = event.getFormattedMessage();
        if (message == null) return "";
        for (Pattern p : PATTERNS) {
            message = p.matcher(message).replaceAll("$1" + MASK);
        }
        return message;
    }
}
