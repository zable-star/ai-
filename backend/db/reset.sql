-- Drop all tables and start fresh (USE WITH CAUTION!)

DROP TABLE IF EXISTS drawings CASCADE;
DROP TABLE IF EXISTS model_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recreate from schema
-- Run: psql -U postgres -d voice_drawing -f db/reset.sql
-- Then: psql -U postgres -d voice_drawing -f db/schema.sql
