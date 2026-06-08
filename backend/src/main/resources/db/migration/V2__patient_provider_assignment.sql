-- ============================================================
-- Migration Flyway V2 — Relation explicite patient ↔ prestataire (R2)
-- Profils : mysql, postgres
-- Source de vérité de l'autorisation d'accès des prestataires aux patients.
-- (Le backfill des données est réalisé au démarrage par AssignmentBackfillRunner,
--  idempotent et compatible avec tous les profils, y compris H2.)
-- ============================================================

CREATE TABLE IF NOT EXISTS patient_provider_assignment (
    id               BIGSERIAL PRIMARY KEY,
    assure_id        BIGINT       NOT NULL REFERENCES assures(id) ON DELETE CASCADE,
    prestataire_id   BIGINT       NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
    status           VARCHAR(16)  NOT NULL,
    source           VARCHAR(16)  NOT NULL,
    granted_by_email VARCHAR(255),
    valid_from       TIMESTAMP,
    valid_to         TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ppa UNIQUE (assure_id, prestataire_id)
);

CREATE INDEX IF NOT EXISTS idx_ppa_prestataire ON patient_provider_assignment(prestataire_id, status);
CREATE INDEX IF NOT EXISTS idx_ppa_assure      ON patient_provider_assignment(assure_id, status);
