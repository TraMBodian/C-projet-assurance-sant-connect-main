-- ============================================================
-- Migration Flyway V1 — Schéma initial Papy Services Assurances
-- Profils : mysql, postgres
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(255),
    role        VARCHAR(50)  NOT NULL,
    organization VARCHAR(255),
    telephone   VARCHAR(50),
    adresse     TEXT,
    status      VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    token       VARCHAR(512) NOT NULL UNIQUE,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_sessions (
    id           BIGSERIAL PRIMARY KEY,
    email        VARCHAR(255) NOT NULL,
    last_active  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS familles_assurance (
    id           BIGSERIAL PRIMARY KEY,
    numero       VARCHAR(100) NOT NULL UNIQUE,
    nom          VARCHAR(255),
    formule      VARCHAR(100),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groupes_assurance (
    id           BIGSERIAL PRIMARY KEY,
    numero       VARCHAR(100) NOT NULL UNIQUE,
    nom          VARCHAR(255),
    formule      VARCHAR(100),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assures (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(100) NOT NULL UNIQUE,
    nom             VARCHAR(255) NOT NULL,
    prenom          VARCHAR(255),
    email           VARCHAR(255),
    telephone       VARCHAR(50),
    adresse         TEXT,
    date_naissance  VARCHAR(50),
    sexe            VARCHAR(20),
    piece_identite  VARCHAR(255),
    lien            VARCHAR(100),
    date_adhesion   VARCHAR(50),
    salaire         VARCHAR(100),
    garantie        VARCHAR(255),
    prime           VARCHAR(100),
    date_debut      VARCHAR(50),
    date_fin        VARCHAR(50),
    photo           TEXT,
    statut          VARCHAR(50)  NOT NULL DEFAULT 'ACTIF',
    type            VARCHAR(50)  NOT NULL DEFAULT 'FAMILLE',
    famille_id      BIGINT,
    groupe_id       BIGINT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assure_beneficiaires (
    assure_id     BIGINT NOT NULL REFERENCES assures(id) ON DELETE CASCADE,
    beneficiaire  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS prestataires (
    id          BIGSERIAL PRIMARY KEY,
    numero      VARCHAR(100) NOT NULL UNIQUE,
    nom         VARCHAR(255) NOT NULL,
    type        VARCHAR(100) NOT NULL,
    email       VARCHAR(255),
    telephone   VARCHAR(50),
    adresse     TEXT,
    statut      VARCHAR(50)  NOT NULL DEFAULT 'ACTIF',
    user_id     BIGINT       REFERENCES users(id),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS polices (
    id            BIGSERIAL PRIMARY KEY,
    numero        VARCHAR(100) NOT NULL UNIQUE,
    type          VARCHAR(100),
    couverture    TEXT,
    montant_prime NUMERIC(15,2),
    statut        VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    assure_id     BIGINT       REFERENCES assures(id),
    famille_id    BIGINT,
    groupe_id     BIGINT,
    date_debut    VARCHAR(50),
    date_fin      VARCHAR(50),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sinistres (
    id               BIGSERIAL PRIMARY KEY,
    numero           VARCHAR(100) NOT NULL UNIQUE,
    type             VARCHAR(100),
    description      TEXT,
    montant_reclame  NUMERIC(15,2),
    montant_accorde  NUMERIC(15,2),
    statut           VARCHAR(50)  NOT NULL DEFAULT 'EN_ATTENTE',
    assure_id        BIGINT       REFERENCES assures(id),
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultations (
    id                  BIGSERIAL PRIMARY KEY,
    numero              VARCHAR(100) NOT NULL UNIQUE,
    motif               TEXT,
    diagnostic          TEXT,
    notes               TEXT,
    statut              VARCHAR(50)  NOT NULL DEFAULT 'EN_ATTENTE',
    motif_annulation    TEXT,
    date_consultation   TIMESTAMP,
    assure_id           BIGINT       REFERENCES assures(id),
    prestataire_id      BIGINT       REFERENCES prestataires(id),
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(100) NOT NULL UNIQUE,
    medicaments     TEXT,
    posologie       TEXT,
    duree           VARCHAR(100),
    notes           TEXT,
    statut          VARCHAR(50)  NOT NULL DEFAULT 'EN_ATTENTE',
    assure_id       BIGINT       REFERENCES assures(id),
    prestataire_id  BIGINT       REFERENCES prestataires(id),
    consultation_id BIGINT       REFERENCES consultations(id),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prestations (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(100) NOT NULL UNIQUE,
    type            VARCHAR(100),
    description     TEXT,
    montant         NUMERIC(15,2),
    statut          VARCHAR(50)  NOT NULL DEFAULT 'EN_ATTENTE',
    assure_id       BIGINT       REFERENCES assures(id),
    prestataire_id  BIGINT       REFERENCES prestataires(id),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lignes_prestation (
    id              BIGSERIAL PRIMARY KEY,
    designation     VARCHAR(255),
    quantite        INTEGER,
    prix_unitaire   NUMERIC(15,2),
    montant_total   NUMERIC(15,2),
    statut          VARCHAR(50)  NOT NULL DEFAULT 'EN_ATTENTE',
    prestation_id   BIGINT       REFERENCES prestations(id) ON DELETE CASCADE,
    prestataire_id  BIGINT       REFERENCES prestataires(id),
    prescription_id BIGINT       REFERENCES prescriptions(id),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paiements_primes (
    id                  BIGSERIAL PRIMARY KEY,
    numero              VARCHAR(100) NOT NULL UNIQUE,
    montant             NUMERIC(15,2),
    date_echeance       TIMESTAMP,
    date_paiement       TIMESTAMP,
    statut              VARCHAR(50)  NOT NULL DEFAULT 'EN_ATTENTE',
    moyen_paiement      VARCHAR(100),
    reference_transaction VARCHAR(255),
    notes               TEXT,
    police_id           BIGINT       REFERENCES polices(id),
    assure_id           BIGINT       REFERENCES assures(id),
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avenants_contrat (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(100) NOT NULL UNIQUE,
    type            VARCHAR(100),
    description     TEXT,
    statut          VARCHAR(50)  NOT NULL DEFAULT 'EN_ATTENTE',
    commentaire     TEXT,
    police_id       BIGINT       REFERENCES polices(id),
    demande_par_id  BIGINT       REFERENCES users(id),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demandes_contrat (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(100) NOT NULL UNIQUE,
    type            VARCHAR(100),
    description     TEXT,
    statut          VARCHAR(50)  NOT NULL DEFAULT 'EN_ATTENTE',
    commentaire     TEXT,
    police_id       BIGINT       REFERENCES polices(id),
    demande_par_id  BIGINT       REFERENCES users(id),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents_medicaux (
    id              BIGSERIAL PRIMARY KEY,
    nom             VARCHAR(255),
    content_type    VARCHAR(100),
    taille          BIGINT,
    chemin          VARCHAR(500),
    description     TEXT,
    assure_id       BIGINT       REFERENCES assures(id),
    consultation_id BIGINT       REFERENCES consultations(id),
    uploaded_by_id  BIGINT       REFERENCES users(id),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id          BIGSERIAL PRIMARY KEY,
    titre       VARCHAR(255),
    message     TEXT,
    type        VARCHAR(100),
    lue         BOOLEAN      NOT NULL DEFAULT FALSE,
    user_id     BIGINT       REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id          BIGSERIAL PRIMARY KEY,
    contenu     TEXT,
    room_id     VARCHAR(255),
    sender_id   BIGINT       REFERENCES users(id),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    action      VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id   VARCHAR(100),
    details     TEXT,
    user_email  VARCHAR(255),
    ip_address  VARCHAR(50),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tarifs (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,
    libelle     VARCHAR(255),
    montant     NUMERIC(15,2),
    type        VARCHAR(100),
    actif       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
