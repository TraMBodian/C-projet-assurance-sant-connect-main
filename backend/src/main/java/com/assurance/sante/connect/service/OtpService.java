package com.assurance.sante.connect.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final JavaMailSender mailSender;

    private record OtpEntry(String code, LocalDateTime expiresAt) {
        boolean isExpired() { return LocalDateTime.now().isAfter(expiresAt); }
    }

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final SecureRandom rng = new SecureRandom();

    public void sendOtp(String email) {
        String code = String.format("%06d", rng.nextInt(1_000_000));
        store.put(email.toLowerCase(), new OtpEntry(code, LocalDateTime.now().plusMinutes(10)));
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject("🔐 Code de vérification — Papy Services Assurances");
            helper.setText(buildHtml(code), true);
            mailSender.send(mime);
            log.info("[OTP] Code envoyé à {}", email);
        } catch (Exception e) {
            log.warn("[OTP] Email non configuré — code pour {} : {}", email, code);
        }
    }

    /**
     * Vérifie le code et l'invalide immédiatement s'il est correct.
     * Un code valide ne peut être utilisé qu'une seule fois.
     */
    public boolean verifyOtp(String email, String code) {
        OtpEntry entry = store.get(email.toLowerCase());
        if (entry == null || entry.isExpired()) return false;
        boolean valid = entry.code().equals(code.trim());
        if (valid) store.remove(email.toLowerCase());
        return valid;
    }

    public void invalidate(String email) {
        store.remove(email.toLowerCase());
    }

    // ─── Template HTML ────────────────────────────────────────────────────────

    private String buildHtml(String code) {
        // Chaque chiffre dans sa propre case
        StringBuilder digits = new StringBuilder();
        for (char c : code.toCharArray()) {
            digits.append("""
                <td style="padding: 0 4px;">
                  <div style="
                    width: 48px; height: 56px;
                    background: #f0f4ff;
                    border: 2px solid #c7d7f9;
                    border-radius: 10px;
                    font-size: 28px;
                    font-weight: 800;
                    color: #1B5299;
                    text-align: center;
                    line-height: 56px;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 0;
                  ">%c</div>
                </td>
                """.formatted(c));
        }

        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>Code de vérification</title>
            </head>
            <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

              <!-- Wrapper -->
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
                <tr><td align="center">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px;">

                    <!-- Header gradient -->
                    <tr>
                      <td style="
                        background: linear-gradient(135deg, #1e3c72 0%%, #2a5298 100%%);
                        border-radius: 16px 16px 0 0;
                        padding: 32px 40px 28px;
                        text-align: center;
                      ">
                        <!-- Logo texte -->
                        <div style="
                          display: inline-block;
                          background: rgba(255,255,255,0.15);
                          border-radius: 12px;
                          padding: 8px 20px;
                          margin-bottom: 16px;
                        ">
                          <span style="color:#ffffff;font-size:14px;font-weight:700;letter-spacing:1px;">
                            PSA
                          </span>
                        </div>
                        <div style="color:#ffffff;font-size:22px;font-weight:800;margin-bottom:4px;">
                          Papy Services Assurances
                        </div>
                        <div style="color:rgba(255,255,255,0.75);font-size:13px;">
                          Votre plateforme d'assurance santé
                        </div>
                      </td>
                    </tr>

                    <!-- Corps blanc -->
                    <tr>
                      <td style="
                        background:#ffffff;
                        padding: 40px 40px 32px;
                        border-left: 1px solid #e2e8f0;
                        border-right: 1px solid #e2e8f0;
                      ">
                        <!-- Icône cadenas -->
                        <div style="text-align:center;margin-bottom:24px;">
                          <div style="
                            display:inline-block;
                            width:64px;height:64px;
                            background:#eef2ff;
                            border-radius:50%%;
                            line-height:64px;
                            font-size:28px;
                          ">🔐</div>
                        </div>

                        <h1 style="
                          margin:0 0 8px;
                          font-size:22px;
                          font-weight:800;
                          color:#0f172a;
                          text-align:center;
                        ">Code de vérification</h1>

                        <p style="
                          margin:0 0 28px;
                          font-size:14px;
                          color:#64748b;
                          text-align:center;
                          line-height:1.6;
                        ">
                          Utilisez ce code pour réinitialiser votre mot de passe.<br/>
                          Il est valable pendant <strong style="color:#1B5299;">10 minutes</strong>.
                        </p>

                        <!-- Cases OTP -->
                        <div style="text-align:center;margin-bottom:28px;">
                          <table cellpadding="0" cellspacing="0" style="display:inline-table;">
                            <tr>%s</tr>
                          </table>
                        </div>

                        <!-- Divider -->
                        <div style="border-top:1px solid #e2e8f0;margin:28px 0;"></div>

                        <!-- Avertissement sécurité -->
                        <table cellpadding="0" cellspacing="0" width="100%%">
                          <tr>
                            <td style="
                              background:#fff7ed;
                              border:1px solid #fed7aa;
                              border-radius:10px;
                              padding:14px 16px;
                            ">
                              <table cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="width:20px;vertical-align:top;padding-top:1px;">
                                    <span style="font-size:14px;">⚠️</span>
                                  </td>
                                  <td style="padding-left:8px;">
                                    <span style="font-size:13px;color:#92400e;line-height:1.5;">
                                      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                                      Votre mot de passe reste inchangé.
                                    </span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="
                        background:#f8fafc;
                        border: 1px solid #e2e8f0;
                        border-top: none;
                        border-radius: 0 0 16px 16px;
                        padding: 24px 40px;
                        text-align: center;
                      ">
                        <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
                          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                        </p>
                        <p style="margin:0;font-size:12px;color:#94a3b8;">
                          © %d Papy Services Assurances · Rufisque Ouest, Cité Poste, Lot N°67
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>

            </body>
            </html>
            """.formatted(digits.toString(), java.time.Year.now().getValue());
    }
}
