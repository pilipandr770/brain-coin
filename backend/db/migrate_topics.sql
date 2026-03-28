-- =========================================================================
-- BrainCoin: Subject Topics Migration
--
-- Adds a subject_topics table so question generation is organised by
-- curriculum topic (not just subject+grade).  Each topic generates
-- TARGET_PER_TOPIC (default 200) questions → ~105 000 Claude questions
-- total on first full admin run.
--
-- Also adds topic_id to questions + performance indexes.
-- =========================================================================

SET search_path TO braincoin;

-- ── 1. Subject-topics catalogue ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subject_topics (
  id         SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  name_de    VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(subject_id, name_de)
);

-- ── 2. Attach topic_id to questions ─────────────────────────────────────────
ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_id INTEGER;

-- ── 3. Performance indexes ───────────────────────────────────────────────────
-- Fast lookup of questions by subject+grade (used in every quiz)
CREATE INDEX IF NOT EXISTS idx_q_subj_grade     ON questions(subject_id, grade);
-- Fast lookup by topic+grade (used in genJob per-topic count checks)
CREATE INDEX IF NOT EXISTS idx_q_topic_grade    ON questions(topic_id, grade);
-- Covering index for mastery-aware picks (subject_id, grade, id)
CREATE INDEX IF NOT EXISTS idx_q_subj_grade_id  ON questions(subject_id, grade, id);

-- ── 4. Seed curriculum topics ────────────────────────────────────────────────
--   Topics are subject-level (not grade-specific); grade differentiation
--   comes from the Claude prompt (grade + age context). Each subject is
--   identified by its unique slug so INSERTs are idempotent.

-- Englisch ----------------------------------------------------------------
INSERT INTO subject_topics (subject_id, name_de, sort_order)
SELECT (SELECT id FROM subjects WHERE slug='english'), v.n, v.o
FROM (VALUES
  ('Vokabular: Alltag & Familie',           1),
  ('Vokabular: Schule & Berufe',            2),
  ('Vokabular: Natur & Tiere',              3),
  ('Vokabular: Sport & Freizeit',           4),
  ('Grammatik: Zeitformen & Aspekte',       5),
  ('Grammatik: Pluralformen & Artikel',     6),
  ('Grammatik: Präpositionen & Phrasen',    7),
  ('Grammatik: Modalverben & Hilfsverben',  8),
  ('Landeskunde: Großbritannien & Irland',  9),
  ('Landeskunde: USA & Kanada',            10),
  ('Landeskunde: Australien & Neuseeland', 11),
  ('Sprichwörter & Redewendungen',         12)
) AS v(n, o)
WHERE (SELECT id FROM subjects WHERE slug='english') IS NOT NULL
ON CONFLICT (subject_id, name_de) DO NOTHING;

-- Ukrainische Sprache -----------------------------------------------------
INSERT INTO subject_topics (subject_id, name_de, sort_order)
SELECT (SELECT id FROM subjects WHERE slug='ukrainian'), v.n, v.o
FROM (VALUES
  ('Alphabet & Lautlehre',                      1),
  ('Grammatik: Nomen & Kasus',                  2),
  ('Grammatik: Verben & Zeitformen',            3),
  ('Grammatik: Adjektive & Pronomen',           4),
  ('Rechtschreibung & Interpunktion',           5),
  ('Vokabular: Alltag & Gesellschaft',          6),
  ('Vokabular: Natur & Landschaft',             7),
  ('Literatur: Klassische ukrainische Autoren', 8),
  ('Folklore, Sprichwörter & Traditionen',      9),
  ('Geschichte der ukrainischen Sprache',      10)
) AS v(n, o)
WHERE (SELECT id FROM subjects WHERE slug='ukrainian') IS NOT NULL
ON CONFLICT (subject_id, name_de) DO NOTHING;

