-- =============================================================================
-- LearnSphere AI — PostgreSQL 18+ Schema
-- Generated: 2026-04-27
--
-- IMPORTANT: Update this file whenever you change any API data model.
--
-- Design decisions:
--   • UUID v7 primary keys everywhere (gen_uuid_v7()) — time-ordered, concurrency-safe,
--     client-generatable, sequential index inserts, no fragmentation
--   • TIMESTAMPTZ for all datetimes — UTC always stored, display converted by client
--   • Arrays from mock API normalised into join tables
--   • GENERATED STORED tsvector column for full-text search on courses
--   • Row-level updated_at maintained by a single shared trigger function
--   • Soft-delete not used — hard CASCADE / SET NULL documented per table
-- =============================================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────

-- gen_uuid_v7() is built-in from PostgreSQL 18; pgcrypto no longer required for UUIDs.
-- Keep if you use pgcrypto functions elsewhere (e.g. crypt() for password hashing at DB level).
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram indexes for ILIKE search
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- accent-insensitive search

-- ─── ENUMs ────────────────────────────────────────────────────────────────────

CREATE TYPE user_role          AS ENUM ('user', 'admin');
CREATE TYPE course_level       AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE transaction_status AS ENUM ('success', 'failed');
CREATE TYPE chat_role          AS ENUM ('user', 'assistant');
CREATE TYPE content_status     AS ENUM ('published', 'draft', 'in_review', 'archived');
CREATE TYPE notification_type  AS ENUM (
  'enrollment',
  'completion',
  'certificate',
  'quiz_passed',
  'quiz_failed',
  'new_course',
  'announcement',
  'review_posted'
);

-- ─── Shared trigger: keep updated_at current ──────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- USERS
-- =============================================================================

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  -- Store bcrypt hash only; plain-text password lives in mock seed.ts only
  password_hash TEXT        NOT NULL,
  role          user_role   NOT NULL DEFAULT 'user',
  avatar_url    TEXT,
  bio           TEXT,
  points        INTEGER     NOT NULL DEFAULT 0,
  region_code   TEXT        NOT NULL DEFAULT 'US',
  currency_code TEXT        NOT NULL DEFAULT 'USD',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- interests[] in mock → join table (one row per interest per user)
CREATE TABLE user_interests (
  user_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  PRIMARY KEY (user_id, category)
);

-- =============================================================================
-- PASSWORD RESET TOKENS
-- Mirrors RESET_TOKENS: Record<string,string> in src/lib/api/auth.ts
-- =============================================================================

CREATE TABLE password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- Opaque token sent in the reset e-mail link
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  -- NULL = unused; set when redeemed
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prt_token   ON password_reset_tokens (token) WHERE used_at IS NULL;
CREATE INDEX idx_prt_user_id ON password_reset_tokens (user_id);

-- =============================================================================
-- REGIONS  (ISO 3166-1 alpha-2 territory codes + default currency)
-- =============================================================================

CREATE TABLE regions (
  code                 TEXT PRIMARY KEY,   -- ISO 3166-1 alpha-2 e.g. "US"
  name                 TEXT NOT NULL,
  default_currency_code TEXT NOT NULL REFERENCES currencies (code)
);

-- =============================================================================
-- CURRENCIES  (ISO 4217 codes with exchange rates relative to USD)
-- =============================================================================

CREATE TABLE currencies (
  code         TEXT          PRIMARY KEY,  -- ISO 4217 e.g. "USD"
  symbol       TEXT          NOT NULL,
  name         TEXT          NOT NULL,
  -- 1 USD = rate_vs_usd of this currency; prices stored in USD and converted on display
  rate_vs_usd  NUMERIC(14,6) NOT NULL DEFAULT 1 CHECK (rate_vs_usd > 0)
);

-- =============================================================================
-- TAGS  (normalised from Course.tags string[])
-- =============================================================================

CREATE TABLE tags (
  id   UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  name TEXT NOT NULL UNIQUE
);

-- =============================================================================
-- COURSES
-- =============================================================================

CREATE TABLE courses (
  id             UUID          PRIMARY KEY DEFAULT gen_uuid_v7(),
  title          TEXT          NOT NULL,
  slug           TEXT          NOT NULL UNIQUE,
  description    TEXT          NOT NULL,
  -- AI-generated style short summary
  summary        TEXT          NOT NULL,
  category       TEXT          NOT NULL,
  level          course_level  NOT NULL,
  -- Prices stored in USD; converted for display via the currencies table
  -- 0 = free
  list_price     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (list_price >= 0),
  -- NULL = no active sale
  sale_price     NUMERIC(10,2)           CHECK (sale_price >= 0 AND sale_price < list_price),
  -- Denormalised aggregate; kept in sync by trigger or application layer
  rating         NUMERIC(3,2)  NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  student_count  INTEGER       NOT NULL DEFAULT 0 CHECK (student_count >= 0),
  instructor     TEXT          NOT NULL,
  instructor_bio TEXT          NOT NULL,
  -- Emoji or short text used as cover artwork
  cover          TEXT          NOT NULL,
  status         content_status NOT NULL DEFAULT 'draft',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Weighted full-text search vector maintained automatically as a generated column
  fts_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,       '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary,     '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(instructor,  '')), 'D')
  ) STORED
);

CREATE INDEX idx_courses_slug       ON courses (slug);
CREATE INDEX idx_courses_category   ON courses (category);
CREATE INDEX idx_courses_level      ON courses (level);
CREATE INDEX idx_courses_status     ON courses (status);
CREATE INDEX idx_courses_list_price ON courses (list_price);
CREATE INDEX idx_courses_rating     ON courses (rating DESC);
CREATE INDEX idx_courses_fts        ON courses USING GIN (fts_vector);
-- Trigram index for partial-match UI search ("react" finds "The Architecture of React Apps")
CREATE INDEX idx_courses_title_trgm ON courses USING GIN (title gin_trgm_ops);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Course ↔ Tag many-to-many
CREATE TABLE course_tags (
  course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES tags    (id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, tag_id)
);

