import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5001";

async function getAccessToken() {
	try {
		const tokenRes = await auth0.getAccessToken({
			refresh: true,
			audience: process.env.AUTH0_AUDIENCE,
			scope: process.env.AUTH0_SCOPE || "openid profile email",
		} as { refresh?: boolean; audience?: string; scope?: string });
		return tokenRes?.token ?? null;
	} catch (error) {
		console.warn("Failed to retrieve Auth0 token", error);
		return null;
	}
}

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ jobId: string }> }
) {
	const { jobId } = await params;
	const session = await auth0
		.getSession()
		.catch(() => {
			console.warn("Session check failed");
			return undefined;
		});

	if (!session) {
		return NextResponse.json({ error: "No session found" }, { status: 401 });
	}

	const token = await getAccessToken();
	if (!token) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const targetUrl = `${BACKEND_URL}/api/gap/by-job/${jobId}`;

	try {
		const upstream = await fetch(targetUrl, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			next: { tags: [`gap-report-${jobId}`] },
		});

		const data = await upstream.json().catch(() => null);
		return NextResponse.json(data, { status: upstream.status });
	} catch (error) {
		console.error("Failed to fetch gap report", error);
		return NextResponse.json(
			{ error: "Failed to retrieve gap report" },
			{ status: 502 }
		);
	}
}

