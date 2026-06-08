# AUDIT PROGRESS — Assurance Santé Connect
## Mise en production · Suivi Sprint par Sprint

**Date de début :** 2026-05-27  
**Architecte :** Claude Sonnet 4.6  
**Référence audit :** Rapport d'audit espace CLIENT v1.0

---

## SPRINT 1 — Sécurité Critique & Upload Fonctionnel

### Statut global : 🔄 EN COURS

---

### S1.1 — Fix IDOR : Contrôle d'accès sur les endpoints GET /{id}

| Fichier | Statut | Vulnérabilités corrigées |
|---------|--------|--------------------------|
| `AssureController.java` | ✅ TERMINÉ | GET /{id} · PUT /{id} · PATCH /{id}/photo |
| `ConsultationController.java` | ✅ TERMINÉ | GET /{id} |
| `PrescriptionController.java` | ✅ TERMINÉ | GET /{id} |
| `SinistreController.java` | ✅ TERMINÉ | GET /{id} · POST (rate limiting 5/heure) |
| `PrestationController.java` | ✅ TERMINÉ | GET /{id} · GET /{prestationId}/lignes |
| `DocumentController.java` | ✅ TERMINÉ | GET /{id}/download · GET /assure/{id} · GET /consultation/{id} · POST /client-upload |

---

### Détail des corrections effectuées

#### ✅ Build Maven backend — 2026-05-27
`docker compose build backend` → **succès en 38s**, zéro erreur de compilation.
Confirmation que toutes les corrections IDOR compilent correctement sous Maven (les erreurs IDE sont des faux positifs Lombok).

---

#### ✅ AssureController.java — 2026-05-27

**AVANT (3 vulnérabilités IDOR) :**
- `GET /{id}` : Aucun paramètre `Authentication`, aucune vérification. N'importe quel CLIENT pouvait accéder aux données de tout assuré en changeant l'ID dans l'URL.
- `PUT /{id}` : `@PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")` sans vérification que le CLIENT modifie son propre dossier. Un CLIENT (assureId=5) pouvait modifier le dossier d'un autre (assureId=3).
- `PATCH /{id}/photo` : Zéro restriction — ni `@PreAuthorize`, ni `Authentication`. N'importe qui pouvait changer la photo de n'importe quel assuré.

**APRÈS (fixes appliqués) :**
- `GET /{id}` : Si CLIENT → vérification `isFamilyMemberOrSelf()` (propre id OU même familleId). Si ADMIN/PRESTATAIRE → passe directement. Retourne 403 avec message clair si accès refusé.
- `PUT /{id}` : Si CLIENT → vérification stricte `myAssure.getId().equals(id)`. Un CLIENT ne peut modifier que son propre dossier.
- `PATCH /{id}/photo` : Ajout `Authentication auth` + même vérification stricte que PUT.
- Ajout de 2 méthodes privées réutilisables : `isClient(auth)` et `isFamilyMemberOrSelf(myAssure, targetId)`.

**Impact sur l'existant :**
- `GET /api/assures` : Non touché — déjà filtré correctement par rôle.
- `GET /api/assures/mes-beneficiaires` : Non touché — déjà sécurisé par logique métier.
- `POST /api/assures` : Non touché — déjà `@PreAuthorize("hasRole('ADMIN')")`.
- `DELETE /api/assures/{id}` : Non touché — déjà `@PreAuthorize("hasRole('ADMIN')")`.
- ADMIN et PRESTATAIRE : Aucun impact — le check `isClient()` court-circuite si rôle différent.

---

### S1.2 — Endpoint client-upload documents

| Fichier | Statut |
|---------|--------|
| `DocumentController.java` | ✅ TERMINÉ (intégré dans S1.1) |

---

### S1.3 — Upload sinistre fonctionnel

| Fichier | Statut |
|---------|--------|
| `apiClient.ts` | ✅ TERMINÉ — `clientUploadDocument()` ajouté |
| `SinistresPage.tsx` | ✅ TERMINÉ — upload réel avant création sinistre, fausse géoloc supprimée |
| `SinistreDetailsPage.tsx` | ✅ TERMINÉ — données réelles, documents via API |

#### Détail des corrections — SinistresPage.tsx
**AVANT :**
- `photo` capturé dans le state mais **jamais envoyé** au backend
- `DataService.createSinistre()` appelé directement sans uploader le fichier
- Bloc géolocalisation fictif affiché (MapPin + texte "position utilisée")

**APRÈS :**
- Si `photo !== null` → `apiClient.clientUploadDocument(photo, { description })` appelé en premier
  - Stocke le fichier sur le serveur, lié à l'assuré connecté (auto-résolu)
  - En cas d'échec upload : toast avertissement + déclaration soumise quand même (résilience)
