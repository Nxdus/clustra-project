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
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  console.log(params)

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

    // Metadata object
    return {
      title: t('meta.title'), 
      description: t('meta.description') || "Clustra - Simplify video streaming with MP4 to M3U8 conversion, secure URL streaming, and custom access control.",
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