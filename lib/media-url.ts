/**
 * Uploaded files are stored with host-relative URLs
 * (`/storage/v1/object/public/products/<name>`), so the same row works on
 * www.queensprettydollsfashion.com, the bare domain and any test host.
 *
 * Anything that leaves the site (sitemap, JSON-LD, Open Graph, emails) needs
 * an absolute URL: build it with absoluteMediaUrl(). The default base is
 * NEXT_PUBLIC_APP_URL. Already-absolute URLs (https:, http:, data:,
 * protocol-relative) are returned unchanged.
 */
function appBaseUrl(): string {
    return (process.env.NEXT_PUBLIC_APP_URL || 'https://www.queensprettydollsfashion.com').replace(/\/+$/, '');
}

export function absoluteMediaUrl(url: string, base?: string): string;
export function absoluteMediaUrl(url: string | null | undefined, base?: string): string | null;
export function absoluteMediaUrl(url: string | null | undefined, base: string = appBaseUrl()): string | null {
    if (url == null) return null;
    const value = String(url).trim();
    if (!value) return value;
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')) return value;
    const origin = base.replace(/\/+$/, '');
    return `${origin}${value.startsWith('/') ? '' : '/'}${value}`;
}
