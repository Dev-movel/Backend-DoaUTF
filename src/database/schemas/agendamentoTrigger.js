module.exports = `
ALTER TABLE agendamento
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_agendamento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agendamento_updated_at ON agendamento;
CREATE TRIGGER trg_agendamento_updated_at
    BEFORE UPDATE ON agendamento
    FOR EACH ROW EXECUTE FUNCTION update_agendamento_updated_at();
`;