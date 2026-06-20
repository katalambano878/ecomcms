import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { sendGiftNotification } from '@/lib/notifications';

/**
 * Moolre payment callback for birthday gifts.
 *
 * There is no database for this campaign (by design), so this endpoint simply
 * acknowledges the webhook and logs the result. The funds are settled directly
 * into the configured Moolre merchant account regardless of this response.
 */
export async function POST(req: Request) {
    try {
        const clientId = getClientIdentifier(req);
        const rateLimitResult = checkRateLimit(`donate-callback:${clientId}`, RATE_LIMITS.callback);
        if (!rateLimitResult.success) {
            return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
        }

        let body: any = {};
        const contentType = req.headers.get('content-type') || '';
        try {
            if (contentType.includes('application/json')) {
                body = await req.json();
            } else if (contentType.includes('form')) {
                body = Object.fromEntries((await req.formData()).entries());
            } else {
                const raw = await req.text();
                try {
                    body = JSON.parse(raw);
                } catch {
                    body = Object.fromEntries(new URLSearchParams(raw).entries());
                }
            }
        } catch {
            // ignore parse errors; still acknowledge
        }

        const data = body?.data || {};
        const metadata = data.metadata || body.metadata || {};
        const reference = data.externalref || body.externalref || 'unknown';
        const amount = data.amount || data.value || body.amount || 'unknown';
        const payerPhone = data.payer || body.payer || '';
        const donorName = metadata.donor_name || '';
        const giftMessage = metadata.message || '';
        const success =
            body.status === 1 ||
            body.status === '1' ||
            data.txtstatus === 1 ||
            data.txtstatus === '1' ||
            String(body.message || '').toLowerCase().includes('success');

        console.log(
            `[Donate Callback] Ref: ${reference} | Amount: ${amount} | ${success ? 'SUCCESS' : 'FAILED/PENDING'}`
        );

        // Only notify the CEO when the payment actually succeeded. Email failures
        // must never break the webhook acknowledgement.
        if (success) {
            try {
                await sendGiftNotification({
                    amount,
                    donorName,
                    message: giftMessage,
                    payerPhone,
                    reference,
                });
            } catch (notifyError: any) {
                console.error('[Donate Callback] Gift notification failed:', notifyError?.message || notifyError);
            }
        }

        return NextResponse.json({ success: true, message: 'Acknowledged' });
    } catch (error: any) {
        console.error('[Donate Callback] Error:', error?.message || error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Queen birthday gift callback ready', timestamp: new Date().toISOString() });
}
