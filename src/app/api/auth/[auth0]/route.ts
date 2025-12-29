import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const host = (process.env.AUTH0_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ auth0: string }> }) {
	const { auth0: action } = await ctx.params;

	if (action === "login") {
		const returnTo = req.nextUrl.searchParams.get("returnTo") || "/";
		const authUrl = new URL(`https://${host}/authorize`);
		authUrl.searchParams.set("client_id", process.env.AUTH0_CLIENT_ID || "");
		authUrl.searchParams.set("response_type", "code");
		authUrl.searchParams.set("redirect_uri", `${process.env.APP_BASE_URL}/api/auth/callback`);
		authUrl.searchParams.set("scope", process.env.AUTH0_SCOPE || "openid profile email");
		if (process.env.AUTH0_AUDIENCE) authUrl.searchParams.set("audience", process.env.AUTH0_AUDIENCE);
		authUrl.searchParams.set("state", Buffer.from(JSON.stringify({ returnTo })).toString("base64"));
		return NextResponse.redirect(authUrl.toString());
	}

	if (action === "logout") {
		const logoutUrl = new URL(`https://${host}/v2/logout`);
		logoutUrl.searchParams.set("client_id", process.env.AUTH0_CLIENT_ID || "");
		logoutUrl.searchParams.set("returnTo", process.env.APP_BASE_URL || "/");
		const response = NextResponse.redirect(logoutUrl.toString());
		response.cookies.delete("appSession");
		return response;
	}

	if (action === "me") {
		// Not implemented: rely on other session endpoints or SDK
		return NextResponse.json({ error: "Not implemented" }, { status: 501 });
	}

	// callback will be handled via POST (or you can extend GET)
	return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ auth0: string }> }) {
	const { auth0: action } = await ctx.params;

	if (action === "callback") {
		// Exchange code for tokens and set a simple session cookie.
		const url = new URL(req.url);
		const code = url.searchParams.get("code");
		const stateParam = url.searchParams.get("state");

		if (!code) {
			return NextResponse.redirect(new URL("/?error=no_code", req.url));
		}

		try {
			const tokenUrl = `https://${host}/oauth/token`;
			const tokenResponse = await fetch(tokenUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					grant_type: "authorization_code",
					client_id: process.env.AUTH0_CLIENT_ID,
					client_secret: process.env.AUTH0_CLIENT_SECRET,
					code,
					redirect_uri: `${process.env.APP_BASE_URL}/api/auth/callback`,
				}),
			});

			if (!tokenResponse.ok) {
				throw new Error("Token exchange failed");
			}

			const tokens = await tokenResponse.json();

			const userInfoResponse = await fetch(`https://${host}/userinfo`, {
				headers: { Authorization: `Bearer ${tokens.access_token}` },
			});
			const user = await userInfoResponse.json().catch(() => ({}));

			const sessionData = {
				user,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				idToken: tokens.id_token,
				expiresAt: Date.now() + (tokens.expires_in || 0) * 1000,
			};

			const returnTo = stateParam
				? JSON.parse(Buffer.from(stateParam, "base64").toString()).returnTo
				: "/";

			const response = NextResponse.redirect(new URL(returnTo, req.url));
			response.cookies.set("appSession", Buffer.from(JSON.stringify(sessionData)).toString("base64"), {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 7,
				path: "/",
			});

			return response;
		} catch (err) {
			console.error("Callback error:", err);
			return NextResponse.redirect(new URL("/?error=callback_failed", req.url));
		}
	}

	return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

