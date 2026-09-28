'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useCMS } from '@/context/CMSContext';
import { usePageTitle } from '@/hooks/usePageTitle';

type Tile = {
  id: string;
  name: string;
  href: string;
  image: string;
};

type Look = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  hoverImage?: string;
  variant?: string;
};

const ATELIER = '#301616';

function money(amount: number) {
  const rounded = Math.round(amount);
  const whole = Math.abs(amount - rounded) < 0.001;
  const value = whole ? rounded.toLocaleString('en-GH') : amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `GH₵${value}`;
}

function toLook(product: any): Look {
  const images = [...(product.product_images || [])].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
  const variants = product.product_variants || [];
  const prices = variants.map((v: any) => Number(v.price)).filter((n: number) => n > 0);
  const price = prices.length ? Math.min(...prices) : Number(product.price) || 0;
  return {
    id: product.id,
    slug: product.slug || product.id,
    name: product.name,
    price,
    image: images[0]?.url || '',
    hoverImage: images[1]?.url,
    variant: variants[0]?.name || undefined,
  };
}

function SectionHeading({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.22em] text-white sm:text-sm">{title}</h2>
      <Link href={href} className="shrink-0 text-[13px] text-white/80 hover:text-white">
        {label}
      </Link>
    </div>
  );
}

function LookCard({ item }: { item: Look }) {
  return (
    <Link href={`/product/${item.slug}`} className="group block min-w-0">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#efeae6]">
        {item.image ? (
        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 70vw, 25vw" />
        ) : null}
        {item.hoverImage && (
          <Image
            src={item.hoverImage}
            alt=""
            fill
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            sizes="(max-width: 768px) 70vw, 25vw"
          />
        )}
        {item.variant && !/^(xxs|xs|s|m|l|xl|xxl|xxxl|\d+)$/i.test(item.variant.trim()) && (
          <span className="absolute right-3 top-3 text-[10px] uppercase tracking-[0.16em] text-white drop-shadow">
            {item.variant}
          </span>
        )}
      </div>
      <div className="mt-3 text-white">
        <p className="text-[12px] uppercase tracking-[0.08em]">{item.name}</p>
        <p className="mt-1 text-[12px] text-white/75">{money(item.price)}</p>
      </div>
    </Link>
  );
}

function CollectionTile({ tile }: { tile: Tile }) {
  return (
    <Link href={tile.href} className="group relative block aspect-[3/4] overflow-hidden bg-black/20">
      <Image
        src={tile.image}
        alt={tile.name}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        sizes="(max-width: 768px) 70vw, 25vw"
      />
      <span className="absolute bottom-4 left-4 text-[11px] uppercase tracking-[0.18em] text-white drop-shadow">
        {tile.name}
      </span>
    </Link>
  );
}

