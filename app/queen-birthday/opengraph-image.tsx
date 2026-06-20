import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const alt = 'Happy Birthday, Queen — Send a Birthday Gift';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    const photo = await readFile(join(process.cwd(), 'public/images/queen.png'));
    const photoSrc = `data:image/png;base64,${photo.toString('base64')}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    backgroundColor: '#F7F1E7',
                    padding: 48,
                }}
            >
                {/* Photo with matted gold frame */}
                <div
                    style={{
                        display: 'flex',
                        backgroundColor: '#ffffff',
                        padding: 12,
                        boxShadow: '0 30px 60px rgba(33,28,22,0.25)',
                    }}
                >
                    <div style={{ display: 'flex', border: '2px solid #C6A65E', padding: 6 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={photoSrc}
                            width={372}
                            height={486}
                            style={{ objectFit: 'cover', display: 'block' }}
                            alt="Queen"
                        />
                    </div>
                </div>

                {/* Text */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        marginLeft: 56,
                        flex: 1,
                    }}
                >
                    <div style={{ display: 'flex', fontSize: 34, color: '#7A1E2B', fontStyle: 'italic' }}>
                        Happy Birthday,
                    </div>
                    <div style={{ display: 'flex', fontSize: 104, fontWeight: 800, color: '#211C16', lineHeight: 1 }}>
                        Queen
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 26 }}>
                        <div style={{ width: 48, height: 2, backgroundColor: '#C6A65E' }} />
                        <div
                            style={{
                                fontSize: 22,
                                letterSpacing: 6,
                                color: '#9A7B43',
                                textTransform: 'uppercase',
                                marginLeft: 16,
                                fontWeight: 600,
                            }}
                        >
                            21 June 2026
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            marginTop: 34,
                            backgroundColor: '#7A1E2B',
                            color: '#ffffff',
                            fontSize: 26,
                            fontWeight: 700,
                            padding: '16px 30px',
                            borderRadius: 10,
                            alignSelf: 'flex-start',
                        }}
                    >
                        Send a birthday gift  →
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
