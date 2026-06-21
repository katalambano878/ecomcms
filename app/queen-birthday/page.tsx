'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';

const MIN_AMOUNT = 200;
const MAX_AMOUNT = 20000;
const PRESETS = [200, 500, 1000, 2000, 5000, 10000];

const CEO_NAME = 'Queen';
const BIRTHDAY_LABEL = '21 June 2026';

function formatCedis(n: number) {
  return `GH\u20B5 ${n.toLocaleString()}`;
}

export default function QueenBirthdayPage() {
  const [amount, setAmount] = useState<number | ''>(500);
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = typeof amount === 'number' ? amount : 0;

  const amountError = useMemo(() => {
    if (amount === '' || numericAmount === 0) return null;
    if (numericAmount < MIN_AMOUNT) return `Minimum gift is ${formatCedis(MIN_AMOUNT)}.`;
    if (numericAmount > MAX_AMOUNT) return `Maximum gift is ${formatCedis(MAX_AMOUNT)}.`;
    return null;
  }, [amount, numericAmount]);

  const canSubmit = numericAmount >= MIN_AMOUNT && numericAmount <= MAX_AMOUNT && !submitting;

  const handleAmountInput = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setAmount(cleaned === '' ? '' : Number(cleaned));
  };

  const handleDonate = async () => {
    setError(null);
    if (numericAmount < MIN_AMOUNT) {
      setError(`Minimum gift is ${formatCedis(MIN_AMOUNT)}.`);
      return;
    }
    if (numericAmount > MAX_AMOUNT) {
      setError(`Maximum gift is ${formatCedis(MAX_AMOUNT)}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numericAmount, donorName, message }),
      });
      const data = await res.json();
      if (!data.success || !data.url) {
        throw new Error(data.message || 'Could not start your gift. Please try again.');
      }
      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF5F8] text-[#3A1E2E]">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          {/* Left: matted portrait + tribute */}
          <div className="text-center lg:text-left">
            <div className="mx-auto w-fit lg:mx-0">
              {/* Matted photo frame */}
              <div className="bg-white p-3 shadow-[0_30px_60px_-30px_rgba(214,65,138,0.35)]">
                <div className="border border-[#F3C6DA] p-1.5">
                  <Image
                    src="/images/queen.png"
                    alt={`${CEO_NAME}, our CEO`}
                    width={520}
                    height={660}
                    priority
                    className="block h-auto w-72 object-cover sm:w-80 lg:w-[21rem]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="font-serif text-2xl italic text-[#D6418A]">Happy Birthday,</p>
              <h1 className="mt-1 font-serif text-6xl font-semibold leading-none tracking-tight sm:text-7xl">
                {CEO_NAME}
              </h1>

              {/* Invitation-style date rule */}
              <div className="mt-6 flex items-center justify-center gap-4 lg:justify-start">
                <span className="h-px w-10 bg-[#E89BBE]" />
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-[#C2548A]">
                  {BIRTHDAY_LABEL}
                </span>
                <span className="h-px w-10 bg-[#E89BBE]" />
              </div>

              <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-[#6E5862] lg:mx-0">
                Today we celebrate the heart behind everything we do. Join us in honouring our Queen with a
                heartfelt birthday gift. Every contribution, however small, helps make her day truly special.
              </p>
            </div>
          </div>

          {/* Right: donation card */}
          <div className="rounded-2xl border border-[#F3D4E2] bg-white p-6 shadow-[0_40px_80px_-50px_rgba(214,65,138,0.45)] sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">Send Your Birthday Gift</h2>
            <p className="mt-1.5 text-sm text-[#8A6E7A]">
              Choose an amount from {formatCedis(MIN_AMOUNT)} to {formatCedis(MAX_AMOUNT)}.
            </p>

            {/* Preset chips */}
            <div className="mt-6 grid grid-cols-3 gap-2.5">
              {PRESETS.map((preset) => {
                const active = amount === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`rounded-lg border px-2 py-3 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-[#D6418A] bg-[#D6418A] text-white'
                        : 'border-[#F0D2DF] bg-[#FDEEF4] text-[#5A3A48] hover:border-[#D6418A]/50 hover:text-[#D6418A]'
                    }`}
                  >
                    {preset.toLocaleString()}
                  </button>
                );
              })}
            </div>

            {/* Custom amount */}
            <div className="mt-5">
              <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-[#6A4A58]">
                Or enter a custom amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-[#D6418A]">
                  &#8373;
                </span>
                <input
                  id="amount"
                  inputMode="numeric"
                  value={amount === '' ? '' : amount}
                  onChange={(e) => handleAmountInput(e.target.value)}
                  placeholder="500"
                  className="w-full rounded-lg border border-[#F0D2DF] bg-[#FDEEF4] py-3.5 pl-10 pr-4 text-lg font-semibold text-[#3A1E2E] placeholder-[#CBA8BA] outline-none transition focus:border-[#D6418A] focus:ring-2 focus:ring-[#D6418A]/15"
                />
              </div>
              {amountError && <p className="mt-2 text-sm text-[#C2185B]">{amountError}</p>}
            </div>

            {/* Donor name */}
            <div className="mt-5">
              <label htmlFor="donorName" className="mb-1.5 block text-sm font-medium text-[#6A4A58]">
                Your name <span className="text-[#B58CA0]">(optional)</span>
              </label>
              <input
                id="donorName"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value.slice(0, 80))}
                placeholder="e.g. The Marketing Team"
                className="w-full rounded-lg border border-[#F0D2DF] bg-[#FDEEF4] px-4 py-3 text-[#3A1E2E] placeholder-[#CBA8BA] outline-none transition focus:border-[#D6418A] focus:ring-2 focus:ring-[#D6418A]/15"
              />
            </div>

            {/* Message */}
            <div className="mt-5">
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-[#6A4A58]">
                Birthday message <span className="text-[#B58CA0]">(optional)</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 280))}
                rows={3}
                placeholder="Write a sweet note for Queen..."
                className="w-full resize-none rounded-lg border border-[#F0D2DF] bg-[#FDEEF4] px-4 py-3 text-[#3A1E2E] placeholder-[#CBA8BA] outline-none transition focus:border-[#D6418A] focus:ring-2 focus:ring-[#D6418A]/15"
              />
            </div>

            {error && (
              <div className="mt-5 rounded-lg border border-[#F4C2D4] bg-[#FDEEF3] px-4 py-3 text-sm text-[#C2185B]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleDonate}
              disabled={!canSubmit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D6418A] py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-[#BC2F73] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Preparing your gift...
                </>
              ) : (
                <>
                  <i className="ri-gift-line text-xl" />
                  Gift {numericAmount >= MIN_AMOUNT ? formatCedis(numericAmount) : 'Now'}
                </>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#A08591]">
              <i className="ri-lock-2-line" />
              Secure Mobile Money &amp; Card payment by Moolre
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
