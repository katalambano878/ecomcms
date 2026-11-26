import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { isRateLimited, rateLimitedResponse, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * Checkout's customer record (upsert_customer_from_order), made from the
 * order checkout has just placed.
 *
 * The browser used to call the function itself with whatever email, name,
 * address and user id it liked, so anyone could overwrite any customer's
 * details or tie them to another account. Now /rest/v1 lets only staff call
 * it (the admin till), and checkout posts just the new order's id here: the
 * details and user id come from that order (whose user_id row-level security
 * fixed at insert), and only for a still-unpaid order from the last 2 hours.
 *
 *   POST /api/orders/customer  { "orderId": "<uuid>" }
 */
export async function POST(request: Request) {
    if (isRateLimited(request, 'order-customer', RATE_LIMITS.form)) return rateLimitedResponse();

    const body = await request.json().catch(() => null);
    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : '';
    if (!UUID.test(orderId)) return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: NO_STORE });

    const supabase = createServerSupabase('service');
    const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: order, error } = await supabase
        .from('orders')
        .select('id, user_id, email, phone, payment_status, created_at, shipping_address')
        .eq('id', orderId)
        .gte('created_at', since)
        .maybeSingle();
    if (error) {
        console.error('[orders/customer] lookup failed:', error.message);
        return NextResponse.json({ error: 'Could not save the customer' }, { status: 500, headers: NO_STORE });
    }
    if (!order || (order.payment_status && order.payment_status !== 'pending')) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: NO_STORE });
    }

    const address = order.shipping_address && typeof order.shipping_address === 'object' ? order.shipping_address : null;
    const firstName = String(address?.firstName || '').trim();
    const lastName = String(address?.lastName || '').trim();
    const { error: rpcError } = await supabase.rpc('upsert_customer_from_order', {
        p_email: order.email,
        p_phone: order.phone,
        p_full_name: `${firstName} ${lastName}`.trim(),
        p_first_name: firstName,
        p_last_name: lastName,
        p_user_id: order.user_id || null,
        p_address: address,
    });
    if (rpcError) {
        console.error('[orders/customer] upsert failed:', rpcError.message);
        return NextResponse.json({ error: 'Could not save the customer' }, { status: 500, headers: NO_STORE });
    }
    return NextResponse.json({ success: true }, { headers: NO_STORE });
}
