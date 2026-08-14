PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  hook TEXT NOT NULL,
  description TEXT NOT NULL,
  platforms_json TEXT NOT NULL,
  categories_json TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  target_user_behaviour TEXT NOT NULL,
  technical_approach TEXT NOT NULL,
  required_assets_json TEXT NOT NULL,
  public_facing_text_json TEXT NOT NULL,
  novelty_explanation TEXT NOT NULL,
  risks_json TEXT NOT NULL,
  build_complexity TEXT NOT NULL,
  estimated_effort TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(id),
  platform TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  logs_json TEXT NOT NULL DEFAULT '[]',
  files_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS performance_records (
  id TEXT PRIMARY KEY,
  effect_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  date TEXT NOT NULL,
  views INTEGER,
  opens INTEGER,
  uses INTEGER,
  video_publishes INTEGER,
  shares INTEGER,
  saves INTEGER,
  replays INTEGER,
  average_session_length REAL,
  country TEXT,
  earnings REAL,
  currency TEXT
);

CREATE TABLE IF NOT EXISTS earnings (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  effect_id TEXT NOT NULL,
  programme TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS build_iterations (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  iteration_number INTEGER NOT NULL,
  preview_path TEXT,
  visual_score REAL,
  changes_json TEXT NOT NULL DEFAULT '[]',
  technical_qa TEXT NOT NULL,
  visual_qa TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS human_feedback (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  decision TEXT,
  feedback TEXT NOT NULL DEFAULT '',
  assessment_agreement TEXT,
  assessment_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status_platform ON jobs(status, platform);
CREATE INDEX IF NOT EXISTS idx_performance_effect_date ON performance_records(effect_id, date);
CREATE INDEX IF NOT EXISTS idx_earnings_platform_date ON earnings(platform, date);
CREATE INDEX IF NOT EXISTS idx_build_iterations_job_number ON build_iterations(job_id, iteration_number);
CREATE INDEX IF NOT EXISTS idx_human_feedback_job_date ON human_feedback(job_id, created_at);

CREATE TABLE IF NOT EXISTS learning_resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  evidence_source TEXT NOT NULL,
  automatic_learning_eligible INTEGER NOT NULL DEFAULT 0,
  inspection_status TEXT NOT NULL,
  discovered_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pattern_cards (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES learning_resources(id),
  card_json TEXT NOT NULL,
  confidence TEXT NOT NULL,
  inspected_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS training_exercises (
  id TEXT PRIMARY KEY,
  curriculum_slot_id TEXT,
  exercise_json TEXT NOT NULL,
  originality_status TEXT NOT NULL,
  workflow_status TEXT NOT NULL,
  human_confirmed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_records (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL REFERENCES training_exercises(id),
  record_json TEXT NOT NULL,
  final_outcome TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS capability_knowledge (
  id TEXT PRIMARY KEY,
  capability TEXT NOT NULL,
  statement TEXT NOT NULL,
  status TEXT NOT NULL,
  evidence_source TEXT,
  observed_at TEXT,
  lens_studio_version TEXT
);

CREATE TABLE IF NOT EXISTS learning_performance_evidence (
  id TEXT PRIMARY KEY,
  learning_record_id TEXT NOT NULL REFERENCES learning_records(id),
  effect_id TEXT NOT NULL,
  performance_record_ids_json TEXT NOT NULL DEFAULT '[]',
  observed_at TEXT NOT NULL,
  sample_start_date TEXT,
  sample_end_date TEXT,
  analysis_status TEXT NOT NULL DEFAULT 'NOT_ENOUGH_DATA',
  evidence_notes_json TEXT NOT NULL DEFAULT '[]',
  recommendation_impact TEXT NOT NULL DEFAULT 'NONE'
);

CREATE TABLE IF NOT EXISTS preset_census (
  id TEXT PRIMARY KEY,
  exact_name TEXT NOT NULL,
  source TEXT NOT NULL,
  raw_metadata_json TEXT NOT NULL,
  inferred_category_json TEXT NOT NULL,
  secondary_categories_json TEXT NOT NULL DEFAULT '[]',
  likely_purpose_json TEXT NOT NULL,
  inspection_level TEXT NOT NULL,
  confidence TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  inspection_history_json TEXT NOT NULL DEFAULT '[]',
  pattern_card_ids_json TEXT NOT NULL DEFAULT '[]',
  discovered_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS representative_preset_selections (
  id TEXT PRIMARY KEY,
  target INTEGER NOT NULL,
  selection_json TEXT NOT NULL,
  lens_studio_version TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_resources_source ON learning_resources(source, inspection_status);
CREATE INDEX IF NOT EXISTS idx_training_exercises_status ON training_exercises(workflow_status, originality_status);
CREATE INDEX IF NOT EXISTS idx_learning_records_outcome ON learning_records(final_outcome, completed_at);
CREATE INDEX IF NOT EXISTS idx_learning_performance_effect ON learning_performance_evidence(effect_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_preset_census_inspection ON preset_census(inspection_level, confidence);
