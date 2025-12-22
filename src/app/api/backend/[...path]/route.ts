// app/api/backend/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5001";
const UPSTREAM_TIMEOUT_MS = 30000; // 30 seconds
const MAX_PATH_LENGTH = 200; // Prevent path traversal attacks
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Merge Set-Cookie headers from one response into another.
 * Next.js/undici may expose getSetCookie(); fall back to single header.
 * Uses proper type checking instead of 'any'.
 */
function mergeSetCookies(from: Headers, to: Headers) {
  // Next.js Headers may have getSetCookie() method
  const cookies: string[] =
    "getSetCookie" in from && typeof (from as { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (from as { getSetCookie: () => string[] }).getSetCookie()
      : from.get("set-cookie")
        ? [from.get("set-cookie") as string]
        : [];

  for (const c of cookies) {
    to.append("set-cookie", c);
  }
}

/**
 * Validate and sanitize path segments to prevent path traversal attacks.
 */
function validatePath(path: string[]): { valid: boolean; sanitized?: string[]; error?: string } {
  if (path.length === 0) {
    return { valid: false, error: "Path cannot be empty" };
  }

  const fullPath = path.join("/");
  if (fullPath.length > MAX_PATH_LENGTH) {
    return { valid: false, error: `Path exceeds maximum length of ${MAX_PATH_LENGTH}` };
  }

  // Check for path traversal attempts
  const dangerousPatterns = /\.\.|%2e%2e|%2E%2E/i;
  if (dangerousPatterns.test(fullPath)) {
    return { valid: false, error: "Invalid path: path traversal detected" };
  }

  // Sanitize: remove empty segments and normalize
  const sanitized = path.filter((segment) => segment.length > 0).map((segment) => segment.trim());

  return { valid: true, sanitized };
}

/**
 * Generate a request ID for tracing/logging.
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log error with context for debugging.
 */
function logError(requestId: string, context: string, error: unknown, additionalInfo?: Record<string, unknown>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${requestId}] ${context}:`, {
    error: errorMessage,
    stack: errorStack,
    ...additionalInfo,
  });
}

/**
 * Create a fetch with timeout using AbortController.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sanitize request headers for upstream forwarding.
 * Strips sensitive headers (cookies, authorization) and hop-by-hop headers.
 * Only forwards safe, non-sensitive headers to prevent data leakage.
 * 
 * This follows the BFF pattern: client cookies (Auth0 session) are handled
 * server-side via getSession(), and we inject our own bearer token.
 */
function sanitizeHeaders(req: NextRequest): Headers {
  const safeHeaders = new Headers();

  // Allowlist of safe headers to forward
  const allowedHeaders = [
    'content-type',
    'accept',
    'accept-language',
    'accept-encoding',
    'user-agent',
    'x-requested-with',
  ];

  // Copy only safe headers
  allowedHeaders.forEach((header) => {
    const value = req.headers.get(header);
    if (value) {
      safeHeaders.set(header, value);
    }
  });

  return safeHeaders;
}

/**
 * Add security headers to response.
 * These headers help protect against common web vulnerabilities.
 */
function addSecurityHeaders(resp: NextResponse): void {
  resp.headers.set('X-Content-Type-Options', 'nosniff');
  resp.headers.set('X-Frame-Options', 'DENY');
}

/**
 * Proxy function implementing Backend-for-Frontend (BFF) pattern.
 * 
 * Security Model:
 * - CSRF Protection: Auth0 SDK uses HttpOnly, SameSite cookies which provide CSRF protection.
 *   The session cookie is not accessible to JavaScript (HttpOnly) and SameSite prevents
 *   cross-site requests from including the cookie. This is the recommended approach for
 *   cookie-based authentication in BFF patterns.
 * 
 * - Token Handling: Client never directly handles access tokens. Tokens are obtained
 *   server-side via getAccessToken() and injected into upstream requests. Client cookies
 *   (Auth0 session) are handled server-side and never forwarded to backend.
 * 
 * - Header Sanitization: Only safe headers are forwarded to upstream. Client cookies and
 *   authorization headers are stripped to prevent data leakage and confusion.
 */
async function proxy(req: NextRequest, path: string[]) {
  const requestId = generateRequestId();
  const authRes = new NextResponse();

  // Validate path input
  const pathValidation = validatePath(path);
  if (!pathValidation.valid) {
    logError(requestId, "Path validation failed", new Error(pathValidation.error), { path });
    const resp = NextResponse.json(
      { error: "Invalid request path", requestId },
      { status: 400 }
    );
    addSecurityHeaders(resp);
    return resp;
  }

  const sanitizedPath = pathValidation.sanitized!;

  // Check session
  // CSRF protection: Auth0 SDK uses HttpOnly, SameSite cookies which provide
  // CSRF protection. The session cookie is not accessible to JavaScript and
  // SameSite prevents cross-site requests from including the cookie.
  let session = null;
  try {
    session = await auth0.getSession(req);
  } catch (error) {
    logError(requestId, "Session retrieval failed", error);
    const resp = NextResponse.json(
      { error: "Authentication failed", requestId },
      { status: 401 }
    );
    addSecurityHeaders(resp);
    return resp;
  }

  if (!session) {
    const resp = NextResponse.json(
      { error: "No session found", requestId },
      { status: 401 }
    );
    addSecurityHeaders(resp);
    return resp;
  }

  // Get access token
  let bearer: string | undefined;
  try {
    const tokenRes = await auth0.getAccessToken(req, authRes, {
      refresh: true,
    });
    bearer = tokenRes?.token;
  } catch (error) {
    logError(requestId, "Token retrieval failed", error);
    const resp = NextResponse.json(
      { error: "Failed to obtain access token", requestId },
      { status: 401 }
    );
    mergeSetCookies(authRes.headers, resp.headers);
    addSecurityHeaders(resp);
    return resp;
  }

  if (!bearer) {
    const resp = NextResponse.json(
      { error: "Unauthorized: no access token", requestId },
      { status: 401 }
    );
    mergeSetCookies(authRes.headers, resp.headers);
    addSecurityHeaders(resp);
    return resp;
  }

  // Build target URL
  const targetUrl = `${BACKEND_URL}/api/${sanitizedPath.join("/")}${req.nextUrl.search}`;

  try {
    // Prepare headers: sanitize to strip cookies and client authorization
    // This follows BFF pattern - Auth0 session cookies handled server-side,
    // and we inject our own bearer token (not client's)
    const headers = sanitizeHeaders(req);
    headers.set("authorization", `Bearer ${bearer}`);
    headers.set("x-request-id", requestId); // Add request ID for backend tracing

    // Handle request body
    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    let body: ReadableStream<Uint8Array> | undefined;

    if (hasBody) {
      const contentLength = req.headers.get("content-length");
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        if (size > MAX_BODY_SIZE) {
          const resp = NextResponse.json(
            {
              error: `Request body too large. Maximum size: ${MAX_BODY_SIZE / 1024 / 1024}MB`,
              requestId,
            },
            { status: 413 }
          );
          addSecurityHeaders(resp);
          return resp;
        }
      }
      body = req.body as ReadableStream<Uint8Array>;
    }

    // Forward request with timeout
    const upstream = await fetchWithTimeout(
      targetUrl,
      {
        method: req.method,
        headers,
        body,
        ...(hasBody ? { duplex: "half" as const } : {}),
      },
      UPSTREAM_TIMEOUT_MS
    );

    const resp = new NextResponse(upstream.body, { status: upstream.status });

    // Copy upstream headers except Set-Cookie
    upstream.headers.forEach((v, k) => {
      if (k.toLowerCase() === "set-cookie") return;
      resp.headers.set(k, v);
    });

    // Persist Auth0 session/token updates
    mergeSetCookies(authRes.headers, resp.headers);

    // Add security headers (may override upstream headers if needed)
    addSecurityHeaders(resp);

    return resp;
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    const errorMessage = isTimeout
      ? `Upstream request timed out after ${UPSTREAM_TIMEOUT_MS}ms`
      : error instanceof Error
        ? error.message
        : "Unknown error occurred";

    logError(requestId, "Upstream fetch failed", error, {
      targetUrl,
      method: req.method,
      isTimeout,
    });

    const resp = NextResponse.json(
      {
        error: isTimeout ? "Request timeout" : "Upstream service unavailable",
        requestId,
        ...(process.env.NODE_ENV === "development" ? { detail: errorMessage } : {}),
      },
      { status: isTimeout ? 504 : 502 }
    );
    mergeSetCookies(authRes.headers, resp.headers);
    addSecurityHeaders(resp);
    return resp;
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const p = await ctx.params;
  return proxy(req, p.path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const p = await ctx.params;
  return proxy(req, p.path);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const p = await ctx.params;
  return proxy(req, p.path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const p = await ctx.params;
  return proxy(req, p.path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const p = await ctx.params;
  return proxy(req, p.path);
}