- `DataService.createSinistre()` appelé après l'upload
- Bloc MapPin supprimé (n'était qu'affichage, aucune vraie géoloc implémentée)

#### Détail des corrections — SinistreDetailsPage.tsx
**AVANT :**
- `sinistre.assure` affiché directement (objet → "[object Object]")
- `sinistre.date` → champ inexistant (devrait être `dateSinistre`)
- `sinistre.montantReclame` / `sinistre.montantValide` → mauvais noms de champs
- Documents : deux entrées hardcodées "Facture.pdf" et "Justificatif.pdf"

**APRÈS :**
- `assureNom` calculé depuis `sinistre.assure.nom + prenom`
- `dateFormatted` via `sinistre.dateSinistre`
- Montants via `montantReclamation` / `montantAccorde` avec formatage FR
- Documents chargés depuis `apiClient.getDocumentsByAssure(sinistre.assure.id)`
- Lien de téléchargement réel via `apiClient.getDocumentDownloadUrl(doc.id)`
- État vide si aucun document (remplace les faux placeholders)

---

### S1.4 — Rate limiting POST /api/sinistres

| Fichier | Statut |
|---------|--------|
| `SinistreController.java` | ✅ TERMINÉ (intégré dans S1.1) |

---

## SPRINT 2 — Fonctionnalités Manquantes Clés

**Statut :** ✅ TERMINÉ — 2026-05-27

### S2.1 — Dashboard : suppression des données hardcodées
| Élément | Statut |
|---------|--------|
| Tendances KPI admin (`+12%`, `+5%`, `+8%`) | ✅ TERMINÉ — propriétés `trend` supprimées des 3 KPI |
| Date de validité carte `31/12/2025` | ✅ TERMINÉ — remplacée par statut dynamique `clientStats?.policesActives` |
| "Documents manquants : 2 requis" hardcodé | ✅ TERMINÉ — entrée supprimée de `ActionPriorities` |

### S2.2 — RemboursementsPage : taux de couverture
| Élément | Statut |
|---------|--------|
| KPI taux couverture = accordé / réclamé | ✅ TERMINÉ — 4ème KPI card ajoutée avec calcul dynamique |

### S2.3 — MonDossierPage CLIENT (nouvelle page)
| Élément | Statut |
|---------|--------|
| `MonDossierPage.tsx` | ✅ TERMINÉ — 4 onglets : Polices, Prescriptions, Prestations, Documents |
| Route `/mon-dossier` dans App.tsx | ✅ TERMINÉ — `requiredRoles={['client']}` |
| Lien sidebar dans AppSidebar.tsx | ✅ TERMINÉ — icône Heart, label "Mon Dossier Santé" |

### S2.4 — UrgenceWidget (composant flottant CLIENT)
| Élément | Statut |
|---------|--------|
| `UrgenceWidget.tsx` | ✅ TERMINÉ — bouton flottant rouge, panneau animé avec 4 numéros d'urgence |
| Intégration dans AppLayout | ✅ TERMINÉ — affiché uniquement si `user?.role === 'client'` |

### Vérification
| Vérification | Résultat |
|--------------|----------|
| `npx tsc --noEmit` | ✅ 0 erreur |

---

## SPRINT 3 — Qualité et Cohérence

**Statut :** ✅ TERMINÉ — 2026-05-27

### S3.1 — Composant ErrorState/LoadingState réutilisable
| Élément | Statut |
|---------|--------|
| `src/components/ui/ErrorState.tsx` | ✅ TERMINÉ — `<ErrorState>` et `<LoadingState>` exportés |

### S3.2 — Suppression console.debug/warn en production
| Élément | Statut |
|---------|--------|
| `PrestationsPage.tsx` : console.debug + console.warn | ✅ TERMINÉ — supprimés |

### S3.3 — Gestion d'erreur manquante
| Élément | Statut |
|---------|--------|
| `PatientDossierPage.tsx` : state `error` + bloc JSX | ✅ TERMINÉ |

### S3.4 — Données hardcodées résiduelles
| Élément | Statut |
|---------|--------|
| `ConditionsGeneralesPage.tsx` : année et date d'effet | ✅ TERMINÉ — dynamiques via `new Date()` |

### Vérification
| Vérification | Résultat |
|--------------|----------|
| `npx tsc --noEmit` | ✅ 0 erreur |

---

## Métriques de sécurité

| Critère | Avant | Après Sprint 1 |
|---------|-------|----------------|
| Endpoints IDOR vulnérables | 6+ | 0 (cible) |
| Upload sinistre fonctionnel | ❌ | ✅ (cible) |
| Client-upload documents | ❌ | ✅ (cible) |
| Contrôle accès téléchargement docs | ❌ | ✅ (cible) |
| Rate limiting sinistres | ❌ | ✅ (cible) |
