'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedQuery } from '@/lib/query-cache';
import ProductReviews from '@/components/ProductReviews';
import { StructuredData, generateProductSchema, generateBreadcrumbSchema } from '@/components/SEOHead';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { MEASUREMENT_FIELDS, type MeasurementUnit, type CustomMeasurements } from '@/lib/measurements';

// Helper for color hexes
function colorNameToHex(name: string): string {
  const map: Record<string, string> = {
    red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
    orange: '#f97316', purple: '#a855f7', pink: '#ec4899', black: '#111827',
    white: '#ffffff', gray: '#6b7280', grey: '#6b7280', brown: '#92400e',
    navy: '#1e3a5f', gold: '#d4a017', silver: '#c0c0c0', beige: '#f5f5dc',
    maroon: '#800000', teal: '#14b8a6', coral: '#ff7f50', ivory: '#fffff0',
    cream: '#fffdd0', burgundy: '#800020', lavender: '#e6e6fa', cyan: '#06b6d4',
    magenta: '#d946ef', olive: '#84cc16', peach: '#ffcba4', mint: '#98f5e1',
    rose: '#f43f5e', wine: '#722f37', charcoal: '#374151', sky: '#0ea5e9',
    // Luxury hair colors
    platinum: '#E5E4E2', ash: '#B2BEB5', honey: '#A98307', copper: '#B87333',
    chestnut: '#954535', auburn: '#A52A2A', jet: '#0A0A0A'
  };
  return map[name.toLowerCase().trim()] || '#d1d5db';
}

