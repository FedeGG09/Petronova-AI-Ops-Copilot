PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS supply_cases (
  id TEXT PRIMARY KEY,
  supplier_name TEXT,
  contract_id TEXT,
  province TEXT,
  status TEXT,
  amount REAL,
  risk_score REAL,
  issue TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_cases (
  id TEXT PRIMARY KEY,
  asset_name TEXT,
  asset_id TEXT,
  plant TEXT,
  status TEXT,
  severity TEXT,
  temperature_c REAL,
  vibration_mm_s REAL,
  issue TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contract_cases (
  id TEXT PRIMARY KEY,
  contract_id TEXT,
  supplier_name TEXT,
  status TEXT,
  expires_in_days INTEGER,
  clause_risk REAL,
  issue TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  doc_type TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS queries (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS predictions_log (
  id TEXT PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  predicted_risk REAL NOT NULL,
  level TEXT NOT NULL,
  reasons TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
