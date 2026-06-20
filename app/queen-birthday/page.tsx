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
    <main className="min-h-screen bg-[#F7F1E7] text-[#211C16]">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          {/* Left: matted portrait + tribute */}
          <div className="text-center lg:text-left">
            <div className="mx-auto w-fit lg:mx-0">
              {/* Matted photo frame */}
              <div className="bg-white p-3 shadow-[0_30px_60px_-30px_rgba(33,28,22,0.45)]">
                <div className="border border-[#D8C49A] p-1.5">
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
              <p className="font-serif text-2xl italic text-[#7A1E2B]">Happy Birthday,</p>
              <h1 className="mt-1 font-serif text-6xl font-semibold leading-none tracking-tight sm:text-7xl">
                {CEO_NAME}
              </h1>

              {/* Invitation-style date rule */}
              <div className="mt-6 flex items-center justify-center gap-4 lg:justify-start">
                <span className="h-px w-10 bg-[#C6A65E]" />
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-[#9A7B43]">
                  {BIRTHDAY_LABEL}
                </span>
                <span className="h-px w-10 bg-[#C6A65E]" />
              </div>

              <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-[#5C5345] lg:mx-0">
                Today we celebrate the heart behind everything we do. Join us in honouring our Queen with a
                heartfelt birthday gift. Every contribution, however small, helps make her day truly special.
              </p>
            </div>
          </div>

          {/* Right: donation card */}
          <div className="rounded-2xl border border-[#E6DAC4] bg-white p-6 shadow-[0_40px_80px_-50px_rgba(33,28,22,0.5)] sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">Send Your Birthday Gift</h2>
            <p className="mt-1.5 text-sm text-[#6B6253]">
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
                        ? 'border-[#7A1E2B] bg-[#7A1E2B] text-white'
                        : 'border-[#E2D6C0] bg-[#FBF8F1] text-[#3A342B] hover:border-[#7A1E2B]/50 hover:text-[#7A1E2B]'
                    }`}
                  >
                    {preset.toLocaleString()}
                  </button>
                );
              })}
            </div>

            {/* Custom amount */}
            <div className="mt-5">
              <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-[#4A4338]">
                Or enter a custom amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-[#7A1E2B]">
                  &#8373;
                </span>
                <input
                  id="amount"
                  inputMode="numeric"
                  value={amount === '' ? '' : amount}
                  onChange={(e) => handleAmountInput(e.target.value)}
                  placeholder="500"
                  className="w-full rounded-lg border border-[#E2D6C0] bg-[#FBF8F1] py-3.5 pl-10 pr-4 text-lg font-semibold text-[#211C16] placeholder-[#B3A88F] outline-none transition focus:border-[#7A1E2B] focus:ring-2 focus:ring-[#7A1E2B]/15"
                />
              </div>
              {amountError && <p className="mt-2 text-sm text-[#A52A37]">{amountError}</p>}
            </div>

            {/* Donor name */}
            <div className="mt-5">
              <label htmlFor="donorName" className="mb-1.5 block text-sm font-medium text-[#4A4338]">
                Your name <span className="text-[#9A917F]">(optional)</span>
              </label>
              <input
                id="donorName"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value.slice(0, 80))}
                placeholder="e.g. The Marketing Team"
                className="w-full rounded-lg border border-[#E2D6C0] bg-[#FBF8F1] px-4 py-3 text-[#211C16] placeholder-[#B3A88F] outline-none transition focus:border-[#7A1E2B] focus:ring-2 focus:ring-[#7A1E2B]/15"
              />
            </div>

            {/* Message */}
            <div className="mt-5">
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-[#4A4338]">
                Birthday message <span className="text-[#9A917F]">(optional)</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 280))}
                rows={3}
                placeholder="Write a sweet note for Queen..."
                className="w-full resize-none rounded-lg border border-[#E2D6C0] bg-[#FBF8F1] px-4 py-3 text-[#211C16] placeholder-[#B3A88F] outline-none transition focus:border-[#7A1E2B] focus:ring-2 focus:ring-[#7A1E2B]/15"
              />
            </div>

            {error && (
              <div className="mt-5 rounded-lg border border-[#E3B8BC] bg-[#FBEEEF] px-4 py-3 text-sm text-[#A52A37]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleDonate}
              disabled={!canSubmit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#7A1E2B] py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-[#651521] disabled:cursor-not-allowed disabled:opacity-50"
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

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#8A8070]">
              <i className="ri-lock-2-line" />
              Secure Mobile Money &amp; Card payment by Moolre
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
