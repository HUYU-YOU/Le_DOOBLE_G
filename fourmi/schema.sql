-- ============================================================================
-- MYRMIDON — SCHÉMA POSTGRESQL SÉCURISÉ (ANTI-TRICHE & TRANSACTIONS ACID)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Comptes Joueurs (Mot de passe Argon2id/Bcrypt côté serveur Node.js)
CREATE TABLE accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(18) UNIQUE NOT NULL,
    email           VARCHAR(120) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. État de la Fourmilière (Ressources vérifiées côté serveur uniquement)
CREATE TABLE colonies (
    account_id          UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    terrain_cm2         BIGINT NOT NULL DEFAULT 120 CHECK (terrain_cm2 >= 0),
    workers             BIGINT NOT NULL DEFAULT 450 CHECK (workers >= 0),
    soldiers            BIGINT NOT NULL DEFAULT 300 CHECK (soldiers >= 0),
    soldier_level       INT NOT NULL DEFAULT 1 CHECK (soldier_level >= 1),
    coma_count          BIGINT NOT NULL DEFAULT 0 CHECK (coma_count >= 0),
    honey               BIGINT NOT NULL DEFAULT 2500 CHECK (honey >= 0),
    resin               BIGINT NOT NULL DEFAULT 1200 CHECK (resin >= 0),
    cocoon_shards       INT NOT NULL DEFAULT 35 CHECK (cocoon_shards BETWEEN 0 AND 99),
    mystic_cocoons      INT NOT NULL DEFAULT 5 CHECK (mystic_cocoons >= 0),
    ld_cocoons          INT NOT NULL DEFAULT 1 CHECK (ld_cocoons >= 0),
    pvp_medals          INT NOT NULL DEFAULT 60 CHECK (pvp_medals >= 0),
    pity_counter        INT NOT NULL DEFAULT 0 CHECK (pity_counter BETWEEN 0 AND 40),
    queen_level         INT NOT NULL DEFAULT 1 CHECK (queen_level >= 1),
    pool_level          INT NOT NULL DEFAULT 1 CHECK (pool_level BETWEEN 1 AND 20),
    has_aphids_farm     BOOLEAN NOT NULL DEFAULT FALSE,
    has_fusion_sanctum  BOOLEAN NOT NULL DEFAULT FALSE,
    pve_cleared_stage   INT NOT NULL DEFAULT 0,
    pvp_cleared_bastion INT NOT NULL DEFAULT 0,
    war_debuff_until    TIMESTAMPTZ,
    last_tick_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Inventaire des Soldates d'Élite invoquées (Sans Runes)
CREATE TABLE elite_ants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    template_id     VARCHAR(32) NOT NULL,
    stars           SMALLINT NOT NULL CHECK (stars BETWEEN 3 AND 6),
    level           SMALLINT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 60),
    awakened        BOOLEAN NOT NULL DEFAULT FALSE,
    summoned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Journal d'Audit Anti-Triche (Invocations, Fusions, Guerres)
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    action_type     VARCHAR(40) NOT NULL, -- 'SUMMON', 'FUSION', 'PVP_WAR', 'WORLD_BOSS'
    payload         JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_elite_ants_account ON elite_ants(account_id);
CREATE INDEX idx_audit_logs_account ON audit_logs(account_id, created_at DESC);
