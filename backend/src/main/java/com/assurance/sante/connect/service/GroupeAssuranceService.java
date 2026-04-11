package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.GroupeAssurance;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.GroupeAssuranceRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GroupeAssuranceService {

    private final GroupeAssuranceRepository repository;
    private final AssureRepository assureRepository;
    private final ObjectMapper objectMapper;

    public List<GroupeAssurance> getAll() {
        return repository.findAll();
    }

    public GroupeAssurance getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé : " + id));
    }

    @Transactional
    public GroupeAssurance create(Map<String, Object> data) {
        GroupeAssurance g = buildFromMap(new GroupeAssurance(), data);
        g = repository.save(g);
        syncAssures(g);
        return g;
    }

    @Transactional
    public GroupeAssurance update(Long id, Map<String, Object> data) {
        GroupeAssurance g = getById(id);
        buildFromMap(g, data);
        g = repository.save(g);
        syncAssures(g);
        return g;
    }

    @Transactional
    public void delete(Long id) {
        GroupeAssurance g = getById(id);
        // Supprimer les assurés liés au groupe
        assureRepository.deleteByNumeroStartingWith("GRP-" + id + "-");
        repository.delete(g);
    }

    // ─── Synchronise les assurés dans la table assures ───────────────────────────
    private void syncAssures(GroupeAssurance groupe) {
        String json = groupe.getEmployesDetail();
        if (json == null || json.isBlank()) return;

        String prefix = "GRP-" + groupe.getId() + "-";

        // Supprimer les anciens assurés de ce groupe pour repartir proprement
        assureRepository.deleteByNumeroStartingWith(prefix);

        try {
            List<Map<String, Object>> membres = objectMapper.readValue(
                json, new TypeReference<List<Map<String, Object>>>() {});

            int i = 1;
            for (Map<String, Object> m : membres) {
                String nomComplet = str(m, "nom");
                if (nomComplet.isEmpty()) { i++; continue; }

                // Découper "Prénom NOM" : premier mot = prénom, reste = nom
                String prenom, nom;
                int spaceIdx = nomComplet.indexOf(' ');
                if (spaceIdx > 0) {
                    prenom = nomComplet.substring(0, spaceIdx).trim();
                    nom    = nomComplet.substring(spaceIdx).trim();
                } else {
                    prenom = nomComplet;
                    nom    = nomComplet;
                }

                // Numéro unique : pièce d'identité si disponible, sinon GRP-{id}-{i}
                String piece   = str(m, "pieceIdentite");
                String numero  = piece.isEmpty() ? prefix + i : "GRP-" + piece;

                // Eviter les doublons si deux membres ont la même pièce
                if (assureRepository.findByNumero(numero).isPresent()) {
                    numero = prefix + i;
                }

                Assure assure = Assure.builder()
                    .numero(numero)
                    .nom(nom)
                    .prenom(prenom)
                    .telephone(str(m, "telephone"))
                    .email(str(m, "email"))
                    .statut(Assure.AssureStatut.ACTIF)
                    .type(Assure.AssureType.GROUPE)
                    .adresse(str(m, "lien"))        // lien avec l'adhérent principal
                    .dateDebut(str(m, "dateAdhesion").isEmpty() ? groupe.getDebut() : str(m, "dateAdhesion"))
                    .secteur(groupe.getEntreprise()) // entreprise = secteur d'appartenance
                    .prime(groupe.getPrime())
                    .build();

                assureRepository.save(assure);
                i++;
            }
        } catch (Exception e) {
            // Ne pas faire échouer la sauvegarde du groupe si la synchro plante
            System.err.println("Erreur sync assurés groupe " + groupe.getId() + ": " + e.getMessage());
        }
    }

    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? "" : v.toString().trim();
    }

    private GroupeAssurance buildFromMap(GroupeAssurance g, Map<String, Object> data) {
        if (data.containsKey("entreprise"))     g.setEntreprise((String) data.get("entreprise"));
        if (data.containsKey("secteur"))        g.setSecteur((String) data.get("secteur"));
        if (data.containsKey("debut"))          g.setDebut((String) data.get("debut"));
        if (data.containsKey("dureeGarantie"))  g.setDureeGarantie((String) data.get("dureeGarantie"));
        if (data.containsKey("prime"))          g.setPrime((String) data.get("prime"));
        if (data.containsKey("primeNette"))     g.setPrimeNette((String) data.get("primeNette"));
        if (data.containsKey("taxes"))          g.setTaxes((String) data.get("taxes"));
        if (data.containsKey("employes")) {
            Object v = data.get("employes");
            g.setEmployes(v instanceof Integer ? (Integer) v : Integer.parseInt(v.toString()));
        }
        if (data.containsKey("assures")) {
            Object v = data.get("assures");
            g.setAssures(v instanceof Integer ? (Integer) v : Integer.parseInt(v.toString()));
        }
        if (data.containsKey("echeanceAuto")) {
            Object v = data.get("echeanceAuto");
            g.setEcheanceAuto(v instanceof Boolean ? (Boolean) v : Boolean.parseBoolean(v.toString()));
        }
        if (data.containsKey("statut")) {
            try { g.setStatut(GroupeAssurance.StatutContrat.valueOf(
                    data.get("statut").toString().toUpperCase())); } catch (Exception ignored) {}
        }
        // Accepter les deux clés : "employesDetail" (nouveau) et "membresDetail" (alias)
        Object detail = data.containsKey("employesDetail") ? data.get("employesDetail")
                      : data.containsKey("membresDetail")  ? data.get("membresDetail")
                      : null;
        if (detail != null) {
            try {
                g.setEmployesDetail(objectMapper.writeValueAsString(detail));
            } catch (JsonProcessingException ignored) {}
        }
        return g;
    }
}
