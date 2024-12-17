import React from 'react';

import '@/app/globals.css';

export const metadata = {
    title: 'Clustra - Simplify Video Streaming',
    description:
        'Simplify video streaming with MP4 to M3U8 conversion, secure URL streaming, and custom access control.',
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