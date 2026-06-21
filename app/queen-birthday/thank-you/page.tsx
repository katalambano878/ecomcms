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
    <main className="flex min-h-screen items-center justify-center bg-[#FFF5F8] px-5 py-16 text-center text-[#3A1E2E]">
      <div className="mx-auto max-w-lg">
        <p className="text-xs font-medium uppercase tracking-[0.34em] text-[#C2548A]">With heartfelt thanks</p>

        {/* Queen's photo */}
        <div className="mx-auto mt-7 w-fit">
          <div className="bg-white p-2.5 shadow-[0_30px_60px_-30px_rgba(214,65,138,0.35)]">
            <div className="border border-[#F3C6DA] p-1.5">
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
          <span className="h-px w-10 bg-[#E89BBE]" />
          <span className="font-serif text-lg italic text-[#D6418A]">A note from {CEO_NAME}</span>
          <span className="h-px w-10 bg-[#E89BBE]" />
        </div>

        {/* Queen's personal message */}
        <p className="mt-5 font-serif text-lg italic leading-relaxed text-[#5A3A48] sm:text-xl">
          &ldquo;Thank you so much for your gift and support. You&apos;ve made my day extra special and truly
          memorable. I appreciate your kindness and generosity. May you be blessed abundantly.&rdquo;
        </p>
        <p className="mt-3 font-handwriting text-2xl text-[#D6418A]">{CEO_NAME}</p>

        <div className="mx-auto mt-8 max-w-md border-t border-[#F0D2DF] pt-7 text-[15px] leading-relaxed text-[#6E5862]">
          <p>
            Your name will forever be written in the record books of Queensprettydolls Fashion as one of the first
            people to use our website on its launch day. That&apos;s not just support &mdash; that&apos;s history.
          </p>
          <p className="mt-4">
            Years from now, when people talk about how this brand grew, you&apos;ll be able to proudly say,{' '}
            <span className="italic text-[#5A3A48]">&ldquo;I was there from the beginning.&rdquo;</span> And that,
            without a doubt, is the biggest bragging right of all.
          </p>
        </div>

        {amount && (
          <p className="mt-6 text-[15px] text-[#6E5862]">
            <span className="font-semibold text-[#3A1E2E]">{formatCedis(amount)}</span> gifted to {CEO_NAME}.
          </p>
        )}

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/queen-birthday"
            className="flex items-center gap-2 rounded-lg bg-[#D6418A] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#BC2F73]"
          >
            <i className="ri-gift-line text-lg" />
            Send another gift
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-[#F0D2DF] bg-white px-6 py-3 font-semibold text-[#5A3A48] transition hover:border-[#D6418A]/40 hover:text-[#D6418A]"
          >
            <i className="ri-home-4-line text-lg" />
            Back to home
          </Link>
        </div>

        <p className="mt-8 text-xs text-[#A08591]">
          Payment securely processed by Moolre. If you closed the payment window before finishing, no charge was made.
        </p>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#FFF5F8]" />}>
      <ThankYouContent />
    </Suspense>
  );
}
