import React from 'react';

import '@/app/globals.css';

export const metadata = {
    title: 'Clustra - Simplify Video Streaming',
    description:
        'Simplify video streaming with MP4 to M3U8 conversion, secure URL streaming, and custom access control.',
    keywords: "Clustra, mp4 to m3u8, video converter, m3u8 generator, video streaming, URL streaming, streaming access control, domain-restricted streaming, public streaming, video hosting, microsaas video service, video file conversion, secure video streaming, video transcoding, cloud video storage, video on demand, HLS streaming, video file management, Clustra microsaas, Clustra video service",
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-background font-sans antialiased">
                <main className="min-h-screen bg-background font-sans antialiased">
                    {children}
                </main>
            </body>
        </html>
    );
}