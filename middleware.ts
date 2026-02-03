import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export default async function middleware(request: NextRequest) {
    // 1. Run next-intl middleware first to handle localization (redirects, etc.)
    const handleI18n = createMiddleware({
        locales: ['en', 'ru', 'kz'],
        defaultLocale: 'kz'
    });

    const response = handleI18n(request);

    // 2. Setup Supabase client to handle session refreshing
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // Update request cookies for the current server processing
                        request.cookies.set(name, value);
                        // Update response cookies for the client
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // 3. Refresh session if expired
    // This will trigger setAll if the token is refreshed
    await supabase.auth.getUser();

    return response;
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
