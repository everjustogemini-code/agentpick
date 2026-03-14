CREATE TABLE IF NOT EXISTS playground_rate_limits (
  id    SERIAL  PRIMARY KEY,
  ip    TEXT    NOT NULL,
  date  DATE    NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE (ip, date)
);
