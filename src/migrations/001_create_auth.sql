ALTER TABLE pessoa ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS email_verification (
    id          BIGSERIAL PRIMARY KEY,
    pessoa_id   BIGINT      NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    codigo      TEXT        NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_pessoa ON email_verification(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_codigo ON email_verification(codigo);

CREATE TABLE IF NOT EXISTS refresh_token (
    id         BIGSERIAL PRIMARY KEY,
    pessoa_id  BIGINT      NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL,          
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_pessoa ON refresh_token(pessoa_id);

CREATE TABLE IF NOT EXISTS password_reset_token (
    id         BIGSERIAL PRIMARY KEY,
    pessoa_id  BIGINT      NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL UNIQUE, 
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_pessoa ON password_reset_token(pessoa_id);