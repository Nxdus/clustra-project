import React from 'react';
import { createTranslator } from 'next-intl';
import { notFound } from 'next/navigation';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { Metadata } from 'next';

const timeZone = 'Asia/Bangkok';

// แก้ไข type ของ generateMetadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string, pathname: string }>;
}): Promise<Metadata> {
  const { locale, pathname } = await params;

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

    let title = t('meta.title')
    let description = t('meta.description') || "Clustra - Simplify video streaming with MP4 to M3U8 conversion, secure URL streaming, and custom access control."

    if (pathname === `/${locale}/dashboard`) {
      title = t('meta.dashboardTitle')
      description = t('meta.dashboardDescription')
    } else if (pathname === `/${locale}/docs`) {
      title = t('meta.docsTitle')
      description = t('meta.docsDescription')
    }

    // Metadata object
    return {
      title,
      description,
      keywords: "Clustra, mp4 to m3u8, video converter, m3u8 generator, video streaming, URL streaming, streaming access control, domain-restricted streaming, public streaming, video hosting, microsaas video service, video file conversion, secure video streaming, video transcoding, cloud video storage, video on demand, HLS streaming, video file management, Clustra microsaas, Clustra video service",
      icons: {
        icon: '/favicon.ico'
      }
    };
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
      <Providers locale={locale} messages={messages} timeZone={timeZone}>
        {children}
        <Toaster />
      </Providers>
    );
  } catch (error) {
    console.error(`Failed to load layout for locale: ${locale}`, error);
    notFound();
  }
}