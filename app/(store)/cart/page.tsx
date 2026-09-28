'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { usePageTitle } from '@/hooks/usePageTitle';
import { measurementLines } from '@/lib/measurements';

export default function CartPage() {
  usePageTitle('Shopping Bag');
  const { cart, removeFromCart, updateQuantity, subtotal, total, coupon, applyCoupon, removeCoupon } = useCart();

  // Example coupon logic UI handler
  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const code = formData.get('coupon') as string;
    if (code) {
      applyCoupon(code);
      (e.target as HTMLFormElement).reset();
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#301616] p-4 text-center text-white">
        <h1 className="mb-4 font-serif text-3xl md:text-4xl">Your bag is empty</h1>
        <p className="mb-8 max-w-md font-light text-white/60">Nothing here yet. The collection is waiting.</p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center border border-white/50 px-10 py-4 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-[#301616]"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#301616] py-12 text-white md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="mb-12 text-center font-serif text-3xl uppercase tracking-[0.12em] md:text-left md:text-4xl">Shopping Bag ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h1>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-24">

          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="space-y-8">
              {cart.map((item) => (
                <div key={item.uid} className="group flex gap-6 border-b border-white/10 py-6 last:border-0">

                  {/* Image */}
                  <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden bg-white/5 md:h-40 md:w-32">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="line-clamp-2 pr-4 font-serif text-lg uppercase tracking-wide">{item.name}</h3>
                        <p className="font-medium">GH₵{(item.price * item.quantity).toFixed(2)}</p>
                      </div>

                      {item.variant && (
                        <p className="mb-2 text-xs uppercase tracking-wide text-white/55">{item.variant}</p>
                      )}
                      <p className="text-xs text-white/45">GH₵{item.price.toFixed(2)} each</p>

                      {measurementLines(item.measurements).length > 0 && (
                        <div className="mt-3 border border-white/15 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/80">
                            <i className="ri-ruler-line text-white/50"></i> Made to your measurements
                          </p>
                          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                            {measurementLines(item.measurements).map((line) => (
                              <div key={line.label} className="flex justify-between gap-2 text-[11px]">
                                <dt className="text-white/50">{line.label}</dt>
                                <dd className="font-medium text-white">{line.value}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      {/* Quantity */}
                      <div className="flex items-center border border-white/30">
                        <button
                          onClick={() => updateQuantity(item.uid, Math.max(1, item.quantity - 1))}
                          className="flex h-8 w-8 items-center justify-center text-white/70 hover:bg-white/10"
                        >
                          <i className="ri-subtract-line text-xs"></i>
                        </button>
                        <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.uid, Math.min(item.maxStock, item.quantity + 1))}
                          className="flex h-8 w-8 items-center justify-center text-white/70 hover:bg-white/10"
                          disabled={item.quantity >= item.maxStock}
                        >
                          <i className="ri-add-line text-xs"></i>
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.uid)}
                        className="text-xs text-white/50 underline hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link href="/shop" className="border-b border-transparent pb-1 text-xs uppercase tracking-widest text-white/70 hover:border-white hover:text-white">
                <i className="ri-arrow-left-line mr-2"></i> Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 border border-white/15 p-8">
              <h2 className="mb-6 font-serif text-2xl">Order Summary</h2>

              <div className="mb-8 space-y-4 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-white">GH₵{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Estimate</span>
                  <span className="italic text-white/40">Calculated at checkout</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-white">
                    <span>Discount ({coupon.code})</span>
                    {/* Ensure coupon amount is handled safely */}
                    <span>-GH₵{(coupon.amount || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="mb-8 border-t border-white/15 pt-6">
                <div className="flex items-end justify-between">
                  <span className="text-xs uppercase tracking-[0.18em]">Total</span>
                  <span className="font-serif text-2xl">GH₵{total.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-xs text-white/45">Shipping is confirmed at checkout</p>
              </div>

              <Link
                href="/checkout"
                className="mb-6 block w-full bg-white py-4 text-center text-xs uppercase tracking-[0.2em] text-[#301616] hover:bg-white/90"
              >
                Proceed to Checkout
              </Link>

              {/* Coupon Code */}
              <div className="mb-6">
                <form onSubmit={handleCouponSubmit} className="relative">
                  <input
                    type="text"
                    name="coupon"
                    placeholder="Gift card or discount code"
                    className="w-full border border-white/30 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-xs uppercase text-white/50 hover:text-white">
                    Apply
                  </button>
                </form>
                {coupon && (
                  <div className="mt-2 flex items-center justify-between text-xs text-white/80">
                    <span>Code <strong>{coupon.code}</strong> applied</span>
                    <button onClick={removeCoupon} className="text-red-500 hover:text-red-700"><i className="ri-close-circle-fill"></i></button>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex justify-center gap-6 border-t border-white/15 pt-6 text-white/40">
                <i className="ri-secure-payment-line text-2xl" title="Secure Payment"></i>
                <i className="ri-truck-line text-2xl" title="Fast Delivery"></i>
                <i className="ri-customer-service-2-line text-2xl" title="24/7 Support"></i>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