-- Geschichte --------------------------------------------------------------
INSERT INTO subject_topics (subject_id, name_de, sort_order)
SELECT (SELECT id FROM subjects WHERE slug='history'), v.n, v.o
FROM (VALUES
  ('Frühgeschichte & Steinzeit',                    1),
  ('Antikes Ägypten & Orient',                      2),
  ('Antikes Griechenland',                          3),
  ('Antikes Rom',                                   4),
  ('Mittelalter: Feudalismus & Kreuzzüge',          5),
  ('Mittelalter: Kultur & Alltagsleben',            6),
  ('Renaissance & Humanismus',                      7),
  ('Entdeckungszeitalter & Absolutismus',           8),
  ('Aufklärung & Revolutionen',                     9),
  ('Industrielle Revolution',                      10),
  ('Imperialismus & Kolonialismus',                11),
  ('Erster Weltkrieg',                             12),
  ('Zweiter Weltkrieg & Holocaust',                13),
  ('Kalter Krieg & Teilung Europas',               14),
  ('Ukraine & Osteuropa im 20./21. Jahrhundert',   15)
) AS v(n, o)
WHERE (SELECT id FROM subjects WHERE slug='history') IS NOT NULL
ON CONFLICT (subject_id, name_de) DO NOTHING;

-- Naturkunde (science, grades 4–6) ----------------------------------------
INSERT INTO subject_topics (subject_id, name_de, sort_order)
SELECT (SELECT id FROM subjects WHERE slug='science'), v.n, v.o
FROM (VALUES
  ('Pflanzen: Aufbau & Photosynthese',       1),
  ('Tiere: Wirbeltiere',                     2),
  ('Tiere: Wirbellose & Insekten',           3),
  ('Wasser: Kreislauf & Aggregatzustände',   4),
  ('Wetter, Klima & Jahreszeiten',           5),
  ('Erde: Gesteine, Boden & Mineralien',     6),
  ('Weltall: Planeten & Sonnensystem',       7),
  ('Menschlicher Körper: Sinnesorgane',      8),
  ('Energie: Formen & einfache Maschinen',   9),
  ('Umweltschutz & Ökologie',               10)
) AS v(n, o)
WHERE (SELECT id FROM subjects WHERE slug='science') IS NOT NULL
ON CONFLICT (subject_id, name_de) DO NOTHING;

-- Chemie (grades 7–9) -----------------------------------------------------
INSERT INTO subject_topics (subject_id, name_de, sort_order)
SELECT (SELECT id FROM subjects WHERE slug='chemistry'), v.n, v.o
FROM (VALUES
  ('Atombau & Elementarteilchen',                           1),
  ('Periodensystem: Aufbau & Elementgruppen',               2),
  ('Chemische Bindungen: Ionisch & Kovalent',               3),
  ('Chemische Gleichungen & Stöchiometrie',                 4),
  ('Metalle & ihre Eigenschaften',                          5),
  ('Säuren: Eigenschaften & Reaktionen',                    6),
  ('Basen (Laugen) & Hydroxide',                            7),
  ('Salze & Neutralisationsreaktionen',                     8),
  ('Organische Chemie: Alkane & Alkene',                    9),
  ('Organische Chemie: Funktionsgruppen',                  10),
  ('Elektrochemie & Elektrolyse',                          11),
  ('Chemie im Alltag: Kunststoffe & Umwelt',               12)
) AS v(n, o)
WHERE (SELECT id FROM subjects WHERE slug='chemistry') IS NOT NULL
ON CONFLICT (subject_id, name_de) DO NOTHING;

-- Physik (grades 7–9) -----------------------------------------------------
INSERT INTO subject_topics (subject_id, name_de, sort_order)
SELECT (SELECT id FROM subjects WHERE slug='physics'), v.n, v.o
FROM (VALUES
  ('Mechanik: Kräfte & Newtons Gesetze',           1),
  ('Mechanik: Arbeit, Energie & Leistung',         2),
  ('Mechanik: Druck & Auftrieb',                   3),
  ('Mechanik: Reibung & schiefe Ebene',            4),
  ('Elektrizität: Grundbegriffe & Stromkreis',     5),
  ('Elektrizität: Ohmsches Gesetz & Widerstand',   6),
  ('Magnetismus & Elektromagnetismus',             7),
  ('Optik: Reflexion, Spiegel & Schatten',         8),
  ('Optik: Brechung, Linsen & Prisma',             9),
  ('Akustik: Schall & Wellen',                    10),
  ('Wärmelehre & Thermodynamik',                  11),
  ('Atomphysik & Radioaktivität',                 12)
) AS v(n, o)
WHERE (SELECT id FROM subjects WHERE slug='physics') IS NOT NULL
ON CONFLICT (subject_id, name_de) DO NOTHING;

