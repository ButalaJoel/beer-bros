-- Run once in Neon SQL Editor as neondb_owner before deploying the admin console.
-- Keeps runtime grants scoped to the existing least-privilege API role.
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(120) NOT NULL,
  body varchar(2000) NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS announcements_active_idx ON announcements (starts_at DESC) WHERE status='published';
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id bigserial PRIMARY KEY,
  admin_user_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_recent_idx ON admin_audit_log (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON announcements, admin_audit_log TO beer_bros_app;
GRANT USAGE, SELECT ON SEQUENCE admin_audit_log_id_seq TO beer_bros_app;
