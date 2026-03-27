-- ═══════════════════════════════════════════════════════════════════
-- TERANGABIZ — SCHÉMA SUPABASE v3 (COMPLET + CORRIGÉ)
-- Exécute ce script dans Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════

-- ─── RESET PROPRE (décommente si tu recommences depuis zéro) ──────
-- DROP TABLE IF EXISTS interventions CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS sales CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLE: profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL DEFAULT '',
  business_name TEXT DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  sectors       TEXT[] DEFAULT '{}',
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter business_name si la table existe déjà (migration)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT '';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ─── TABLE: clients ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  notes       TEXT,
  total_spent NUMERIC DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLE: sales ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name  TEXT NOT NULL,
  sector       TEXT,
  category     TEXT,
  product      TEXT NOT NULL,
  sale_price   NUMERIC NOT NULL DEFAULT 0,
  buy_price    NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  profit       NUMERIC GENERATED ALWAYS AS (sale_price - buy_price - COALESCE(delivery_fee, 0)) STORED,
  notes        TEXT,
  sale_date    DATE DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLE: subscriptions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name   TEXT NOT NULL,
  sub_type      TEXT NOT NULL DEFAULT 'wifi' CHECK (sub_type IN ('wifi', 'iptv', 'other')),
  service_name  TEXT NOT NULL,
  login         TEXT,
  password      TEXT,
  expiry_date   DATE NOT NULL,
  monthly_fee   NUMERIC DEFAULT 0,
  notes         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLE: interventions (Support IT & Réseaux) ──────────────────
CREATE TABLE IF NOT EXISTS interventions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name       TEXT NOT NULL,
  client_phone      TEXT,
  category          TEXT NOT NULL,
  description       TEXT NOT NULL,
  location          TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  fee               NUMERIC DEFAULT 0,
  parts_cost        NUMERIC DEFAULT 0,
  profit            NUMERIC GENERATED ALWAYS AS (fee - COALESCE(parts_cost, 0)) STORED,
  notes             TEXT,
  intervention_date DATE DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions  ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON profiles;

CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- CLIENTS
DROP POLICY IF EXISTS "clients_own"       ON clients;
DROP POLICY IF EXISTS "clients_admin_sel" ON clients;
CREATE POLICY "clients_own"       ON clients FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "clients_admin_sel" ON clients FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- SALES
DROP POLICY IF EXISTS "sales_own"       ON sales;
DROP POLICY IF EXISTS "sales_admin_sel" ON sales;
CREATE POLICY "sales_own"       ON sales FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "sales_admin_sel" ON sales FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "subs_own"       ON subscriptions;
DROP POLICY IF EXISTS "subs_admin_sel" ON subscriptions;
CREATE POLICY "subs_own"       ON subscriptions FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "subs_admin_sel" ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- INTERVENTIONS
DROP POLICY IF EXISTS "interventions_own"       ON interventions;
DROP POLICY IF EXISTS "interventions_admin_sel" ON interventions;
CREATE POLICY "interventions_own"       ON interventions FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "interventions_admin_sel" ON interventions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_subs_updated_at ON subscriptions;
CREATE TRIGGER trg_subs_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_interventions_updated_at ON interventions;
CREATE TRIGGER trg_interventions_updated_at BEFORE UPDATE ON interventions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger auto-création profil
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, business_name, role, sectors)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    '{}'::TEXT[]
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_clients_user_id        ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name            ON clients(name);
CREATE INDEX IF NOT EXISTS idx_sales_user_id           ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_date              ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_created           ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_subs_user_id            ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_expiry             ON subscriptions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_interventions_user_id   ON interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status    ON interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_date      ON interventions(intervention_date);

-- ═══════════════════════════════════════════════════════════════════
-- CRÉER LE COMPTE ADMIN (après déploiement)
-- 1. Supabase → Authentication → Users → Add User
--    Email: admin@terangabiz.sn | Password: Admin@TerangaBiz2024!
--    ✅ Cocher "Auto Confirm User"
-- 2. Exécuter:
--    UPDATE profiles SET role = 'admin' WHERE email = 'admin@terangabiz.sn';
-- ═══════════════════════════════════════════════════════════════════