-- =============================================================================
-- LESSONS
-- Mirrors Lesson interface; sort_order preserves array index from mock
-- =============================================================================

CREATE TABLE lessons (
  id          UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  course_id   UUID        NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  -- Human-readable string e.g. "8:24"
  duration    TEXT        NOT NULL,
  video_url   TEXT,
  is_preview  BOOLEAN     NOT NULL DEFAULT FALSE,
  description TEXT,
  sort_order  SMALLINT    NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_course_id ON lessons (course_id, sort_order);

-- resources?: {label, url}[] normalised from Lesson
CREATE TABLE lesson_resources (
  id         UUID     PRIMARY KEY DEFAULT gen_uuid_v7(),
  lesson_id  UUID     NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  label      TEXT     NOT NULL,
  url        TEXT     NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_lesson_resources_lesson_id ON lesson_resources (lesson_id, sort_order);

-- =============================================================================
-- REVIEWS
-- Review.user is a display name (not FK) to allow anonymous / historical data
-- =============================================================================

CREATE TABLE reviews (
  id            UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  course_id     UUID        NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  -- Optional FK; NULL keeps historical reviews when a user is deleted
  user_id       UUID                    REFERENCES users   (id) ON DELETE SET NULL,
  reviewer_name TEXT        NOT NULL,
  rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT        NOT NULL,
  reviewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_course_id ON reviews (course_id, reviewed_at DESC);
CREATE INDEX idx_reviews_user_id   ON reviews (user_id);

-- =============================================================================
-- QUIZZES
-- Mirrors Quiz > QuizQuestion > QuizOption hierarchy
-- =============================================================================

CREATE TABLE quizzes (
  id            UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  course_id     UUID        NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  -- Minimum percentage to pass (0–100)
  passing_score SMALLINT    NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_course_id ON quizzes (course_id);

CREATE TABLE quiz_questions (
  id                  UUID     PRIMARY KEY DEFAULT gen_uuid_v7(),
  quiz_id             UUID     NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  prompt              TEXT     NOT NULL,
  -- One element = single-select; multiple elements = multi-select (checkboxes)
  correct_option_keys TEXT[]   NOT NULL DEFAULT '{}',
  is_multi_select     BOOLEAN  NOT NULL DEFAULT FALSE,
  explanation         TEXT,
  sort_order          SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions (quiz_id, sort_order);

-- Each option row for a question; option_key = "a" | "b" | "c" | "d"
CREATE TABLE quiz_options (
  id          UUID     PRIMARY KEY DEFAULT gen_uuid_v7(),
  question_id UUID     NOT NULL REFERENCES quiz_questions (id) ON DELETE CASCADE,
  option_key  TEXT     NOT NULL,
  text        TEXT     NOT NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (question_id, option_key)
);

CREATE INDEX idx_quiz_options_question_id ON quiz_options (question_id, sort_order);

-- =============================================================================
-- QUIZ ATTEMPTS  (futuristic — tracks every attempt per user)
-- =============================================================================

CREATE TABLE quiz_attempts (
  id           UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  user_id      UUID        NOT NULL REFERENCES users   (id) ON DELETE CASCADE,
  quiz_id      UUID        NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  -- Score as percentage 0–100
  score        SMALLINT    NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed       BOOLEAN     NOT NULL,
  -- {question_id: chosen_option_key} snapshot
  answers      JSONB       NOT NULL DEFAULT '{}',
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_user_quiz ON quiz_attempts (user_id, quiz_id, attempted_at DESC);

-- =============================================================================
-- ENROLLMENTS
-- Mirrors Enrollment interface; completedLessonIds[] → join table
-- =============================================================================

CREATE TABLE enrollments (
  id              UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  user_id         UUID        NOT NULL REFERENCES users   (id) ON DELETE CASCADE,
  course_id       UUID        NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  -- Quiz IDs the student has passed; certificate gated on this being complete
  passed_quiz_ids    TEXT[]      NOT NULL DEFAULT '{}',
  time_spent_seconds INTEGER     NOT NULL DEFAULT 0,
  enrolled_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX idx_enrollments_user_id   ON enrollments (user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments (course_id);

CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- completedLessonIds string[] normalised to one row per completed lesson
-- time_spent_s records how long the student spent before marking it done
CREATE TABLE enrollment_lesson_progress (
  enrollment_id UUID        NOT NULL REFERENCES enrollments (id) ON DELETE CASCADE,
  lesson_id     UUID        NOT NULL REFERENCES lessons     (id) ON DELETE CASCADE,
  time_spent_s  INTEGER     NOT NULL DEFAULT 0 CHECK (time_spent_s >= 0),
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (enrollment_id, lesson_id)
);

CREATE INDEX idx_elp_enrollment_id ON enrollment_lesson_progress (enrollment_id);
CREATE INDEX idx_elp_lesson_id     ON enrollment_lesson_progress (lesson_id);

-- =============================================================================
-- TRANSACTIONS
-- user_id / course_id nullable so audit history survives user/course deletion
-- =============================================================================

CREATE TABLE transactions (
  id         UUID               PRIMARY KEY DEFAULT gen_uuid_v7(),
  user_id    UUID                           REFERENCES users   (id) ON DELETE SET NULL,
  course_id  UUID                           REFERENCES courses (id) ON DELETE SET NULL,
  amount     NUMERIC(10,2)      NOT NULL CHECK (amount >= 0),
  status     transaction_status NOT NULL,
  created_at TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id    ON transactions (user_id);
CREATE INDEX idx_transactions_course_id  ON transactions (course_id);
CREATE INDEX idx_transactions_status     ON transactions (status);
CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);

-- =============================================================================
-- WISHLISTS
-- =============================================================================

CREATE TABLE wishlists (
  user_id   UUID        NOT NULL REFERENCES users   (id) ON DELETE CASCADE,
  course_id UUID        NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX idx_wishlists_user_id ON wishlists (user_id);

-- =============================================================================
-- CHAT
-- Mock stores chats as Record<userId, ChatMessage[]>; normalised to sessions + messages.
-- course_id nullable: chat can be global or course-scoped.
-- =============================================================================

CREATE TABLE chat_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  user_id    UUID        NOT NULL REFERENCES users   (id) ON DELETE CASCADE,
  course_id  UUID                    REFERENCES courses (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One session per (user, course) pair; global sessions use course_id = NULL
  UNIQUE NULLS NOT DISTINCT (user_id, course_id)
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions (user_id);

CREATE TRIGGER trg_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE chat_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  session_id UUID        NOT NULL REFERENCES chat_sessions (id) ON DELETE CASCADE,
  role       chat_role   NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_created ON chat_messages (session_id, created_at ASC);

-- =============================================================================
-- CERTIFICATES
-- Issued once per enrollment when all lessons are completed.
-- Mirrors CertificateButton — stores issuance metadata and tracks downloads.
-- =============================================================================

CREATE TABLE certificates (
  id             UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  user_id        UUID        NOT NULL REFERENCES users       (id) ON DELETE CASCADE,
  course_id      UUID        NOT NULL REFERENCES courses     (id) ON DELETE CASCADE,
  enrollment_id  UUID        NOT NULL REFERENCES enrollments (id) ON DELETE CASCADE UNIQUE,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  download_count INTEGER     NOT NULL DEFAULT 0 CHECK (download_count >= 0)
);

CREATE INDEX idx_certificates_user_id ON certificates (user_id);
CREATE INDEX idx_certificates_course_id ON certificates (course_id);

-- =============================================================================
-- NOTIFICATIONS  (futuristic — in-app notification feed)
-- =============================================================================

CREATE TABLE notifications (
  id         UUID              PRIMARY KEY DEFAULT gen_uuid_v7(),
  user_id    UUID              NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT              NOT NULL,
  body       TEXT,
  is_read    BOOLEAN           NOT NULL DEFAULT FALSE,
  -- Polymorphic pointer — could be course_id, certificate_id, etc.
  related_id UUID,
  created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);

-- =============================================================================
-- AUDIT LOG  (futuristic — immutable change history)
-- Uses BIGSERIAL not UUID for sequential scanning efficiency
-- =============================================================================

CREATE TABLE audit_log (
  id         BIGSERIAL   PRIMARY KEY,
  actor_id   UUID                    REFERENCES users (id) ON DELETE SET NULL,
  -- e.g. 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'PASSWORD_RESET'
  action     TEXT        NOT NULL,
  table_name TEXT        NOT NULL,
  -- TEXT so it accommodates both UUID and BIGSERIAL PKs
  record_id  TEXT        NOT NULL,
  old_data   JSONB,
  new_data   JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_actor_id    ON audit_log (actor_id);
CREATE INDEX idx_audit_log_table_name  ON audit_log (table_name, record_id);
CREATE INDEX idx_audit_log_created_at  ON audit_log (created_at DESC);

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Per-course aggregated stats (used in admin panel and course detail pages)
CREATE OR REPLACE VIEW v_course_stats AS
SELECT
  c.id,
  c.title,
  c.slug,
  c.category,
  c.level,
  c.list_price,
  c.sale_price,
  c.status,
  c.instructor,
  c.cover,
  c.created_at,
  COUNT(DISTINCT e.id)                                                        AS enrollment_count,
  COUNT(DISTINCT r.id)                                                        AS review_count,
  ROUND(COALESCE(AVG(r.rating), 0), 2)                                       AS avg_rating,
  COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'success'), 0)             AS revenue
FROM       courses      c
LEFT JOIN  enrollments  e ON e.course_id = c.id
LEFT JOIN  reviews      r ON r.course_id = c.id
LEFT JOIN  transactions t ON t.course_id = c.id
GROUP BY c.id;

-- Per-enrollment progress — mirrors completedLessonIds length / lessons length
CREATE OR REPLACE VIEW v_enrollment_progress AS
SELECT
  e.id                                                                        AS enrollment_id,
  e.user_id,
  e.course_id,
  e.enrolled_at,
  COUNT(l.id)                                                                 AS total_lessons,
  COUNT(elp.lesson_id)                                                        AS completed_lessons,
  CASE
    WHEN COUNT(l.id) = 0 THEN 0
    ELSE ROUND(COUNT(elp.lesson_id) * 100.0 / COUNT(l.id))
  END                                                                         AS progress_pct,
  (COUNT(l.id) > 0 AND COUNT(elp.lesson_id) = COUNT(l.id))                  AS is_completed
FROM      enrollments                e
JOIN      lessons                    l   ON  l.course_id    = e.course_id
LEFT JOIN enrollment_lesson_progress elp ON  elp.enrollment_id = e.id
                                         AND elp.lesson_id     = l.id
GROUP BY e.id;

-- Admin dashboard overview — mirrors statsApi.overview
CREATE OR REPLACE VIEW v_admin_overview AS
SELECT
  (SELECT COUNT(*)             FROM users        WHERE role = 'user')   AS total_users,
  (SELECT COUNT(*)             FROM courses      WHERE status = 'published') AS total_courses,
  (SELECT COUNT(*)             FROM enrollments)                         AS total_enrollments,
  (SELECT COALESCE(SUM(amount), 0)
                               FROM transactions WHERE status = 'success') AS revenue;

-- =============================================================================
-- SEED DATA
-- Matches src/lib/seed.ts.  Password hashes are placeholders — replace with
-- real bcrypt output before using against a live database.
-- =============================================================================

-- Currencies
INSERT INTO currencies (code, symbol, name, rate_vs_usd) VALUES
  ('USD', '$',  'US Dollar',          1),
  ('EUR', '€',  'Euro',               0.92),
  ('GBP', '£',  'British Pound',      0.79),
  ('INR', '₹',  'Indian Rupee',       83.5),
  ('JPY', '¥',  'Japanese Yen',       149.5),
  ('AUD', 'A$', 'Australian Dollar',  1.52),
  ('CAD', 'C$', 'Canadian Dollar',    1.36),
  ('SGD', 'S$', 'Singapore Dollar',   1.34),
  ('AED', 'د.إ','UAE Dirham',         3.67),
  ('BRL', 'R$', 'Brazilian Real',     4.97),
  ('MXN', '$',  'Mexican Peso',       17.2),
  ('CHF', 'Fr', 'Swiss Franc',        0.9),
  ('ZAR', 'R',  'South African Rand', 18.6),
  ('KRW', '₩',  'South Korean Won',  1325);

-- Regions
INSERT INTO regions (code, name, default_currency_code) VALUES
  ('US', 'United States',       'USD'),
  ('GB', 'United Kingdom',      'GBP'),
  ('IN', 'India',               'INR'),
  ('AU', 'Australia',           'AUD'),
  ('CA', 'Canada',              'CAD'),
  ('DE', 'Germany',             'EUR'),
  ('FR', 'France',              'EUR'),
  ('IT', 'Italy',               'EUR'),
  ('ES', 'Spain',               'EUR'),
  ('NL', 'Netherlands',         'EUR'),
  ('JP', 'Japan',               'JPY'),
  ('SG', 'Singapore',           'SGD'),
  ('AE', 'United Arab Emirates','AED'),
  ('BR', 'Brazil',              'BRL'),
  ('MX', 'Mexico',              'MXN'),
  ('CH', 'Switzerland',         'CHF'),
  ('ZA', 'South Africa',        'ZAR'),
  ('KR', 'South Korea',         'KRW'),
  ('NZ', 'New Zealand',         'AUD'),
  ('SE', 'Sweden',              'EUR'),
  ('NO', 'Norway',              'EUR'),
  ('DK', 'Denmark',             'EUR'),
  ('PL', 'Poland',              'EUR'),
  ('PT', 'Portugal',            'EUR'),
  ('BE', 'Belgium',             'EUR'),
  ('AT', 'Austria',             'EUR'),
  ('IE', 'Ireland',             'EUR'),
  ('FI', 'Finland',             'EUR'),
  ('HK', 'Hong Kong',           'USD'),
  ('MY', 'Malaysia',            'USD');

-- Users
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Admin',
   'admin@lumen.io',
   '$2b$12$placeholder_hash_admin_CHANGEME',
   'admin'),

  ('00000000-0000-0000-0000-000000000002',
   'Demo Student',
   'demo@lumen.io',
   '$2b$12$placeholder_hash_demo_CHANGEME',
   'user');

INSERT INTO user_interests (user_id, category) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Design'),
  ('00000000-0000-0000-0000-000000000002', 'Programming');

-- Tags
INSERT INTO tags (id, name) VALUES
  ('aa000001-0000-0000-0000-000000000000', 'typography'),
  ('aa000002-0000-0000-0000-000000000000', 'design'),
  ('aa000003-0000-0000-0000-000000000000', 'layout'),
  ('aa000004-0000-0000-0000-000000000000', 'typescript'),
  ('aa000005-0000-0000-0000-000000000000', 'programming'),
  ('aa000006-0000-0000-0000-000000000000', 'javascript'),
  ('aa000007-0000-0000-0000-000000000000', 'art'),
  ('aa000008-0000-0000-0000-000000000000', 'watercolor'),
  ('aa000009-0000-0000-0000-000000000000', 'painting'),
  ('aa000010-0000-0000-0000-000000000000', 'product'),
  ('aa000011-0000-0000-0000-000000000000', 'strategy'),
  ('aa000012-0000-0000-0000-000000000000', 'business'),
  ('aa000013-0000-0000-0000-000000000000', 'react'),
  ('aa000014-0000-0000-0000-000000000000', 'architecture'),
  ('aa000015-0000-0000-0000-000000000000', 'frontend'),
  ('aa000016-0000-0000-0000-000000000000', 'writing'),
  ('aa000017-0000-0000-0000-000000000000', 'content');

-- Courses  (IDs mirror c-1…c-6 from seed.ts for easy cross-reference)
INSERT INTO courses
  (id, title, slug, description, summary, category, level, list_price, sale_price, rating, student_count,
   instructor, instructor_bio, cover, status, created_at)
VALUES
  ('cc000001-0000-0000-0000-000000000000',
   'The Craft of Modern Typography',
   'craft-of-modern-typography',
   'A studio course on letterforms, hierarchy, and the quiet decisions that make pages feel composed rather than decorated.',
   'Learn the principles behind elegant type systems, from kerning to scale, with practical studio exercises.',
   'Design', 'Intermediate', 0, NULL, 4.8, 2412,
   'Mira Hollander', 'Type designer, formerly at Commercial Type. Teaches at RISD.', 'Aa',
   'published', '2025-01-04 00:00:00+00'),

  ('cc000002-0000-0000-0000-000000000000',
   'Foundations of TypeScript',
   'foundations-of-typescript',
   'Move from JavaScript to confident TypeScript: types, generics, narrowing, and patterns that scale across teams.',
   'Master TypeScript fundamentals with practical patterns for real codebases.',
   'Programming', 'Beginner', 49, 29, 4.7, 8810,
   'Kenji Romero', 'Senior engineer, contributor to several open-source TS projects.', 'TS',
   'published', '2025-01-12 00:00:00+00'),

  ('cc000003-0000-0000-0000-000000000000',
   'Watercolor: A Slow Practice',
   'watercolor-slow-practice',
   'An unhurried approach to watercolor — washes, restraint, and learning to leave the page alone.',
   'A meditative watercolor course focusing on restraint, washes, and quiet composition.',
   'Art', 'Beginner', 39, 24, 4.9, 1320,
   'Eloise Marchetti', 'Painter and illustrator based in Florence.', '✦',
   'published', '2025-02-02 00:00:00+00'),

  ('cc000004-0000-0000-0000-000000000000',
   'Product Strategy for Builders',
   'product-strategy-for-builders',
   'How to choose what to build, how to know when you''re wrong, and how to write down a strategy people can actually follow.',
   'Practical product strategy frameworks for technical founders and PMs.',
   'Business', 'Intermediate', 79, NULL, 4.6, 5230,
   'Harper Liang', 'Former product lead at three early-stage startups.', '◐',
   'published', '2025-02-09 00:00:00+00'),

  ('cc000005-0000-0000-0000-000000000000',
   'The Architecture of React Apps',
   'architecture-of-react-apps',
   'Composition, data flow, server boundaries, and the small choices that determine whether a codebase ages well.',
   'Architectural principles for React applications that scale.',
   'Programming', 'Advanced', 129, 89, 4.9, 3104,
   'Sasha Vance', 'Staff engineer working on design systems.', '⚛',
   'published', '2025-02-20 00:00:00+00'),

  ('cc000006-0000-0000-0000-000000000000',
   'Writing for the Web',
   'writing-for-the-web',
   'Plain prose, useful headlines, and how to make a page feel like one mind wrote it. For designers, founders, and engineers.',
   'Practical writing course for product, marketing, and documentation copy.',
   'Writing', 'Beginner', 0, NULL, 4.7, 4112,
   'Dale Okonkwo', 'Editor and writing coach.', '¶',
   'published', '2025-03-01 00:00:00+00');

-- Course tags
INSERT INTO course_tags (course_id, tag_id) VALUES
  ('cc000001-0000-0000-0000-000000000000', 'aa000001-0000-0000-0000-000000000000'),
  ('cc000001-0000-0000-0000-000000000000', 'aa000002-0000-0000-0000-000000000000'),
  ('cc000001-0000-0000-0000-000000000000', 'aa000003-0000-0000-0000-000000000000'),
  ('cc000002-0000-0000-0000-000000000000', 'aa000004-0000-0000-0000-000000000000'),
  ('cc000002-0000-0000-0000-000000000000', 'aa000005-0000-0000-0000-000000000000'),
  ('cc000002-0000-0000-0000-000000000000', 'aa000006-0000-0000-0000-000000000000'),
  ('cc000003-0000-0000-0000-000000000000', 'aa000007-0000-0000-0000-000000000000'),
  ('cc000003-0000-0000-0000-000000000000', 'aa000008-0000-0000-0000-000000000000'),
  ('cc000003-0000-0000-0000-000000000000', 'aa000009-0000-0000-0000-000000000000'),
  ('cc000004-0000-0000-0000-000000000000', 'aa000010-0000-0000-0000-000000000000'),
  ('cc000004-0000-0000-0000-000000000000', 'aa000011-0000-0000-0000-000000000000'),
  ('cc000004-0000-0000-0000-000000000000', 'aa000012-0000-0000-0000-000000000000'),
  ('cc000005-0000-0000-0000-000000000000', 'aa000013-0000-0000-0000-000000000000'),
  ('cc000005-0000-0000-0000-000000000000', 'aa000014-0000-0000-0000-000000000000'),
  ('cc000005-0000-0000-0000-000000000000', 'aa000015-0000-0000-0000-000000000000'),
  ('cc000006-0000-0000-0000-000000000000', 'aa000016-0000-0000-0000-000000000000'),
  ('cc000006-0000-0000-0000-000000000000', 'aa000017-0000-0000-0000-000000000000');

-- Lessons for course c-1: The Craft of Modern Typography
INSERT INTO lessons (id, course_id, title, duration, video_url, is_preview, description, sort_order) VALUES
  ('ll010001-0000-0000-0000-000000000000', 'cc000001-0000-0000-0000-000000000000', 'The Anatomy of a Letter',  '4:10', 'https://www.youtube.com/embed/dQw4w9WgXcQ', TRUE,  'A focused lesson on the anatomy of a letter — short, practical, and self-contained.',   0),
  ('ll010002-0000-0000-0000-000000000000', 'cc000001-0000-0000-0000-000000000000', 'Building a Type Scale',    '5:27', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on building a type scale — short, practical, and self-contained.',    1),
  ('ll010003-0000-0000-0000-000000000000', 'cc000001-0000-0000-0000-000000000000', 'Pairing Serif & Sans',     '6:44', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on pairing serif & sans — short, practical, and self-contained.',     2),
  ('ll010004-0000-0000-0000-000000000000', 'cc000001-0000-0000-0000-000000000000', 'Composition & Rhythm',     '8:01', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on composition & rhythm — short, practical, and self-contained.',     3),
  ('ll010005-0000-0000-0000-000000000000', 'cc000001-0000-0000-0000-000000000000', 'Print vs. Screen',         '9:18', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on print vs. screen — short, practical, and self-contained.',         4),
  ('ll010006-0000-0000-0000-000000000000', 'cc000001-0000-0000-0000-000000000000', 'A Final Layout',           '10:35','https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on a final layout — short, practical, and self-contained.',           5);

-- Lessons for course c-2: Foundations of TypeScript
INSERT INTO lessons (id, course_id, title, duration, video_url, is_preview, description, sort_order) VALUES
  ('ll020001-0000-0000-0000-000000000000', 'cc000002-0000-0000-0000-000000000000', 'Why Types?',                  '4:10', 'https://www.youtube.com/embed/dQw4w9WgXcQ', TRUE,  'A focused lesson on why types? — short, practical, and self-contained.',                  0),
  ('ll020002-0000-0000-0000-000000000000', 'cc000002-0000-0000-0000-000000000000', 'Primitives and Inference',    '5:27', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on primitives and inference — short, practical, and self-contained.',    1),
  ('ll020003-0000-0000-0000-000000000000', 'cc000002-0000-0000-0000-000000000000', 'Objects, Arrays, Tuples',     '6:44', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on objects, arrays, tuples — short, practical, and self-contained.',     2),
  ('ll020004-0000-0000-0000-000000000000', 'cc000002-0000-0000-0000-000000000000', 'Narrowing and Guards',        '8:01', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on narrowing and guards — short, practical, and self-contained.',        3),
  ('ll020005-0000-0000-0000-000000000000', 'cc000002-0000-0000-0000-000000000000', 'Generics in Practice',        '9:18', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on generics in practice — short, practical, and self-contained.',        4),
  ('ll020006-0000-0000-0000-000000000000', 'cc000002-0000-0000-0000-000000000000', 'Building a Typed API Client', '10:35','https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on building a typed api client — short, practical, and self-contained.', 5);

-- Lessons for course c-3: Watercolor: A Slow Practice
INSERT INTO lessons (id, course_id, title, duration, video_url, is_preview, description, sort_order) VALUES
  ('ll030001-0000-0000-0000-000000000000', 'cc000003-0000-0000-0000-000000000000', 'Materials, Honestly',       '4:10', 'https://www.youtube.com/embed/dQw4w9WgXcQ', TRUE,  'A focused lesson on materials, honestly — short, practical, and self-contained.',       0),
  ('ll030002-0000-0000-0000-000000000000', 'cc000003-0000-0000-0000-000000000000', 'First Washes',              '5:27', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on first washes — short, practical, and self-contained.',              1),
  ('ll030003-0000-0000-0000-000000000000', 'cc000003-0000-0000-0000-000000000000', 'The Discipline of Less',    '6:44', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on the discipline of less — short, practical, and self-contained.',    2),
  ('ll030004-0000-0000-0000-000000000000', 'cc000003-0000-0000-0000-000000000000', 'Color as Weather',          '8:01', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on color as weather — short, practical, and self-contained.',          3),
  ('ll030005-0000-0000-0000-000000000000', 'cc000003-0000-0000-0000-000000000000', 'A Small Landscape',         '9:18', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on a small landscape — short, practical, and self-contained.',         4);

-- Lessons for course c-4: Product Strategy for Builders
INSERT INTO lessons (id, course_id, title, duration, video_url, is_preview, description, sort_order) VALUES
  ('ll040001-0000-0000-0000-000000000000', 'cc000004-0000-0000-0000-000000000000', 'What Strategy Is, and Isn''t', '4:10', 'https://www.youtube.com/embed/dQw4w9WgXcQ', TRUE,  'A focused lesson on what strategy is, and isn''t — short, practical, and self-contained.', 0),
  ('ll040002-0000-0000-0000-000000000000', 'cc000004-0000-0000-0000-000000000000', 'Reading the Market',           '5:27', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on reading the market — short, practical, and self-contained.',           1),
  ('ll040003-0000-0000-0000-000000000000', 'cc000004-0000-0000-0000-000000000000', 'Picking Your Wedge',           '6:44', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on picking your wedge — short, practical, and self-contained.',           2),
  ('ll040004-0000-0000-0000-000000000000', 'cc000004-0000-0000-0000-000000000000', 'Roadmaps That Survive',        '8:01', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on roadmaps that survive — short, practical, and self-contained.',        3),
  ('ll040005-0000-0000-0000-000000000000', 'cc000004-0000-0000-0000-000000000000', 'Saying No, Well',              '9:18', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on saying no, well — short, practical, and self-contained.',              4);

-- Lessons for course c-5: The Architecture of React Apps
INSERT INTO lessons (id, course_id, title, duration, video_url, is_preview, description, sort_order) VALUES
  ('ll050001-0000-0000-0000-000000000000', 'cc000005-0000-0000-0000-000000000000', 'Components as Contracts', '4:10', 'https://www.youtube.com/embed/dQw4w9WgXcQ', TRUE,  'A focused lesson on components as contracts — short, practical, and self-contained.',  0),
  ('ll050002-0000-0000-0000-000000000000', 'cc000005-0000-0000-0000-000000000000', 'Where State Lives',       '5:27', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on where state lives — short, practical, and self-contained.',         1),
  ('ll050003-0000-0000-0000-000000000000', 'cc000005-0000-0000-0000-000000000000', 'The Server Boundary',     '6:44', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on the server boundary — short, practical, and self-contained.',       2),
  ('ll050004-0000-0000-0000-000000000000', 'cc000005-0000-0000-0000-000000000000', 'Suspense, Honestly',      '8:01', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on suspense, honestly — short, practical, and self-contained.',       3),
  ('ll050005-0000-0000-0000-000000000000', 'cc000005-0000-0000-0000-000000000000', 'Caching and Invalidation','9:18', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on caching and invalidation — short, practical, and self-contained.', 4),
  ('ll050006-0000-0000-0000-000000000000', 'cc000005-0000-0000-0000-000000000000', 'A Final Architecture',    '10:35','https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on a final architecture — short, practical, and self-contained.',     5);

-- Lessons for course c-6: Writing for the Web
INSERT INTO lessons (id, course_id, title, duration, video_url, is_preview, description, sort_order) VALUES
  ('ll060001-0000-0000-0000-000000000000', 'cc000006-0000-0000-0000-000000000000', 'What Is This Sentence Doing?', '4:10', 'https://www.youtube.com/embed/dQw4w9WgXcQ', TRUE,  'A focused lesson on what is this sentence doing? — short, practical, and self-contained.', 0),
  ('ll060002-0000-0000-0000-000000000000', 'cc000006-0000-0000-0000-000000000000', 'Headlines That Work',          '5:27', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on headlines that work — short, practical, and self-contained.',          1),
  ('ll060003-0000-0000-0000-000000000000', 'cc000006-0000-0000-0000-000000000000', 'Cutting',                      '6:44', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on cutting — short, practical, and self-contained.',                      2),
  ('ll060004-0000-0000-0000-000000000000', 'cc000006-0000-0000-0000-000000000000', 'Voice, Quietly',               '8:01', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE, 'A focused lesson on voice, quietly — short, practical, and self-contained.',               3);

-- Reviews
INSERT INTO reviews (id, course_id, reviewer_name, rating, comment, reviewed_at) VALUES
  ('rr010001-0000-0000-0000-000000000000', 'cc000001-0000-0000-0000-000000000000', 'Jonas K.', 5, 'Beautifully paced. I look at type differently now.',    '2025-02-11 00:00:00+00'),
  ('rr010002-0000-0000-0000-000000000000', 'cc000001-0000-0000-0000-000000000000', 'Aria P.',  5, 'The studio exercises are exceptional.',                  '2025-03-04 00:00:00+00'),
  ('rr020001-0000-0000-0000-000000000000', 'cc000002-0000-0000-0000-000000000000', 'Nina T.',  5, 'Crystal clear. Best TS intro I''ve taken.',              '2025-01-22 00:00:00+00'),
  ('rr040001-0000-0000-0000-000000000000', 'cc000004-0000-0000-0000-000000000000', 'Owen B.',  4, 'Pragmatic and honest.',                                  '2025-02-18 00:00:00+00'),
  ('rr050001-0000-0000-0000-000000000000', 'cc000005-0000-0000-0000-000000000000', 'Diego R.', 5, 'Changed how I structure features.',                      '2025-03-12 00:00:00+00'),
  ('rr050002-0000-0000-0000-000000000000', 'cc000005-0000-0000-0000-000000000000', 'Lia M.',   5, 'Dense and worth re-watching.',                           '2025-03-22 00:00:00+00');

-- Quizzes (one per course, matching sampleQuiz() in seed.ts)
INSERT INTO quizzes (id, course_id, title, description, passing_score) VALUES
  ('qq000001-0000-0000-0000-000000000000', 'cc000001-0000-0000-0000-000000000000', 'Typography essentials — Knowledge check', 'A short quiz to reinforce what you learned.', 70),
  ('qq000002-0000-0000-0000-000000000000', 'cc000002-0000-0000-0000-000000000000', 'TypeScript foundations — Knowledge check',  'A short quiz to reinforce what you learned.', 70),
  ('qq000003-0000-0000-0000-000000000000', 'cc000003-0000-0000-0000-000000000000', 'Watercolor practice — Knowledge check',     'A short quiz to reinforce what you learned.', 70),
  ('qq000004-0000-0000-0000-000000000000', 'cc000004-0000-0000-0000-000000000000', 'Product strategy — Knowledge check',        'A short quiz to reinforce what you learned.', 70),
  ('qq000005-0000-0000-0000-000000000000', 'cc000005-0000-0000-0000-000000000000', 'React architecture — Knowledge check',      'A short quiz to reinforce what you learned.', 70),
  ('qq000006-0000-0000-0000-000000000000', 'cc000006-0000-0000-0000-000000000000', 'Writing for the web — Knowledge check',     'A short quiz to reinforce what you learned.', 70);

-- Quiz questions (3 per quiz, same pattern as sampleQuiz())
-- Using quiz 1 as representative; all quizzes share the same question structure
DO $$
DECLARE
  quiz_ids UUID[] := ARRAY[
    'qq000001-0000-0000-0000-000000000000'::UUID,
    'qq000002-0000-0000-0000-000000000000'::UUID,
    'qq000003-0000-0000-0000-000000000000'::UUID,
    'qq000004-0000-0000-0000-000000000000'::UUID,
    'qq000005-0000-0000-0000-000000000000'::UUID,
    'qq000006-0000-0000-0000-000000000000'::UUID
  ];
  topics TEXT[] := ARRAY[
    'Typography essentials', 'TypeScript foundations', 'Watercolor practice',
    'Product strategy',      'React architecture',     'Writing for the web'
  ];
  qid UUID;
  q1 UUID; q2 UUID; q3 UUID; q4 UUID;
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    qid := quiz_ids[i];
    q1 := gen_uuid_v7();
    q2 := gen_uuid_v7();
    q3 := gen_uuid_v7();
    q4 := gen_uuid_v7();

    INSERT INTO quiz_questions (id, quiz_id, prompt, correct_option_keys, is_multi_select, explanation, sort_order) VALUES
      (q1, qid, format('Which best describes a key idea from "%s"?', topics[i]),
       ARRAY['b'], FALSE, 'Hierarchy and intent separate composed work from decorated work.', 0),
      (q2, qid, 'What''s the most useful first step when starting a new piece?',
       ARRAY['b'], FALSE, NULL, 1),
      (q3, qid, 'Restraint usually means…',
       ARRAY['a'], FALSE, NULL, 2),
      (q4, qid, 'Select all that apply: which are signs of strong work? (choose 2)',
       ARRAY['a','c'], TRUE, 'Strong work uses restraint — purposeful space and clear hierarchy.', 3);

    INSERT INTO quiz_options (question_id, option_key, text, sort_order) VALUES
      (q1, 'a', 'Decoration over composition',             0),
      (q1, 'b', 'Clear hierarchy and intentional choices', 1),
      (q1, 'c', 'Whatever the default looks like',         2),
      (q1, 'd', 'Maximum complexity, always',              3),
      (q2, 'a', 'Pick the most ornate option',             0),
      (q2, 'b', 'Define constraints and goals',            1),
      (q2, 'c', 'Skip planning entirely',                  2),
      (q2, 'd', 'Copy a competitor exactly',               3),
      (q3, 'a', 'Doing less, deliberately',                0),
      (q3, 'b', 'Adding more variations',                  1),
      (q3, 'c', 'Avoiding all decisions',                  2),
      (q3, 'd', 'Working faster',                          3),
      (q4, 'a', 'Intentional use of white space',          0),
      (q4, 'b', 'Maximum number of typefaces',             1),
      (q4, 'c', 'Consistent visual hierarchy',             2),
      (q4, 'd', 'Decoration for its own sake',             3);
  END LOOP;
END;
$$;

-- =============================================================================
-- PROMO CODES
-- =============================================================================

CREATE TYPE discount_type AS ENUM ('percent', 'fixed');

CREATE TABLE promo_codes (
  id             UUID          PRIMARY KEY DEFAULT gen_uuid_v7(),
  code           TEXT          NOT NULL UNIQUE,
  discount_type  discount_type NOT NULL DEFAULT 'percent',
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  max_uses       INTEGER,
  use_count      INTEGER       NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes (code) WHERE is_active;

INSERT INTO promo_codes (code, discount_type, discount_value) VALUES
  ('WELCOME',  'percent', 10),
  ('SUMMER20', 'percent', 20),
  ('STUDY50',  'percent', 50);

-- =============================================================================
-- LIVE SESSIONS
-- =============================================================================

CREATE TYPE session_status AS ENUM ('upcoming', 'live', 'ended');

CREATE TABLE live_sessions (
  id                UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  title             TEXT        NOT NULL,
  instructor        TEXT        NOT NULL,
  description       TEXT        NOT NULL DEFAULT '',
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER     NOT NULL CHECK (duration_minutes > 0),
  topic             TEXT        NOT NULL DEFAULT 'All Topics',
  join_url          TEXT        NOT NULL,
  -- Optional link to a course
  course_id         UUID                    REFERENCES courses (id) ON DELETE SET NULL,
  registered_count  INTEGER        NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
  max_attendees     INTEGER        NOT NULL CHECK (max_attendees > 0),
  list_price        NUMERIC(10,2)           CHECK (list_price >= 0),
  sale_price        NUMERIC(10,2)           CHECK (sale_price >= 0),
  status            content_status NOT NULL DEFAULT 'published',
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_live_sessions_scheduled_at ON live_sessions (scheduled_at);
CREATE INDEX idx_live_sessions_status       ON live_sessions (status);
CREATE INDEX idx_live_sessions_course_id    ON live_sessions (course_id);

CREATE TRIGGER trg_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Computed status view (avoids storing derived state)
CREATE OR REPLACE VIEW v_live_sessions AS
SELECT
  ls.*,
  CASE
    WHEN NOW() < ls.scheduled_at
      THEN 'upcoming'::session_status
    WHEN NOW() < ls.scheduled_at + (ls.duration_minutes * INTERVAL '1 minute')
      THEN 'live'::session_status
    ELSE 'ended'::session_status
  END AS status
FROM live_sessions ls;

-- =============================================================================
-- FEATURE FLAGS
-- =============================================================================

CREATE TABLE feature_flags (
  id          UUID        PRIMARY KEY DEFAULT gen_uuid_v7(),
  name        TEXT        NOT NULL UNIQUE,
  label       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO feature_flags (name, label, description, enabled) VALUES
  ('courses',       'Courses',       'Enable the courses catalog and all course detail pages.', TRUE),
  ('live_sessions', 'Live Sessions', 'Enable the live sessions section and the /live page.',    TRUE);

INSERT INTO live_sessions
  (title, instructor, description, scheduled_at, duration_minutes, topic, join_url, registered_count, max_attendees)
VALUES
  ('AI & Learning — Open Office Hours',
   'The Lumen Team',
   'Bring any question about courses, AI tools, or learning strategies. No agenda, all welcome.',
   '2026-05-04 12:00:00+00', 2880, 'All Topics',
   'https://meet.example.com/open-hours', 312, 500),

  ('Design Thinking Masterclass',
   'Elena Vasquez',
   'Explore design thinking frameworks with live exercises and a hands-on critique session.',
   '2026-05-07 15:00:00+00', 90, 'Design',
   'https://meet.example.com/design-masterclass', 127, 200),

  ('Python Bootcamp — Office Hours',
   'Marcus Chen',
   'Got questions from this week''s Python lessons? Bring them here. Live coding, live answers.',
   '2026-05-09 17:00:00+00', 60, 'Programming',
   'https://meet.example.com/python-office-hours', 84, 150),

  ('Business Strategy Workshop',
   'Aisha Okonkwo',
   'Build a 1-page business strategy using real-world frameworks. Collaborative and fast-paced.',
   '2026-05-12 14:00:00+00', 120, 'Business',
   'https://meet.example.com/strategy-workshop', 56, 100),

  ('Watercolor for Beginners — Live Demo',
   'Sofia Reyes',
   'Watch and paint along as Sofia walks you through your first watercolor piece, start to finish.',
   '2026-05-14 16:00:00+00', 75, 'Art',
   'https://meet.example.com/watercolor-demo', 203, 300);
