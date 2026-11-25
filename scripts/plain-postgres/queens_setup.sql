-- Queens Pretty Dolls Fashion on plain Postgres: what the in-app data layer
-- needs from the database. Same access as on hosted Supabase; no policy is
-- loosened or tightened here (the hardening the owner may choose is listed
-- separately in the port report).
--
-- Safe to run twice. Run as a role that may grant on these objects
-- (postgres, or the owner store_queensprettydollfashion for its own tables):
--   psql -v ON_ERROR_STOP=1 -d store_queensprettydollfashion -f scripts/plain-postgres/queens_setup.sql

-- 1. Revocable sessions (sign out everywhere, password change, bans).
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;

-- 2. The browser roles, and the app role may switch to them
--    (lib/db/rls.ts runs every /rest/v1 request as SET LOCAL ROLE).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qpd_anon') THEN
    CREATE ROLE qpd_anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qpd_authenticated') THEN
    CREATE ROLE qpd_authenticated NOLOGIN;
  END IF;
END $$;
GRANT qpd_anon, qpd_authenticated TO store_queensprettydollfashion;

-- 3. Schemas: auth for auth.uid()/auth.role() in policies, extensions for
--    uuid_generate_v4() column defaults on browser inserts.
GRANT USAGE ON SCHEMA public, auth TO qpd_anon, qpd_authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA extensions TO qpd_anon, qpd_authenticated';
  END IF;
END $$;

-- 4. Table privileges, only on the 14 tables the data API exposes
--    (PUBLIC_TABLES in lib/db/fk-map.ts). Row-level security still decides
--    which rows each role sees or writes, exactly as on Supabase.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.banners, public.categories, public.cms_content, public.coupons,
  public.customers, public.order_items, public.orders, public.product_images,
  public.product_variants, public.products, public.profiles, public.reviews,
  public.store_modules, public.store_settings
  TO qpd_anon, qpd_authenticated;

-- 5. Policies written for Supabase's `anon` / `authenticated` roles apply to
--    the new browser roles instead (coupons and store_modules in the tables
--    above; the susu_* / payments tables too). Role lists are rewritten
--    one-for-one; policies for PUBLIC or service_role are left alone.
DO $$
DECLARE
  p record;
  new_roles text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, roles
      FROM pg_policies
     WHERE schemaname = 'public'
       AND (roles && ARRAY['anon', 'authenticated']::name[])
  LOOP
    SELECT string_agg(
             quote_ident(CASE r WHEN 'anon' THEN 'qpd_anon'
                                WHEN 'authenticated' THEN 'qpd_authenticated'
                                ELSE r::text END), ', ')
      INTO new_roles
      FROM unnest(p.roles) AS r;
    EXECUTE format('ALTER POLICY %I ON %I.%I TO %s', p.policyname, p.schemaname, p.tablename, new_roles);
  END LOOP;
END $$;
