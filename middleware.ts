import createMiddleware from 'next-intl/middleware';
import { updateSession } from './lib/supabase-middleware';
import { type NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'ru', 'kz'],

    // Used when no locale matches
    defaultLocale: 'kz'
});

export default async function middleware(request: NextRequest) {
    return await updateSession(request, intlMiddleware);
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
