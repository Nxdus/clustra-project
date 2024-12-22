import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { NextRequest } from 'next/server';

// Create language middleware
const intlMiddleware = createMiddleware({
  locales: ['en', 'th'],
  defaultLocale: 'th',
  localePrefix: 'always'
});

// Combine both middlewares
export default withAuth(
  function middleware(request: NextRequest) {
    // Handle root path redirect
    if (request.nextUrl.pathname === '/') {
      // Get locale from cookie or use default
      const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';
      return NextResponse.redirect(new URL(`/${locale}`));
    }

    // Apply language middleware for all other routes
    return intlMiddleware(request);
  },
  {
    pages: {
      signIn: "/en"
    }
  }
);

export const config = {
  matcher: [
    // Add root path to matcher
    '/',
    // Internationalization paths
    '/((?!api|_next|_vercel|.*\\..*|static|public|favicon.ico|en/docs/*|th/docs/*).*)',
    // Authentication paths
    '/en/dashboard/:path*',
  ]
}; 