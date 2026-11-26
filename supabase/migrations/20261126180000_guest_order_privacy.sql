-- Queens Pretty Dolls Fashion: guest orders are no longer listable with the
-- public key (2026-11-26).
--
-- On Supabase, "Enable select for guest orders" (user_id IS NULL) and
-- "Enable select for guest order items" let anyone holding the public anon
-- key list every guest order with emails, phones and addresses through
-- /rest/v1 (embeds included). The pages that showed one order now load it
-- through the server route /api/orders/view (exact order number or id,
-- throttled per IP):
--   order success page   /order-success?order=<number>
--   order tracking       /order-tracking?order=<number>
--   payment link page    /pay/<id or number>
-- Checkout makes the order id itself and inserts without reading the row
-- back, and saves the customer record through /api/orders/customer.
-- Account order history (own rows), admin/staff pages, the Moolre payment
-- callback/verify routes, notifications and the payment-reminder cron are
-- unchanged: own rows and staff access stay, and the server routes use the
-- in-process service client.
--
-- Also checked, the way the Wholesale Queen fix did: customers (staff only),
-- support tickets/messages (own or staff), addresses, notifications,
-- carts/wishlists (own), profiles.role (already not writable by customers,
-- 20261125120000), TRUNCATE (already revoked). No chat tables here.
--
-- Idempotent. Run as the database owner (store_queensprettydollfashion):
--   (echo 'SET ROLE store_queensprettydollfashion;'; cat <this file>) | psql -v ON_ERROR_STOP=1 -d store_queensprettydollfashion

BEGIN;

-- 1. Guest orders and their items: no longer readable by everyone. A customer
--    still sees their own orders ("Users view own orders" / "Users view own
--    order items"), staff see all ("Staff manage ...").
DROP POLICY IF EXISTS "Enable select for guest orders" ON public.orders;
DROP POLICY IF EXISTS "Enable select for guest order items" ON public.order_items;

-- 2. Checkout adds its items right after creating the order. The old check
--    read the order through RLS (which a guest can no longer do) and let
--    anyone add items to ANY guest order. Now: only to a still-unpaid order
--    created in the last 2 hours that belongs to the caller (or is a guest
--    order placed while signed out). Staff keep "Staff manage order items".
CREATE OR REPLACE FUNCTION public.can_add_order_items(p_order_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
     WHERE o.id = p_order_id
       AND COALESCE(o.payment_status::text, 'pending') = 'pending'
       AND o.created_at > now() - interval '2 hours'
       AND ((auth.uid() IS NOT NULL AND o.user_id = auth.uid())
            OR (auth.uid() IS NULL AND o.user_id IS NULL))
  );
$function$;
REVOKE EXECUTE ON FUNCTION public.can_add_order_items(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_add_order_items(uuid) TO qpd_anon, qpd_authenticated;

DROP POLICY IF EXISTS "Enable insert for order items" ON public.order_items;
CREATE POLICY "Enable insert for order items" ON public.order_items FOR INSERT
  WITH CHECK (public.can_add_order_items(order_id));

-- 3. upsert_customer_from_order (SECURITY DEFINER) let a visitor overwrite
--    any customer's name, address and user id by email. Checkout now calls it
--    in-process (/api/orders/customer, details from the order just placed);
--    over /rest/v1 only staff may (admin till, lib/db/rest-policy.ts).
REVOKE EXECUTE ON FUNCTION public.upsert_customer_from_order(text, text, text, text, text, uuid, jsonb) FROM PUBLIC, qpd_anon;

-- 4. Profiles: no page inserts profiles from the browser (new profiles come
--    from the on_auth_user_created trigger); row-level security already
--    refused it, now the grant goes too.
REVOKE INSERT ON public.profiles FROM qpd_anon, qpd_authenticated;

COMMIT;
