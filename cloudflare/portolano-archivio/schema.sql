-- Archivio condiviso di Portolano su Cloudflare D1 (SQLite). Eseguire una volta: wrangler d1 execute portolano-archivio --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS record (
  coll TEXT NOT NULL,            -- 'scali' | 'spese'
  id TEXT NOT NULL,
  updatedAt TEXT NOT NULL DEFAULT '',
  sv INTEGER NOT NULL,           -- orologio del servizio all'ultima scrittura (per le differenze)
  json TEXT NOT NULL,
  PRIMARY KEY (coll, id)
);
CREATE INDEX IF NOT EXISTS record_sv ON record (sv);
CREATE TABLE IF NOT EXISTS tomb (          -- cancellazioni
  id TEXT PRIMARY KEY,
  t TEXT NOT NULL,               -- ISO della cancellazione
  sv INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (          -- cfg, cfgAt, aggiornato
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS storico (       -- una riga per ogni versione salvata di ogni record (cronologia)
  n INTEGER PRIMARY KEY AUTOINCREMENT,
  coll TEXT NOT NULL,
  id TEXT NOT NULL,
  sv INTEGER NOT NULL,
  utente TEXT NOT NULL DEFAULT '',
  json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS storico_id ON storico (coll, id, sv);
CREATE TABLE IF NOT EXISTS backup (        -- copia completa giornaliera (cron), ultime 60
  giorno TEXT PRIMARY KEY,
  json TEXT NOT NULL
);
