'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

        {/* Queen's photo */}
        <div className="mx-auto mt-7 w-fit">
          <div className="bg-white p-2.5 shadow-[0_30px_60px_-30px_rgba(33,28,22,0.45)]">
            <div className="border border-[#D8C49A] p-1.5">
              <Image
                src="/images/queen-thankyou.png"
                alt={`${CEO_NAME}`}
                width={360}
                height={480}
                priority
                className="block h-auto w-56 object-cover sm:w-64"
              />
            </div>
          </div>
        </div>

        <h1 className="mt-7 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
          Thank you{name ? `, ${name}` : ''}
        </h1>

        <div className="mt-5 flex items-center justify-center gap-4">
          <span className="h-px w-10 bg-[#C6A65E]" />
          <span className="font-serif text-lg italic text-[#7A1E2B]">A note from {CEO_NAME}</span>
          <span className="h-px w-10 bg-[#C6A65E]" />
        </div>

        {/* Queen's personal message */}
        <p className="mt-5 font-serif text-lg italic leading-relaxed text-[#43392E] sm:text-xl">
          &ldquo;Thank you so much for your gift and support. You&apos;ve made my day extra special and truly
          memorable. I appreciate your kindness and generosity. May you be blessed abundantly.&rdquo;
        </p>
        <p className="mt-3 font-handwriting text-2xl text-[#7A1E2B]">{CEO_NAME}</p>

        {amount && (
          <p className="mt-6 text-[15px] text-[#5C5345]">
            <span className="font-semibold text-[#211C16]">{formatCedis(amount)}</span> gifted to {CEO_NAME}.
          </p>
        )}

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
