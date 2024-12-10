import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'th'],
  defaultLocale: 'th',
  localePrefix: 'always'
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - /api, /_next, /_vercel, /static, /public, /favicon.ico
    '/((?!api|_next|_vercel|.*\\..*|static|public|favicon.ico).*)',
    // Also match /
    '/'
  ]
}; 