import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "./lib/auth0"

export async function middleware(request: NextRequest) {
    // Gracefully bypass auth when required envs are missing (local dev)
    const required = ["AUTH0_CLIENT_ID", "AUTH0_CLIENT_SECRET", "AUTH0_SECRET"];
    const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL;
    const appBase = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL;
    const hasAll = required.every((k) => !!process.env[k]) && !!domain && !!appBase;
    if (!hasAll) {
        return NextResponse.next();
    }
    const authRes = await auth0.middleware(request);

    // authentication routes — let the middleware handle it
    if (request.nextUrl.pathname.startsWith("/auth")) {
        return authRes;
    }

    // public routes — no need to check for session
    if (request.nextUrl.pathname === ("/")) {
        return authRes;
    }

    return authRes
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         * - api (API routes)
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api).*)",
    ],
}
