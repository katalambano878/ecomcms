import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

// Birthday gift campaign limits (GHS). Hardcoded per request.
const MIN_AMOUNT = 200;
const MAX_AMOUNT = 20000;

export async function POST(req: Request) {
    try {
        // Rate limiting (reuse the strict payment limits)
        const clientId = getClientIdentifier(req);
        const rateLimitResult = checkRateLimit(`donate:${clientId}`, RATE_LIMITS.payment);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { success: false, message: 'Too many requests. Please slow down and try again shortly.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimitResult.resetIn.toString(),
                    },
                }
            );
        }

        const body = await req.json().catch(() => ({}));
        const rawAmount = body?.amount;
        const donorName = String(body?.donorName ?? '').trim().slice(0, 80);
        const message = String(body?.message ?? '').trim().slice(0, 280);

        // Validate amount
        const amount = Math.round(Number(rawAmount));
        if (!Number.isFinite(amount) || Number.isNaN(amount)) {
            return NextResponse.json({ success: false, message: 'Please enter a valid amount.' }, { status: 400 });
        }
        if (amount < MIN_AMOUNT) {
            return NextResponse.json(
                { success: false, message: `Minimum gift is GH\u20B5 ${MIN_AMOUNT}.` },
                { status: 400 }
            );
        }
        if (amount > MAX_AMOUNT) {
            return NextResponse.json(
                { success: false, message: `Maximum gift is GH\u20B5 ${MAX_AMOUNT.toLocaleString()}.` },
                { status: 400 }
            );
        }

        // Ensure Moolre is configured
        if (!process.env.MOOLRE_API_USER || !process.env.MOOLRE_API_PUBKEY || !process.env.MOOLRE_ACCOUNT_NUMBER) {
            console.error('[Donate] Missing Moolre credentials');
            return NextResponse.json(
                { success: false, message: 'Payment gateway is not configured.' },
                { status: 500 }
            );
        }

        const requestUrl = new URL(req.url);
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin).replace(/\/+$/, '');

        // Unique reference for this gift (no DB; reference is just for tracking on Moolre)
        const reference = `GIFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const successQuery = new URLSearchParams({
            ref: reference,
            amount: String(amount),
            ...(donorName ? { name: donorName } : {}),
        }).toString();

        const payload = {
            type: 1,
            amount: amount.toString(),
            email: process.env.MOOLRE_MERCHANT_EMAIL || 'wepedam@gmail.com',
            externalref: reference,
            callback: `${baseUrl}/api/donate/callback`,
            redirect: `${baseUrl}/queen-birthday/thank-you?${successQuery}`,
            reusable: '0',
            currency: 'GHS',
            accountnumber: process.env.MOOLRE_ACCOUNT_NUMBER,
            metadata: {
                purpose: 'queen_birthday_gift',
                donor_name: donorName || 'Anonymous',
                message: message || '',
            },
        };

        console.log('[Donate] Initiating gift | Ref:', reference, '| Amount:', amount, '| Donor:', donorName || 'Anonymous');

        const response = await fetch('https://api.moolre.com/embed/link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-USER': process.env.MOOLRE_API_USER,
                'X-API-PUBKEY': process.env.MOOLRE_API_PUBKEY,
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log('[Donate] Moolre status:', result.status, '| Has URL:', !!result.data?.authorization_url);

        if (result.status === 1 && result.data?.authorization_url) {
            return NextResponse.json({
                success: true,
                url: result.data.authorization_url,
                reference: result.data.reference || reference,
            });
        }

        return NextResponse.json(
            { success: false, message: result.message || 'Could not start your gift payment. Please try again.' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('[Donate] Error:', error?.message || error);
        return NextResponse.json(
            { success: false, message: error?.message || 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