export default function Home() {
  const { getSetting } = useCMS();
  const [looks, setLooks] = useState<Look[]>([]);
  const [collections, setCollections] = useState<Tile[]>([]);
  const [categories, setCategories] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);

  const siteName = getSetting('site_name')?.trim() || 'Queensprettydolls';
  const heroHeadline = getSetting('hero_headline')?.trim() || 'Tailored for you';
  const heroSubheadline = getSetting('hero_subheadline')?.trim() || 'Made to measure. Ready to wear.';
  const configuredHero = getSetting('hero_image');
  const heroImage = configuredHero && configuredHero !== '/hero.jpg' ? configuredHero : looks[0]?.image || '';

  usePageTitle(siteName);

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: products }, { data: cats }] = await Promise.all([
          supabase
            .from('products')
            .select('*, product_variants(*), product_images(*)')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(12),
          supabase
            .from('categories')
            .select('id, name, slug, image_url, status')
            .eq('status', 'active')
            .order('name'),
        ]);

        setLooks((products || []).map(toLook));

        const tiles: Tile[] = (cats || [])
          .filter((cat: any) => cat.image_url)
          .map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            href: `/shop?category=${encodeURIComponent(cat.slug || cat.id)}`,
            image: cat.image_url,
          }));
        setCollections(tiles.slice(0, 4));
        setCategories(tiles.slice(4, 8).length ? tiles.slice(4, 8) : tiles.slice(0, 4));
      } catch (error) {
        console.error('Error fetching homepage:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const newest = looks.slice(0, 4);
  const coveted = looks.slice(4, 8);
  const marquee = (heroHeadline || 'Tailored for you').toUpperCase();
  const wordmark = siteName.length > 18 ? siteName.split(' ')[0] : siteName;

  return (
    <main className="bg-[#301616] text-white">
      <section className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-black">
        {heroImage ? (
        <Image src={heroImage} alt="" fill priority className="object-cover object-center" sizes="100vw" quality={90} />
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-6 flex items-end justify-between gap-6 px-5 sm:px-8">
          <p className="text-[12px] text-white/95 sm:text-sm">{siteName}</p>
          <p className="max-w-[14rem] text-right text-[12px] text-white/95 sm:max-w-none sm:text-sm">{heroSubheadline}</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16">
        <section>
          <SectionHeading title="New Arrivals" href="/shop?sort=new" label="Discover more >" />
          {loading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[3/4] animate-pulse bg-white/10" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {newest.map((item) => (
                <LookCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {!loading && coveted.length > 0 && (
          <section className="mt-16">
            <SectionHeading title="Most Coveted" href="/shop" label="Discover more >" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {coveted.map((item) => (
                <LookCard key={`cov-${item.id}`} item={item} />
              ))}
            </div>
          </section>
        )}

        {collections.length > 0 && (
          <section className="mt-16">
            <SectionHeading title="Collections" href="/categories" label="View all >" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {collections.map((tile) => (
                <CollectionTile key={tile.id} tile={tile} />
              ))}
            </div>
          </section>
        )}

        {categories.length > 0 && (
          <section className="mt-16">
            <SectionHeading title="Categories" href="/categories" label="View all >" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {categories.map((tile) => (
                <CollectionTile key={`cat-${tile.id}`} tile={tile} />
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="relative h-[68vh] min-h-[420px] overflow-hidden bg-black">
        {heroImage ? (
        <Image src={heroImage} alt="" fill className="object-cover object-top" sizes="100vw" />
        ) : null}
        <div className="absolute inset-0 bg-black/55" />
        <p className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center font-serif text-[8vw] uppercase leading-none tracking-tight text-white/90">
          {wordmark}
        </p>
        <div className="absolute inset-x-0 bottom-10 flex items-end justify-between px-6 sm:px-12">
          <p className="text-sm uppercase tracking-[0.22em] text-white sm:text-base">Made to measure</p>
          <p className="text-sm uppercase tracking-[0.22em] text-white sm:text-base">One dress at a time</p>
        </div>
      </section>

      <section style={{ backgroundColor: ATELIER }} className="border-t border-white/10">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-y-10 px-6 py-14 md:grid-cols-4">
          {[
            { icon: 'ri-truck-line', title: 'Express Delivery', text: 'Swift, secure delivery handled with care.' },
            { icon: 'ri-chat-3-line', title: '24/7 Client Care', text: 'Personal support at every stage of your order.' },
            { icon: 'ri-heart-line', title: 'Made-To-Order', text: 'Pieces cut to your measurements, made for you.' },
            { icon: 'ri-flashlight-line', title: 'Limited Availability', text: 'A select number of each style. Once closed, it stays closed.' },
          ].map((item, index) => (
            <div key={item.title} className={`px-4 text-center ${index > 0 ? 'md:border-l md:border-white/25' : ''}`}>
              <i className={`${item.icon} text-2xl text-white/90`}></i>
              <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.18em]">{item.title}</p>
              <p className="mx-auto mt-2 max-w-[180px] text-[12px] leading-relaxed text-white/65">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-hidden border-y border-white/15 bg-[#301616] py-4">
        <div className="atelier-marquee flex w-max">
          {Array.from({ length: 2 }).map((_, copy) => (
            <div key={copy} className="flex">
              {Array.from({ length: 8 }).map((__, i) => (
                <span key={`${copy}-${i}`} className="px-8 text-[12px] uppercase tracking-[0.28em] text-white/90">
                  {marquee}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
