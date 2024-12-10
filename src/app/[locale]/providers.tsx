'use client';

import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';
import { PropsWithChildren } from 'react';

export function Providers({ children, locale, messages, timeZone }: PropsWithChildren<{
  locale: string;
  messages: Record<string, string>;
  timeZone: string;
}>) {
  return (
    <SessionProvider>
      <NextIntlClientProvider 
        locale={locale} 
        messages={messages}
        timeZone={timeZone}
      >
        {children}
      </NextIntlClientProvider>
    </SessionProvider>
  );
} 