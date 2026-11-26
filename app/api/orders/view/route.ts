import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { verifyAuth } from '@/lib/auth';
import { isRateLimited, rateLimitedResponse, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDER_NUMBER = /^[A-Za-z0-9_-]{4,64}$/;

/** What each page shows: order success and /pay/<id> all items, tracking items with a product photo. */
const SELECTS: Record<string, string> = {
    full: '*, order_items (*)',
    tracking:
        '*, order_items (id, product_name, variant_name, quantity, unit_price, metadata, products (product_images (url)))',
};

const NO_STORE = { 'Cache-Control': 'no-store' };

function notFound() {
    return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: NO_STORE });
}

/**
 * One order (with its items) for the order-success, order-tracking and
 * /pay/<id> pages.
 *
 * Guest orders are no longer readable through /rest/v1 (anyone with the
 * public key could list every guest's email, phone and address). The pages
 * ask here for the single order in their link: by exact order id or order
 * number, never a list or a pattern. A guest order is shown to whoever holds
 * its number (as before); an order placed while signed in only to that
 * account or staff (as before, through row-level security). Throttled per
 * client IP so order numbers cannot be enumerated.
 *
 *   GET /api/orders/view?ref=<order number or id>[&view=tracking][&email=...]
 *
 * With `email`, the order's email must match (order tracking form).
 */
export async function GET(request: Request) {
    if (isRateLimited(request, 'order-view', RATE_LIMITS.lookup)) return rateLimitedResponse();

    const params = new URL(request.url).searchParams;
    const ref = (params.get('ref') || '').trim();
    if (!ref || (!UUID.test(ref) && !ORDER_NUMBER.test(ref))) return notFound();
    const select = SELECTS[params.get('view') || 'full'] || SELECTS.full;
    const email = (params.get('email') || '').trim().toLowerCase();

    const supabase = createServerSupabase('service');
    const { data: order, error } = await supabase
        .from('orders')
        .select(select)
        .eq(UUID.test(ref) ? 'id' : 'order_number', ref)
        .maybeSingle();
    if (error) {
        console.error('[orders/view] lookup failed:', error.message);
        return NextResponse.json({ error: 'Could not load the order' }, { status: 500, headers: NO_STORE });
    }
    if (!order) return notFound();

    if (order.user_id) {
        const auth = await verifyAuth(request);
        let allowed = !!auth.authenticated && auth.user?.id === order.user_id;
        if (!allowed && auth.authenticated) {
            const staff = await verifyAuth(request, { requireRole: ['admin', 'staff'] });
            allowed = staff.authenticated;
        }
        if (!allowed) return notFound();
    }

    if (email && String(order.email || '').trim().toLowerCase() !== email) {
        return NextResponse.json({ error: 'email_mismatch' }, { status: 403, headers: NO_STORE });
    }

    return NextResponse.json(order, { headers: NO_STORE });
}