-- Biologie ----------------------------------------------------------------
INSERT INTO subject_topics (subject_id, name_de, sort_order)
SELECT (SELECT id FROM subjects WHERE slug='biology'), v.n, v.o
FROM (VALUES
  ('Zellen: Aufbau & Zellteilung',                             1),
  ('Pflanzen: Organe & Photosynthese',                         2),
  ('Pflanzen: Fortpflanzung & Blüte',                         3),
  ('Wirbeltiere: Säugetiere & Vögel',                         4),
  ('Wirbeltiere: Fische, Reptilien & Amphibien',              5),
  ('Wirbellose: Insekten & Gliedertiere',                     6),
  ('Menschlicher Körper: Skelett & Muskeln',                   7),
  ('Menschlicher Körper: Blut & Kreislaufsystem',             8),
  ('Menschlicher Körper: Verdauung & Ernährung',              9),
  ('Menschlicher Körper: Nervensystem & Sinne',               10),
  ('Ökosysteme: Wald, Wiese & Parklandschaft',                11),
  ('Ökosysteme: Wasser, Meer & Feuchtgebiete',               12),
  ('Genetik & Vererbungslehre',                               13),
  ('Evolution & Artenvielfalt',                               14)
) AS v(n, o)
WHERE (SELECT id FROM subjects WHERE slug='biology') IS NOT NULL
ON CONFLICT (subject_id, name_de) DO NOTHING;

-- Programmierung ----------------------------------------------------------
INSERT INTO subject_topics (subject_id, name_de, sort_order)
SELECT (SELECT id FROM subjects WHERE slug='programming'), v.n, v.o
FROM (VALUES
  ('Algorithmen & Ablaufdiagramme',                1),
  ('Variablen, Datentypen & Operatoren',           2),
  ('Boolesche Logik & Vergleiche',                 3),
  ('Schleifen: for, while & Rekursion',            4),
  ('Verzweigungen: if/else & switch',              5),
  ('Funktionen & Parameter',                       6),
  ('Arrays, Listen & Datenstrukturen',             7),
  ('Internet, Protokolle & Netzwerke',             8),
  ('Datenschutz & Cybersicherheit',                9),
  ('KI, Robotik & Automation',                    10)
) AS v(n, o)
WHERE (SELECT id FROM subjects WHERE slug='programming') IS NOT NULL
ON CONFLICT (subject_id, name_de) DO NOTHING;

-- Deutsch -----------------------------------------------------------------
INSERT INTO subject_topics (subject_id, name_de, sort_order)
SELECT (SELECT id FROM subjects WHERE slug='german'), v.n, v.o
FROM (VALUES
  ('Wortarten: Nomen, Artikel & Pronomen',             1),
  ('Wortarten: Verben & Konjugation',                  2),
  ('Wortarten: Adjektive & Adverbien',                 3),
  ('Grammatik: Satzglieder & Satzarten',               4),
  ('Grammatik: Kasus (Nominativ/Akkusativ/Dativ/Genitiv)', 5),
  ('Grammatik: Zeitformen des Verbs',                  6),
  ('Rechtschreibung: Groß-/Kleinschreibung',           7),
  ('Rechtschreibung: ss/ß, ie/ei, dass/das',           8),
  ('Zeichensetzung: Komma, Punkt & Satzzeichen',       9),
  ('Literatur: Märchen, Fabeln & Sagen',              10),
  ('Literatur: Gedichte & Stilmittel',                11),
  ('Textsorten & Aufsatzformen',                      12)
) AS v(n, o)
WHERE (SELECT id FROM subjects WHERE slug='german') IS NOT NULL
ON CONFLICT (subject_id, name_de) DO NOTHING;
