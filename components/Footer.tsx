'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCMS } from '@/context/CMSContext';
import { useRecaptcha } from '@/hooks/useRecaptcha';

export default function Footer() {
  const { getSetting, getSettingJSON } = useCMS();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { getToken } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // reCAPTCHA verification
    const isHuman = await getToken('newsletter');
    if (!isHuman) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      // Newsletter simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setEmail('');
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const siteName = getSetting('site_name') || 'StandardStore';
  const contactEmail = getSetting('contact_email') || '';
  const contactPhone = getSetting('contact_phone') || '';

  const showNewsletter = getSetting('footer_show_newsletter') !== 'false';
  const newsletterSubtitle = getSetting('footer_newsletter_subtitle') || 'Join the list for early access to new collections, and 10% off your first order.';
  const poweredBy = getSetting('footer_powered_by') || 'Doctor Barns Tech';
  const poweredByLink = getSetting('footer_powered_by_link') || 'https://doctorbarns.com';

  const col1Title = getSetting('footer_col1_title') || 'Shop';
  const col1Links = getSettingJSON<{ label: string; href: string }[]>('footer_col1_links_json', [
    { label: 'All Products', href: '/shop' },
    { label: 'New Arrivals', href: '/shop?sort=newest' },
    { label: 'Best Sellers', href: '/shop?sort=popular' },
    { label: 'Collections', href: '/shop' }
  ]);
  const col2Title = getSetting('footer_col2_title') || 'Support';
  const col2Links = getSettingJSON<{ label: string; href: string }[]>('footer_col2_links_json', [
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping & Delivery', href: '/shipping' },
    { label: 'Returns & Exchanges', href: '/returns' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Track Order', href: '/order-tracking' }
  ]);
  const col3Title = getSetting('footer_col3_title') || 'Legal';
  const col3Links = getSettingJSON<{ label: string; href: string }[]>('footer_col3_links_json', [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Accessibility', href: '/accessibility' }
  ]);
  const socialLinks = [
    { icon: 'ri-instagram-line', href: getSetting('social_instagram') },
    { icon: 'ri-facebook-circle-line', href: getSetting('social_facebook') },
    { icon: 'ri-twitter-x-line', href: getSetting('social_twitter') },
    { icon: 'ri-tiktok-line', href: getSetting('social_tiktok') },
    { icon: 'ri-youtube-line', href: getSetting('social_youtube') },
    { icon: 'ri-whatsapp-line', href: getSetting('social_whatsapp') }
  ].filter((item) => item.href);

  const linkClass = 'text-[13px] text-white/70 hover:text-white transition-colors';

  return (
    <footer className="bg-[#301616] text-white">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 pt-16 pb-8">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="font-serif text-4xl sm:text-5xl uppercase tracking-[0.12em] text-white">
              {siteName}
            </Link>
            {showNewsletter && (
              <div className="mt-8 max-w-sm">
                <p className="text-sm leading-relaxed text-white/80">{newsletterSubtitle}</p>
                {submitStatus === 'success' && (
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white">You are on the list.</p>
                )}
                {submitStatus === 'error' && (
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-red-300">Please try again.</p>
                )}
                <form onSubmit={handleSubmit} className="mt-5">
                  <div className="flex border border-white/50">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/45 focus:outline-none"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-label="Subscribe"
                      className="flex w-12 items-center justify-center border-l border-white/50 text-white hover:bg-white/10 disabled:opacity-60"
                    >
                      <i className="ri-arrow-right-line text-lg"></i>
                    </button>
                  </div>
                </form>
              </div>
            )}
            {(contactPhone || contactEmail) && (
              <div className="mt-6 space-y-2 text-sm text-white/60">
                {contactPhone && <a href={`tel:${contactPhone}`} className="block hover:text-white">{contactPhone}</a>}
                {contactEmail && <a href={`mailto:${contactEmail}`} className="block hover:text-white">{contactEmail}</a>}
              </div>
            )}
            {socialLinks.length > 0 && (
              <div className="mt-5 flex gap-4">
                {socialLinks.map((social) => (
                  <a key={social.icon} href={social.href} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">
                    <i className={`${social.icon} text-lg`}></i>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="mb-5 text-[11px] uppercase tracking-[0.22em] text-white">{col1Title}</h4>
              <ul className="space-y-2.5">
                {col1Links.map((link, i) => (
                  <li key={i}><Link href={link.href} className={linkClass}>{link.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-5 text-[11px] uppercase tracking-[0.22em] text-white">{col2Title}</h4>
              <ul className="space-y-2.5">
                {col2Links.map((link, i) => (
                  <li key={i}><Link href={link.href} className={linkClass}>{link.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-5 text-[11px] uppercase tracking-[0.22em] text-white">{col3Title}</h4>
              <ul className="space-y-2.5">
                {col3Links.map((link, i) => (
                  <li key={i}><Link href={link.href} className={linkClass}>{link.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/15 pt-5 text-[11px] text-white/45">
          <p>
            &copy; {new Date().getFullYear()} {siteName}
            {poweredBy ? (
              <>
                {' '}| Designed &amp; Developed by{' '}
                <a href={poweredByLink} target="_blank" rel="noopener noreferrer" className="hover:text-white">{poweredBy}</a>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </footer>
  );
}
