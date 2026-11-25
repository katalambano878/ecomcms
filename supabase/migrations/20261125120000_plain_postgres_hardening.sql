-- Queens Pretty Dolls Fashion on plain Postgres: database changes that go
-- with the move off Supabase (2026-11-25). Safe to run twice. Run as the
-- database owner (store_queensprettydollfashion).

-- 1. Sessions can be revoked (sign-out everywhere, password change).
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;

-- 2. A customer can no longer change their own role: only these profile
--    columns are writable from the browser.
REVOKE UPDATE ON public.profiles FROM qpd_anon, qpd_authenticated;
GRANT UPDATE (email, full_name, phone, avatar_url, date_of_birth, gender, preferences, updated_at)
  ON public.profiles TO qpd_authenticated;

-- 3. Orders created from the browser always start unpaid. (Staff sales at the
--    till go through the staff policy.)
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
CREATE POLICY "Enable insert for all users" ON public.orders FOR INSERT WITH CHECK (
  ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR (auth.uid() IS NULL AND user_id IS NULL))
  AND COALESCE(payment_status::text, 'pending') = 'pending');

-- 4. Marking an order paid: staff and the server only.
CREATE OR REPLACE FUNCTION public.mark_order_paid(order_ref text, moolre_ref text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_order orders;
BEGIN
  IF auth.role() IS NOT NULL AND auth.role() <> 'service_role' AND NOT public.is_admin_or_staff() THEN
    RAISE EXCEPTION 'Only staff can mark orders paid' USING ERRCODE = '42501';
  END IF;
  UPDATE orders SET payment_status = 'paid',
    status = CASE WHEN status = 'pending' THEN 'processing'::order_status WHEN status = 'awaiting_payment' THEN 'processing'::order_status ELSE status END,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('moolre_reference', moolre_ref, 'payment_verified_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
  WHERE order_number = order_ref RETURNING * INTO updated_order;
  IF updated_order.id IS NOT NULL THEN
    IF (updated_order.metadata->>'stock_reduced') IS NULL THEN
      UPDATE products p SET quantity = GREATEST(0, p.quantity - oi.quantity) FROM order_items oi WHERE oi.order_id = updated_order.id AND oi.product_id = p.id;
      UPDATE product_variants pv SET quantity = GREATEST(0, pv.quantity - oi.quantity) FROM order_items oi WHERE oi.order_id = updated_order.id AND oi.product_id = pv.product_id AND oi.variant_name IS NOT NULL AND oi.variant_name = pv.name;
      UPDATE orders SET metadata = metadata || '{"stock_reduced": true}'::jsonb WHERE id = updated_order.id;
    END IF;
  ELSE
    SELECT * INTO updated_order FROM orders WHERE order_number = order_ref;
  END IF;
  RETURN to_jsonb(updated_order);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.mark_order_paid(text, text) FROM PUBLIC, qpd_anon;
GRANT EXECUTE ON FUNCTION public.mark_order_paid(text, text) TO qpd_authenticated;

-- 5. Server-only functions are not callable by browser roles.
REVOKE EXECUTE ON FUNCTION public.update_customer_stats(text, numeric), public.reduce_stock_on_order(uuid),
  public.get_all_customer_emails(), public.get_all_customer_phones(), public.get_platform_analytics()
  FROM PUBLIC, qpd_anon, qpd_authenticated;

-- 6. Settings that hold integration keys are staff-only; coupon codes are
--    staff-only; only staff switch dashboard modules.
DROP POLICY IF EXISTS "Staff view settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public read settings" ON public.store_settings;
CREATE POLICY "Public read settings" ON public.store_settings FOR SELECT
  USING (key NOT LIKE 'integration\_%' OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Allow anon read access to coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow authenticated read access to coupons" ON public.coupons;
DROP POLICY IF EXISTS "Staff read coupons" ON public.coupons;
CREATE POLICY "Staff read coupons" ON public.coupons FOR SELECT TO qpd_authenticated
  USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Allow authenticated update" ON public.store_modules;
DROP POLICY IF EXISTS "Staff update store_modules" ON public.store_modules;
CREATE POLICY "Staff update store_modules" ON public.store_modules FOR UPDATE TO qpd_authenticated
  USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

-- 7. Browser roles never need these table privileges.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM qpd_anon, qpd_authenticated;