const AccordionItem = ({ title, isOpen, onClick, children }: { title: string, isOpen: boolean, onClick: () => void, children: React.ReactNode }) => (
  <div className="border-b border-white/15">
    <button className="flex w-full items-center justify-between py-4 text-left" onClick={onClick}>
      <span className="text-[12px] uppercase tracking-[0.16em] text-white/90">{title}</span>
      <span className="text-lg leading-none text-white/70">{isOpen ? '−' : '+'}</span>
    </button>
    <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-[2400px] pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="text-sm font-light leading-relaxed text-white/70">
        {children}
      </div>
    </div>
  </div>
);

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<any>(null);
  usePageTitle(product?.name || 'Product');
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [selectionHint, setSelectionHint] = useState('');

  // Made-to-measure (custom fit)
  const [fitMode, setFitMode] = useState<'standard' | 'custom'>('standard');
  const [measureUnit, setMeasureUnit] = useState<MeasurementUnit>('in');
  const [measureValues, setMeasureValues] = useState<Record<string, string>>({});
  const [measureNote, setMeasureNote] = useState('');

  // Accordion State
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({ description: true });

  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        // Fetch main product (cached for 2 minutes)
        const { data: productData, error } = await cachedQuery<{ data: any; error: any }>(
          `product:${slug}`,
          async () => {
            // ... existing query logic ...
            let query = supabase
              .from('products')
              .select(`
                *,
                categories(name),
                product_variants(*),
                product_images(url, position, alt_text)
              `);

            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

            if (isUUID) {
              query = query.or(`id.eq.${slug},slug.eq.${slug}`);
            } else {
              query = query.eq('slug', slug);
            }

            return query.single() as any;
          },
          2 * 60 * 1000 // 2 minutes
        );

        if (error || !productData) {
          console.error('Error fetching product:', error);
          setLoading(false);
          return;
        }

        // Transform details
        const rawVariants = (productData.product_variants || []).map((v: any) => ({
          ...v,
          color: v.option2 || '',
          colorHex: v.metadata?.color_hex || ''
        }));

        const colorHexMap: Record<string, string> = {};
        rawVariants.forEach((v: any) => {
          if (v.color) {
            if (!colorHexMap[v.color]) {
              colorHexMap[v.color] = v.colorHex || colorNameToHex(v.color);
            }
          }
        });

        const transformedProduct = {
          ...productData,
          images: productData.product_images?.sort((a: any, b: any) => a.position - b.position).map((img: any) => img.url) || [],
          category: productData.categories?.name || 'Shop',
          rating: productData.rating_avg || 0,
          reviewCount: productData.review_count || 0,
          stockCount: productData.quantity,
          moq: productData.moq || 1,
          colors: [...new Set(rawVariants.map((v: any) => v.color).filter(Boolean))],
          colorHexMap,
          variants: rawVariants,
          sizes: rawVariants.map((v: any) => v.name) || [],
          features: ['100% Remy Human Hair', 'Heat Safe up to 400°F', 'Double Drawn Wefts', 'Cuticles Aligned'],
          care: 'Wash gently with sulfate-free shampoo. Air dry when possible. Use heat protectant before styling.',
          preorderShipping: productData.metadata?.preorder_shipping || null,
          shipping: 'Free shipping on orders over GH₵500. Standard delivery takes 3-5 business days.'
        };

        if (transformedProduct.images.length === 0) {
          transformedProduct.images = ['https://via.placeholder.com/800x1000?text=No+Image'];
        }

        setProduct(transformedProduct);
        setActiveImage(0);

        if (transformedProduct.moq > 1) {
          setQuantity(transformedProduct.moq);
        }

        // Fetch related
        if (productData.category_id) {
          // ... existing related query ...
          const { data: related } = await cachedQuery<{ data: any; error: any }>(
            `related:${productData.category_id}:${productData.id}`,
            (() => supabase
              .from('products')
              .select('*, product_images(url, position), product_variants(id, name, price, quantity)')
              .eq('category_id', productData.category_id)
              .neq('id', productData.id)
              .limit(4)) as any,
            5 * 60 * 1000
          );

          if (related) {
            setRelatedProducts(related.map((p: any) => {
              // ... existing mapping ...
              const variants = p.product_variants || [];
              const hasVariants = variants.length > 0;
              const effectiveStock = hasVariants ? variants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) : p.quantity;
              return {
                id: p.id,
                slug: p.slug,
                name: p.name,
                price: p.price,
                image: p.product_images?.[0]?.url || 'https://via.placeholder.com/800?text=No+Image',
                rating: p.rating_avg || 0,
                reviewCount: 0,
                inStock: effectiveStock > 0,
                maxStock: effectiveStock || 50,
                moq: p.moq || 1,
                hasVariants,
              };
            }));
          }
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const hasVariants = product?.variants?.length > 0;
  const hasColors = product?.colors?.length > 0;
  const allowCustom = !!product?.metadata?.allow_custom_measurements;
  const isCustomFit = allowCustom && fitMode === 'custom';

  const needsColorSelection = hasColors && !selectedColor;
  // In custom-fit mode, the standard size variant is not required (made-to-measure).
  const needsVariantSelection = hasVariants && !selectedVariant && !isCustomFit;

  const activePrice = selectedVariant?.price ?? product?.price ?? 0;
  const variantStock = selectedVariant ? (selectedVariant.stock ?? selectedVariant.quantity ?? product?.stockCount ?? 0) : (product?.stockCount ?? 0);
  // Custom-fit pieces are made to order, so they are always available to order.
  const activeStock = isCustomFit ? Math.max(variantStock, 99) : variantStock;

  const buildMeasurements = (): CustomMeasurements => {
    const values: Record<string, string> = {};
    for (const field of MEASUREMENT_FIELDS) {
      const v = (measureValues[field.id] || '').trim();
      if (v) values[field.id] = v;
    }
    return { unit: measureUnit, values, note: measureNote.trim() || undefined };
  };

  const validateSelections = () => {
    if (needsColorSelection) {
      setSelectionHint('Please select a color to continue.');
      return false;
    }
    if (isCustomFit) {
      const missing = MEASUREMENT_FIELDS.filter((f) => f.required && !(measureValues[f.id] || '').trim());
      if (missing.length > 0) {
        setSelectionHint(`Please enter your ${missing.map((m) => m.label.toLowerCase()).join(', ')}.`);
        return false;
      }
      setSelectionHint('');
      return true;
    }
    if (needsVariantSelection) {
      setSelectionHint('Please select a size to continue.');
      return false;
    }
    setSelectionHint('');
    return true;
  };

  const addProductToCart = () => {
    if (!product) return false;
    if (!validateSelections()) return false;

    let variantLabel: string | undefined;
    if (isCustomFit) {
      const color = selectedVariant?.color || selectedColor || '';
      variantLabel = color ? `${color} / Custom fit` : 'Custom fit';
    } else if (selectedVariant) {
      const color = selectedVariant.color || selectedColor || '';
      const name = selectedVariant.name || '';
      if (color && name) {
        variantLabel = `${color} / ${name}`;
      } else {
        variantLabel = color || name || undefined;
      }
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: activePrice,
      image: product.images[0],
      quantity: quantity,
      variant: variantLabel,
      slug: product.slug,
      maxStock: activeStock,
      moq: product.moq || 1,
      measurements: isCustomFit ? buildMeasurements() : undefined,
    });

    return true;
  };

  const handleAddToCart = () => {
    if (activeStock === 0 || isAdding) return;
    const added = addProductToCart();
    if (!added) return;
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 1000);
  };

  const handleBuyNow = () => {
    if (activeStock === 0 || isBuying) return;
    const added = addProductToCart();
    if (!added) return;
    setIsBuying(true);
    window.location.href = '/checkout';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#301616]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#301616] py-20 text-white">
        <h2 className="mb-4 font-serif text-2xl">Product Not Found</h2>
        <Link href="/shop" className="border-b border-white/60 pb-1 text-sm uppercase tracking-widest">Return to Shop</Link>
      </div>
    );
  }

  const minVariantPrice = hasVariants ? Math.min(...product.variants.map((v: any) => v.price || product.price)) : product.price;

  const productSchema = generateProductSchema({
    name: product.name,
    description: product.description,
    image: product.images[0],
    price: hasVariants ? minVariantPrice : product.price,
    currency: 'GHS',
    sku: product.sku,
    rating: product.rating,
    reviewCount: product.reviewCount,
    availability: product.stockCount > 0 ? 'in_stock' : 'out_of_stock',
    category: product.category
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://standardecom.com' },
    { name: 'Shop', url: 'https://standardecom.com/shop' },
    { name: product.name, url: `https://standardecom.com/product/${slug}` }
  ]);

  const sizeOptions = hasColors && selectedColor
    ? product.variants.filter((v: any) => v.color === selectedColor)
    : hasColors ? [] : product.variants;
  const wished = isInWishlist(product.id);
  const gallery = product.images || [];
  const shownImage = gallery[activeImage] || gallery[0];

  return (
    <>
      <StructuredData data={productSchema} />
      <StructuredData data={breadcrumbSchema} />

      <main className="min-h-screen bg-[#301616] text-white">


        <div className="mx-auto grid max-w-[1440px] items-start gap-6 px-4 py-6 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:py-10">
          <div className="order-2 border border-white/15 p-5 sm:p-8 lg:order-1">
            <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">{product.category}</p>
                <h1 className="mt-2 font-serif text-3xl uppercase tracking-wide sm:text-4xl">{product.name}</h1>
              </div>
              {selectedColor && <span className="pt-6 text-[11px] uppercase tracking-[0.16em] text-white/60">{selectedColor}</span>}
            </div>
            <p className="mt-4 text-2xl">
              {hasVariants && !selectedVariant && !isCustomFit ? `From GH₵${minVariantPrice.toFixed(0)}` : `GH₵${activePrice.toFixed(0)}`}
              {product.compare_at_price && product.compare_at_price > activePrice && (
                <span className="ml-3 text-base text-white/40 line-through">GH₵{product.compare_at_price.toFixed(0)}</span>
              )}
            </p>

            <div className="mt-8 space-y-6">
              {hasVariants && hasColors && (
                <div>
                  <p className="mb-3 text-sm text-white/70">Color <span className="text-white">{selectedColor}</span></p>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          const matching = product.variants.filter((v: any) => v.color === color);
                          if (matching.length === 1) {
                            setSelectedVariant(matching[0]);
                            setSelectedSize(matching[0].name);
                          } else {
                            setSelectedVariant(null);
                            setSelectedSize('');
                          }
                          setSelectionHint('');
                        }}
                        className={`h-8 w-8 rounded-full ${selectedColor === color ? 'ring-1 ring-offset-2 ring-offset-[#301616] ring-white' : ''}`}
                        style={{ backgroundColor: product.colorHexMap[color], border: '1px solid rgba(255,255,255,0.35)' }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {hasVariants && !isCustomFit && sizeOptions.length > 0 && (
                <label className="block">
                  <span className="mb-2 block text-sm text-white/70">Size</span>
                  <select
                    value={selectedVariant?.id || ''}
                    onChange={(e) => {
                      const variant = sizeOptions.find((v: any) => v.id === e.target.value);
                      setSelectedVariant(variant || null);
                      setSelectedSize(variant?.name || '');
                      setSelectionHint('');
                    }}
                    className="w-full border border-white/30 bg-transparent px-4 py-3 text-sm text-white focus:outline-none"
                  >
                    <option value="" className="text-black">Select a size</option>
                    {sizeOptions.map((variant: any) => {
                      const isOutOfStock = (variant.stock ?? variant.quantity ?? 0) === 0;
                      return (
                        <option key={variant.id} value={variant.id} disabled={isOutOfStock} className="text-black">
                          {variant.name}{isOutOfStock ? ' — sold out' : ''}
                        </option>
                      );
                    })}
                  </select>
                </label>
              )}

              {allowCustom && (
                <div className="border-t border-white/15 pt-2">
                  <button
                    type="button"
                    onClick={() => { setFitMode(isCustomFit ? 'standard' : 'custom'); setSelectionHint(''); }}
                    className="flex w-full items-center justify-between py-3 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm text-white/90"><i className="ri-pencil-line"></i> Customization</span>
                    <span className="text-lg">{isCustomFit ? '−' : '+'}</span>
                  </button>
                  {isCustomFit && (
                    <div className="pb-4">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <p className="text-sm text-white/60">Enter your measurements and we will cut this piece to you.</p>
                        <div className="flex shrink-0 border border-white/30">
                          {(['in', 'cm'] as MeasurementUnit[]).map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => setMeasureUnit(u)}
                              className={`px-3 py-1.5 text-[11px] uppercase ${measureUnit === u ? 'bg-white text-[#301616]' : 'text-white/70'}`}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {MEASUREMENT_FIELDS.map((field) => (
                          <div key={field.id}>
                            <label htmlFor={`m-${field.id}`} className="mb-1 block text-[11px] text-white/70">
                              {field.label}{field.required && <span className="text-white"> *</span>}
                            </label>
                            <div className="relative">
                              <input
                                id={`m-${field.id}`}
                                type="text"
                                inputMode="decimal"
                                value={measureValues[field.id] || ''}
                                onChange={(e) => {
                                  const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                                  setMeasureValues((prev) => ({ ...prev, [field.id]: cleaned }));
                                  if (selectionHint) setSelectionHint('');
                                }}
                                placeholder="0"
                                className="w-full border border-white/30 bg-transparent px-3 py-2.5 pr-9 text-sm text-white placeholder:text-white/30 focus:outline-none"
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">{measureUnit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <label htmlFor="m-note" className="mb-1 mt-3 block text-[11px] text-white/70">Other measurements / notes</label>
                      <textarea
                        id="m-note"
                        value={measureNote}
                        onChange={(e) => setMeasureNote(e.target.value.slice(0, 500))}
                        rows={2}
                        placeholder="Thigh, inseam, slim or relaxed — anything else we should know"
                        className="w-full resize-none border border-white/30 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <div className="flex border border-white/40">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(product.moq || 1, q - 1))} className="w-10 text-lg" aria-label="Decrease quantity">−</button>
                  <span className="flex w-8 items-center justify-center text-sm">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => Math.min(activeStock || q, q + 1))} className="w-10 text-lg" aria-label="Increase quantity">+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={activeStock === 0 || isAdding}
                  className="flex-1 border border-white/40 py-3 text-[12px] uppercase tracking-[0.18em] hover:bg-white hover:text-[#301616] disabled:opacity-40"
                >
                  {activeStock === 0 ? 'Out of Stock' : isAdding ? 'Added' : 'Add to Cart'}
                </button>
              </div>
              <button
                onClick={handleBuyNow}
                disabled={activeStock === 0 || isBuying}
                className="w-full bg-white py-3.5 text-[13px] font-medium uppercase tracking-[0.16em] text-[#301616] disabled:opacity-40"
              >
                {isBuying ? 'Preparing Checkout...' : 'Buy Now'}
              </button>
              {selectionHint && <p className="text-center text-xs uppercase tracking-[0.14em] text-red-300">{selectionHint}</p>}
              <button
                type="button"
                onClick={() => {
                  if (wished) removeFromWishlist(product.id);
                  else addToWishlist({
                    id: product.id,
                    name: product.name,
                    price: activePrice,
                    image: product.images[0],
                    inStock: activeStock > 0,
                    slug: product.slug,
                  });
                }}
                className="flex w-full items-center justify-center gap-2 py-2 text-sm text-white/80"
              >
                <i className={wished ? 'ri-heart-fill' : 'ri-heart-line'}></i>
                {wished ? 'Saved to Wishlist' : 'Add to Wishlist'}
              </button>
              <p className="text-center text-[11px] uppercase tracking-[0.16em] text-white/45">
                {isCustomFit ? 'Made to order · tailored to you' : activeStock > 0 ? 'In stock & ready to ship' : 'Currently unavailable'}
              </p>
            </div>

            <div className="mt-8 border-t border-white/15">
              <AccordionItem title="About this piece" isOpen={openAccordions.description} onClick={() => toggleAccordion('description')}>
                {product.description}
              </AccordionItem>
              <AccordionItem title="Details & Care" isOpen={openAccordions.features} onClick={() => toggleAccordion('features')}>
                <ul className="list-disc space-y-2 pl-4">
                  {product.features.map((f: string, i: number) => <li key={i}>{f}</li>)}
                  <li>{product.care}</li>
                </ul>
              </AccordionItem>
              <AccordionItem title="Shipping" isOpen={openAccordions.shipping} onClick={() => toggleAccordion('shipping')}>
                {product.shipping}
              </AccordionItem>
              <AccordionItem title={`Reviews (${product.reviewCount})`} isOpen={openAccordions.reviews} onClick={() => toggleAccordion('reviews')}>
                <ProductReviews productId={product.id} />
              </AccordionItem>
            </div>
          </div>

          <div className="order-1 lg:sticky lg:top-24 lg:order-2 lg:self-start">
            <div className="flex gap-3">
              {gallery.length > 1 && (
                <div className="hidden max-h-[78vh] w-16 shrink-0 flex-col gap-2 overflow-y-auto sm:flex">
                  {gallery.map((img: string, i: number) => (
                    <button key={img + i} type="button" onClick={() => setActiveImage(i)} className={`relative aspect-[3/4] overflow-hidden border ${activeImage === i ? 'border-white' : 'border-transparent opacity-70'}`}>
                      <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
              <div className="relative min-h-[70vh] flex-1 overflow-hidden bg-black/20">
                {shownImage && (
                  <Image src={shownImage} alt={product.name} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                )}
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="border-t border-white/15 px-4 py-12 lg:px-8">
            <h2 className="text-[13px] uppercase tracking-[0.22em]">You May Also Like</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <Link key={p.id} href={`/product/${p.slug || p.id}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#efeae6]">
                    <Image src={p.image} alt={p.name} fill className="object-cover" sizes="25vw" />
                  </div>
                  <p className="mt-3 text-[12px] uppercase tracking-[0.08em]">{p.name}</p>
                  <p className="mt-1 text-[12px] text-white/70">GH₵{Number(p.price).toFixed(0)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
