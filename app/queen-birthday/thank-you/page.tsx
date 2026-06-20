'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const CEO_NAME = 'Queen';

function formatCedis(n: number) {
  return `GH\u20B5 ${n.toLocaleString()}`;
}

function ThankYouContent() {
  const params = useSearchParams();
  const name = params.get('name')?.trim();
  const amountRaw = Number(params.get('amount'));
  const amount = Number.isFinite(amountRaw) && amountRaw > 0 ? amountRaw : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F1E7] px-5 py-16 text-center text-[#211C16]">
      <div className="mx-auto max-w-lg">
        <p className="text-xs font-medium uppercase tracking-[0.34em] text-[#9A7B43]">With heartfelt thanks</p>

        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#D8C49A] bg-white text-2xl text-[#7A1E2B] shadow-[0_20px_40px_-24px_rgba(33,28,22,0.5)]">
          <i className="ri-gift-line" />
        </div>

        <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
          Your gift is on its way
        </h1>

        <div className="mt-6 flex items-center justify-center gap-4">
          <span className="h-px w-10 bg-[#C6A65E]" />
          <span className="font-serif text-lg italic text-[#7A1E2B]">
            Thank you{name ? `, ${name}` : ''}
          </span>
          <span className="h-px w-10 bg-[#C6A65E]" />
        </div>

        {amount && (
          <p className="mt-5 text-[15px] text-[#5C5345]">
            <span className="font-semibold text-[#211C16]">{formatCedis(amount)}</span> gifted to {CEO_NAME}.
          </p>
        )}

        <p className="mt-4 text-[15px] leading-relaxed text-[#5C5345]">
          Your kindness just made {CEO_NAME}&apos;s birthday brighter. If your payment was completed, it has been
          received with so much love.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/queen-birthday"
            className="flex items-center gap-2 rounded-lg bg-[#7A1E2B] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#651521]"
          >
            <i className="ri-gift-line text-lg" />
            Send another gift
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-[#E2D6C0] bg-white px-6 py-3 font-semibold text-[#3A342B] transition hover:border-[#7A1E2B]/40 hover:text-[#7A1E2B]"
          >
            <i className="ri-home-4-line text-lg" />
            Back to home
          </Link>
        </div>

        <p className="mt-8 text-xs text-[#8A8070]">
          Payment securely processed by Moolre. If you closed the payment window before finishing, no charge was made.
        </p>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#F7F1E7]" />}>
      <ThankYouContent />
    </Suspense>
  );
}
