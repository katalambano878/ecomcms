'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MiniCart from './MiniCart';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { useCMS } from '@/context/CMSContext';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);

  const { cartCount, isCartOpen, setIsCartOpen } = useCart();
  const { getSetting, getSettingJSON } = useCMS();

  const siteName = getSetting('site_name') || 'StandardStore';
  const siteLogo = getSetting('site_logo') || '/logo.png';
  const showSearch = getSetting('header_show_search') !== 'false';
  const showCart = getSetting('header_show_cart') !== 'false';
  const showAccount = getSetting('header_show_account') !== 'false';
  const navLinks = getSettingJSON<{ label: string; href: string }[]>('header_nav_links_json', [
    { label: "Queen's Birthday", href: '/queen-birthday' },
    { label: 'Shop', href: '/shop' },
    { label: 'Categories', href: '/categories' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const atelierNav = [{ label: 'Home', href: '/' }, ...navLinks];
  const brandWords = siteName.trim().split(/\s+/).filter(Boolean);
  const brandLead = brandWords.length > 1 ? brandWords.slice(0, -1).join(' ') : siteName.trim();
  const brandTail = brandWords.length > 1 ? brandWords[brandWords.length - 1] : '';

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#301616] text-white">
          <nav aria-label="Main navigation" className="grid h-[72px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-5">
              <button
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <i className="ri-menu-line text-xl"></i>
              </button>
              <div className="hidden lg:flex min-w-0 items-center gap-4 overflow-hidden">
                {atelierNav.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-white/90 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/"
              className="justify-self-center max-w-[62vw] px-1 text-center font-serif uppercase leading-none text-white sm:max-w-none"
              aria-label={siteName}
            >
              <span className="block whitespace-nowrap text-[11px] tracking-[0.06em] min-[390px]:text-[12.5px] min-[390px]:tracking-[0.08em] sm:text-[15px] sm:tracking-[0.1em] lg:text-[13px] lg:tracking-[0.08em] xl:text-[16px] xl:tracking-[0.12em]">
                {brandLead}
              </span>
              {brandTail ? (
                <span className="mt-1 block whitespace-nowrap text-[8px] tracking-[0.22em] text-white/90 min-[390px]:text-[9px] sm:mt-1.5 sm:text-[11px] sm:tracking-[0.28em] lg:text-[9px] lg:tracking-[0.24em] xl:text-[11px] xl:tracking-[0.28em]">
                  {brandTail}
                </span>
              ) : null}
            </Link>

            <div className="flex items-center justify-end gap-4 sm:gap-5">
              <span className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] text-white/80">GHS</span>
              {showSearch && (
                <button onClick={() => setIsSearchOpen(true)} aria-label="Open search" className="text-white">
                  <i className="ri-search-line text-lg"></i>
                </button>
              )}
              {showAccount && (
                <Link href={user ? '/account' : '/auth/login'} aria-label={user ? 'My account' : 'Login'} className="hidden sm:inline text-white">
                  <i className="ri-user-line text-lg"></i>
                </Link>
              )}
              {showCart && (
                <button
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  aria-label={`Shopping cart, ${cartCount} items`}
                  aria-expanded={isCartOpen}
                  className="relative text-white"
                >
                  <i className="ri-shopping-bag-line text-lg"></i>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 bg-white text-[#301616] text-[10px] leading-4 text-center rounded-full">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </nav>
          {showCart && <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
        </header>

      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Search</p>
                  <h3 className="text-2xl font-serif text-slate-900">Find something beautiful</h3>
                </div>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-900"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="w-full px-5 py-4 pr-14 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 text-base text-slate-800"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    <i className="ri-search-line text-xl"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-0 left-0 bottom-0 w-4/5 max-w-sm bg-white rounded-r-3xl shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <img src={siteLogo} alt={siteName} className="h-9 w-auto object-contain" />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-500"
                aria-label="Close menu"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {showSearch && (
              <div className="px-4 pt-4">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
                  <i className="ri-search-line text-slate-400 text-lg"></i>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search the collection"
                    className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(e);
                        setIsMobileMenuOpen(false);
                        setIsSearchOpen(false);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
              {[{ label: 'Home', href: '/' }, ...navLinks].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 text-base font-medium text-slate-700 bg-slate-50 hover:bg-white border border-transparent hover:border-emerald-100 rounded-2xl transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-3">Quick links</p>
                {[
                  { label: 'Track Order', href: '/order-tracking', icon: 'ri-route-fill' },
                  { label: 'Wishlist', href: '/wishlist', icon: 'ri-heart-3-line' },
                  { label: 'My Account', href: '/account', icon: 'ri-user-line' },
                  { label: 'Customer Care', href: '/contact', icon: 'ri-customer-service-2-line' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <i className={`${link.icon} text-lg text-emerald-600`}></i>
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="p-4 border-t border-slate-100 text-center text-xs text-slate-400">
              &copy; {new Date().getFullYear()} {siteName}
            </div>
          </div>
        </div>
      )}
    </>
  );
}