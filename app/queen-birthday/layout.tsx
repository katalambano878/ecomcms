import type { Metadata } from 'next';

const PAGE_URL = 'https://www.queensprettydollsfashion.com/queen-birthday';
const TITLE = 'Happy Birthday, Queen \u2014 Send a Birthday Gift';
const DESCRIPTION =
    "It's Queen's birthday! Join us in celebrating our CEO with a heartfelt birthday gift \u2014 from GH\u20B5 200 to GH\u20B5 20,000 via Mobile Money or card. Every gift makes her day brighter.";

export const metadata: Metadata = {
    // `absolute` stops the site-wide "| My Store" title template from being appended.
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: PAGE_URL },
    robots: { index: true, follow: true },
    openGraph: {
        type: 'website',
        url: PAGE_URL,
        siteName: "Queen's Pretty Dolls",
        title: TITLE,
        description: DESCRIPTION,
    },
    twitter: {
        card: 'summary_large_image',
        title: TITLE,
        description: DESCRIPTION,
    },
};

export default function QueenBirthdayLayout({ children }: { children: React.ReactNode }) {
    return children;
}
