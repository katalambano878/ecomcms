import { supabase } from '@/lib/supabase';

/**
 * Load one order (with order_items) for the order-success, order-tracking and
 * pay pages via /api/orders/view. Sends the session token when signed in, so
 * orders placed from an account load for that account. Same { data, error }
 * shape as the supabase-js query it replaces; `error.message` is
 * 'email_mismatch' when `email` was given and does not match the order.
 */
export async function fetchOrderForView(
    ref: string,
    options: { view?: 'full' | 'tracking'; email?: string } = {}
): Promise<{ data: any | null; error: Error | null }> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const qs = new URLSearchParams({ ref });
        if (options.view) qs.set('view', options.view);
        if (options.email) qs.set('email', options.email);
        const res = await fetch(`/api/orders/view?${qs.toString()}`, {
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
            cache: 'no-store',
        });
        if (!res.ok) {
            const body = await res.json().catch(() => null);
            if (body?.error === 'email_mismatch') return { data: null, error: new Error('email_mismatch') };
            return { data: null, error: new Error(res.status === 404 ? 'Order not found' : `Order lookup failed (${res.status})`) };
        }
        return { data: await res.json(), error: null };
    } catch (e: any) {
        return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
    }
}
