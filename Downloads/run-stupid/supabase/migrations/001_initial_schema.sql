-- ============================================================
-- Run Stupid — Supabase Initial Schema
-- Run this migration in: Supabase Dashboard > SQL Editor
-- or via: supabase db push
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. USER PROFILES (extends auth.users)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url  TEXT,
  bio         TEXT,
  rank        TEXT NOT NULL DEFAULT 'ROOKIE',  -- ROOKIE | PACK ALPHA | ELITE
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on new sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 2. ACTIVITIES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('Run','Ride','Walk','Swim','Hike','Yoga','Squad Session')),
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  distance_km       NUMERIC(8, 3),
  duration_seconds  INTEGER,
  avg_pace_sec_km   INTEGER,   -- seconds per km
  elevation_m       NUMERIC(8, 1),
  avg_power_w       INTEGER,   -- watts (cycling)
  avg_speed_km_h    NUMERIC(6, 2),
  map_image_url     TEXT,
  segment_name      TEXT,      -- Strava-style named segments
  is_upcoming       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Squad participants (many-to-many)
CREATE TABLE IF NOT EXISTS activity_participants (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_id, user_id)
);

-- ────────────────────────────────────────────────────────────
-- 3. KUDOS  (one row per user per activity)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kudos (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (activity_id, user_id)
);

-- Denormalised kudos count — kept in sync by trigger
ALTER TABLE activities ADD COLUMN IF NOT EXISTS kudos_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION sync_kudos_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities SET kudos_count = kudos_count + 1 WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities SET kudos_count = GREATEST(kudos_count - 1, 0) WHERE id = OLD.activity_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_kudos_count ON kudos;
CREATE TRIGGER trg_kudos_count
  AFTER INSERT OR DELETE ON kudos
  FOR EACH ROW EXECUTE PROCEDURE sync_kudos_count();

-- ────────────────────────────────────────────────────────────
-- 4. COMMENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE activities ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION sync_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities SET comment_count = comment_count + 1 WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.activity_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_count ON comments;
CREATE TRIGGER trg_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE PROCEDURE sync_comment_count();

-- ────────────────────────────────────────────────────────────
-- 5. CLUBS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clubs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  location    TEXT,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_members (
  club_id    UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

-- Convenience view: clubs with member count
CREATE OR REPLACE VIEW clubs_with_count AS
SELECT c.*, COUNT(cm.user_id)::INT AS member_count
FROM clubs c
LEFT JOIN club_members cm ON cm.club_id = c.id
GROUP BY c.id;

-- ────────────────────────────────────────────────────────────
-- 6. CHALLENGES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  image_url    TEXT,
  target_value NUMERIC,
  target_unit  TEXT,         -- 'km', 'm_elevation', 'count'
  starts_at    TIMESTAMPTZ,
  ends_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress     NUMERIC NOT NULL DEFAULT 0,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (challenge_id, user_id)
);

-- ────────────────────────────────────────────────────────────
-- 7. FOLLOWER GRAPH
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- ────────────────────────────────────────────────────────────
-- 8. ROW-LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities            ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows               ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_update"   ON profiles FOR UPDATE USING (auth.uid() = id);

-- Activities: public read, own insert/update/delete
CREATE POLICY "activities_public_read"   ON activities FOR SELECT USING (true);
CREATE POLICY "activities_own_insert"    ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_own_update"    ON activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "activities_own_delete"    ON activities FOR DELETE USING (auth.uid() = user_id);

-- Kudos: public read, authenticated insert/delete own
CREATE POLICY "kudos_public_read"  ON kudos FOR SELECT USING (true);
CREATE POLICY "kudos_own_insert"   ON kudos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "kudos_own_delete"   ON kudos FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, own insert/delete
CREATE POLICY "comments_public_read"  ON comments FOR SELECT USING (true);
CREATE POLICY "comments_own_insert"   ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_own_delete"   ON comments FOR DELETE USING (auth.uid() = user_id);

-- Clubs: public read, members can manage their own membership
CREATE POLICY "clubs_public_read"       ON clubs FOR SELECT USING (true);
CREATE POLICY "clubs_auth_insert"       ON clubs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "club_members_pub_read"   ON club_members FOR SELECT USING (true);
CREATE POLICY "club_members_own_insert" ON club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "club_members_own_delete" ON club_members FOR DELETE USING (auth.uid() = user_id);

-- Challenges: public read
CREATE POLICY "challenges_public_read" ON challenges FOR SELECT USING (true);
CREATE POLICY "challenge_p_public_read" ON challenge_participants FOR SELECT USING (true);
CREATE POLICY "challenge_p_own_insert"  ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Follows: public read, own insert/delete
CREATE POLICY "follows_public_read" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_own_insert"  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_own_delete"  ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ────────────────────────────────────────────────────────────
-- 9. INDEXES  (performance)
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_activities_user_id    ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_started_at ON activities(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_kudos_activity        ON kudos(activity_id);
CREATE INDEX IF NOT EXISTS idx_comments_activity     ON comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club     ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_follows_following     ON follows(following_id);
