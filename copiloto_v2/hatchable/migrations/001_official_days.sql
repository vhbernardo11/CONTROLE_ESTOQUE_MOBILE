CREATE TABLE IF NOT EXISTS official_trading_days (
  trade_date DATE PRIMARY KEY,
  net_cents INTEGER NOT NULL,
  source_note TEXT NOT NULL,
  audit_state TEXT NOT NULL DEFAULT 'OFICIAL',
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT audit_state_allowed CHECK (audit_state IN ('OFICIAL', 'PROVISORIO'))
)