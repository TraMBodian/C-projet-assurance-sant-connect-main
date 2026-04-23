package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.FamilleAssurance;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.FamilleAssuranceRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FamilleAssuranceService {

    private static final Logger log = LoggerFactory.getLogger(FamilleAssuranceService.class);

    private final FamilleAssuranceRepository repository;
    private final AssureRepository            assureRepository;
    private final ObjectMapper                objectMapper;

    public List<FamilleAssurance> getAll() {
        return repository.findAll();
    }

    public FamilleAssurance getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Famille non trouvée : " + id));
    }

    @Transactional
    public FamilleAssurance create(Map<String, Object> data) {
        FamilleAssurance f = buildFromMap(new FamilleAssurance(), data);
        f = repository.save(f);
        syncAssures(f);
        return f;
    }

    @Transactional
    public FamilleAssurance update(Long id, Map<String, Object> data) {
        FamilleAssurance f = getById(id);
        buildFromMap(f, data);
        f = repository.save(f);
        syncAssures(f);
        return f;
    }

    @Transactional
    public void delete(Long id) {
        FamilleAssurance f = getById(id);
        assureRepository.deleteByNumeroStartingWith("FAM-" + id + "-");
        repository.delete(f);
    }

    // ─── Sync assurés (principal + bénéficiaires) ─────────────────────────────
    private void syncAssures(FamilleAssurance famille) {
        String prefix = "FAM-" + famille.getId() + "-";
        assureRepository.deleteByNumeroStartingWith(prefix);

        // 1. Assuré principal
        String nomComplet = famille.getPrincipal() != null ? famille.getPrincipal().trim() : "";
        if (!nomComplet.isEmpty()) {
            String prenom, nom;
            int sp = nomComplet.indexOf(' ');
            if (sp > 0) { prenom = nomComplet.substring(0, sp).trim(); nom = nomComplet.substring(sp).trim(); }
            else         { prenom = nomComplet; nom = nomComplet; }

            String cni = famille.getPieceIdentitePrincipal();
            String numero = (cni != null && !cni.isBlank()) ? "FAM-" + cni : prefix + "0";
            // Fallback si collision avec un autre assuré hors de cette famille
            if (assureRepository.findByNumero(numero).isPresent()) {
                numero = prefix + "0";
            }

            Assure principal = Assure.builder()
                .numero(numero)
                .nom(nom)
                .prenom(prenom)
                .telephone(famille.getTelephone() != null ? famille.getTelephone() : "")
                .statut(Assure.AssureStatut.ACTIF)
                .type(Assure.AssureType.FAMILLE)
                .dateDebut(famille.getDateDebut())
                .prime(famille.getPrime())
                .lien("Principal")
                .dateNaissance(famille.getDateNaissancePrincipal())
                .pieceIdentite(famille.getPieceIdentitePrincipal())
                .garantie("Standard")
                .build();

            assureRepository.save(principal);
        }

        // 2. Bénéficiaires depuis beneficiairesDetail (JSON)
        String json = famille.getBeneficiairesDetail();
        if (json == null || json.isBlank()) return;

        try {
            List<Map<String, Object>> bens = objectMapper.readValue(
                json, new TypeReference<List<Map<String, Object>>>() {});

            int i = 1;
            for (Map<String, Object> b : bens) {
                String nomBen = str(b, "nom");
                if (nomBen.isEmpty()) { i++; continue; }

                String prenomB, nomB;
                int sp = nomBen.indexOf(' ');
                if (sp > 0) { prenomB = nomBen.substring(0, sp).trim(); nomB = nomBen.substring(sp).trim(); }
                else         { prenomB = nomBen; nomB = nomBen; }

                String cniBen   = str(b, "pieceIdentite");
                String numeroBen = cniBen.isEmpty() ? prefix + i : "FAM-" + cniBen;
                if (assureRepository.findByNumero(numeroBen).isPresent()) numeroBen = prefix + i;

                String lienVal = str(b, "lien");
                if (lienVal.isEmpty()) lienVal = str(b, "relation");
                if (lienVal.isEmpty()) lienVal = "Autre";

                Assure ben = Assure.builder()
                    .numero(numeroBen)
                    .nom(nomB)
                    .prenom(prenomB)
                    .telephone(str(b, "telephone"))
                    .email(str(b, "email"))
                    .statut(Assure.AssureStatut.ACTIF)
                    .type(Assure.AssureType.FAMILLE)
                    .dateDebut(str(b, "dateAdhesion").isEmpty() ? famille.getDateDebut() : str(b, "dateAdhesion"))
                    .prime(famille.getPrime())
                    .lien(lienVal)
                    .dateNaissance(str(b, "dateNaissance"))
                    .sexe(str(b, "sexe"))
                    .pieceIdentite(cniBen.isEmpty() ? null : cniBen)
                    .dateAdhesion(str(b, "dateAdhesion"))
                    .garantie("Standard")
                    .build();

                assureRepository.save(ben);
                i++;
            }
        } catch (Exception e) {
            log.error("Erreur sync assurés famille {}: {}", famille.getId(), e.getMessage());
        }
    }

    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? "" : v.toString().trim();
    }

    @SuppressWarnings("unchecked")
    private FamilleAssurance buildFromMap(FamilleAssurance f, Map<String, Object> data) {
        if (data.containsKey("principal"))             f.setPrincipal((String) data.get("principal"));
        if (data.containsKey("telephone"))             f.setTelephone((String) data.get("telephone"));
        if (data.containsKey("photo"))                 f.setPhoto((String) data.get("photo"));
        if (data.containsKey("dateDebut"))             f.setDateDebut((String) data.get("dateDebut"));
        if (data.containsKey("dureeGarantie"))         f.setDureeGarantie((String) data.get("dureeGarantie"));
        if (data.containsKey("prime"))                 f.setPrime((String) data.get("prime"));
        if (data.containsKey("primeNette"))            f.setPrimeNette((String) data.get("primeNette"));
        if (data.containsKey("taxes"))                 f.setTaxes((String) data.get("taxes"));
        if (data.containsKey("dateNaissancePrincipal")) f.setDateNaissancePrincipal((String) data.get("dateNaissancePrincipal"));
        if (data.containsKey("pieceIdentitePrincipal")) f.setPieceIdentitePrincipal((String) data.get("pieceIdentitePrincipal"));
        if (data.containsKey("echeanceAuto")) {
            Object v = data.get("echeanceAuto");
            f.setEcheanceAuto(v instanceof Boolean ? (Boolean) v : Boolean.parseBoolean(v.toString()));
        }
        if (data.containsKey("typePrincipal")) {
            String tp = data.get("typePrincipal").toString().toUpperCase();
            try { f.setTypePrincipal(FamilleAssurance.TypeAssure.valueOf(
                    tp.equals("ADULTE_AGE") ? "ADULTE_AGE" : "ADULTE")); } catch (Exception ignored) {}
        }
        if (data.containsKey("statut")) {
            try { f.setStatut(FamilleAssurance.StatutContrat.valueOf(
                    data.get("statut").toString().toUpperCase())); } catch (Exception ignored) {}
        }
        if (data.containsKey("beneficiaires")) {
            Object b = data.get("beneficiaires");
            if (b instanceof List) f.setBeneficiaires((List<String>) b);
        }
        // Stocker le détail JSON des bénéficiaires
        if (data.containsKey("beneficiairesDetail")) {
            Object bd = data.get("beneficiairesDetail");
            try { f.setBeneficiairesDetail(objectMapper.writeValueAsString(bd)); }
            catch (Exception ignored) {}
        }
        return f;
    }
}
