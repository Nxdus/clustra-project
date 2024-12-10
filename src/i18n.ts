import { getRequestConfig } from 'next-intl/server';
import { Timezone } from 'next-intl';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
  timeZone: 'Asia/Bangkok' as Timezone
})); 