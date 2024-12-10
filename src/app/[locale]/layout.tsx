import React from 'react';
import { createTranslator } from 'next-intl';
import { notFound } from 'next/navigation';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

import '@/app/globals.css';

// กำหนด timeZone เป็นค่าคงที่
const timeZone = 'Asia/Bangkok';

// generateMetadata
export async function generateMetadata({
  params,
}: {
  params: { locale: Promise<string> };
}) {
  const resolvedParams = await params;
  const resolvedLocale = await resolvedParams.locale;
  
  const validLocales = ['th', 'en'];
  if (!validLocales.includes(resolvedLocale)) {
    return { title: 'Default Title' };
  }

  try {
    const messages = (await import(`@/messages/${resolvedLocale}.json`)).default;
    const t = createTranslator({
      locale: resolvedLocale,
      messages,
      timeZone,
    });
    return { title: t('meta.title') };
  } catch (error) {
    return { title: 'Default Title' };
  }
}

// LocaleLayout
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Promise<string> };
}) {
  const resolvedParams = await params;
  const resolvedLocale = await resolvedParams.locale;

  // ตรวจสอบว่า locale เป็นค่าที่รองรับ
  const validLocales = ['th', 'en'];
  if (!validLocales.includes(resolvedLocale)) {
    notFound();
  }

  try {
    const messages = (await import(`@/messages/${resolvedLocale}.json`)).default;

    return (
      <html lang={resolvedLocale}>
        <body className="min-h-screen bg-background font-sans antialiased">
          <Providers locale={resolvedLocale} messages={messages} timeZone={timeZone}>
            {children}
            <Toaster />
          </Providers>
        </body>
      </html>
    );
  } catch (error) {
    console.error(`Failed to load layout for locale: ${resolvedLocale}`, error);
    notFound();
  }
}