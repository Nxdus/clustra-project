import React from 'react';
import { createTranslator } from 'next-intl';
import { notFound } from 'next/navigation';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { Metadata } from 'next';

import '@/app/globals.css';

const timeZone = 'Asia/Bangkok';

// แก้ไข type ของ generateMetadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocales = ['th', 'en'];
  if (!validLocales.includes(locale)) {
    return { title: 'Default Title' };
  }

  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;
    const t = createTranslator({
      locale,
      messages,
      timeZone,
    });
    return { title: t('meta.title') };
  } catch {
    return { title: 'Default Title' };
  }
}

// แก้ไข Props type
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;
  
  const validLocales = ['th', 'en'];
  if (!validLocales.includes(locale)) {
    notFound();
  }

  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;

    return (
      <html lang={locale}>
        <body className="min-h-screen bg-background font-sans antialiased">
          <Providers locale={locale} messages={messages} timeZone={timeZone}>
            {children}
            <Toaster />
          </Providers>
        </body>
      </html>
    );
  } catch (error) {
    console.error(`Failed to load layout for locale: ${locale}`, error);
    notFound();
  }
}