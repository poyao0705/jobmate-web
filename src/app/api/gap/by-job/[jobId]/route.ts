import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5001";
const UPSTREAM_TIMEOUT_MS = 30000; // 30 seconds

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
 * GET handler for gap report by job ID.
 * Implements Backend-for-Frontend (BFF) pattern.
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
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ jobId: string }> }
) {
	const requestId = generateRequestId();
	const authRes = new NextResponse();
	const { jobId } = await params;

	// Validate jobId
	if (!jobId || jobId.trim().length === 0) {
		const resp = NextResponse.json(
			{ error: "Invalid job ID", requestId },
			{ status: 400 }
		);
		addSecurityHeaders(resp);
		return resp;
	}

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

	const targetUrl = `${BACKEND_URL}/api/gap/by-job/${jobId}`;

	try {
		// Prepare headers: sanitize to strip cookies and client authorization
		// This follows BFF pattern - Auth0 session cookies handled server-side,
		// and we inject our own bearer token (not client's)
		const headers = sanitizeHeaders(req);
		headers.set("authorization", `Bearer ${bearer}`);
		headers.set("x-request-id", requestId); // Add request ID for backend tracing

		// Forward request with timeout
		const upstream = await fetchWithTimeout(
			targetUrl,
			{
				method: "GET",
				headers,
				next: { tags: [`gap-report-${jobId}`] },
			},
			UPSTREAM_TIMEOUT_MS
		);

		const data = await upstream.json().catch(() => null);
		const resp = NextResponse.json(data, { status: upstream.status });

		// Persist Auth0 session/token updates
		mergeSetCookies(authRes.headers, resp.headers);

		// Add security headers
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
			method: "GET",
			jobId,
			isTimeout,
		});

		const resp = NextResponse.json(
			{
				error: isTimeout ? "Request timeout" : "Failed to retrieve gap report",
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

