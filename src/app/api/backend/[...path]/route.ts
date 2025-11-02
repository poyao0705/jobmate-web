// app/api/backend/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5001";

async function proxy(req: NextRequest, path: string[]) {
  // First check if we have a session
  let session;
  try {
    session = await auth0.getSession();
  } catch {
    console.warn('Session check failed');
  }
  
  let bearer: string | undefined;
  
  // If no session, return 401 immediately
  if (!session) {
    return NextResponse.json({ error: "No session found" }, { status: 401 });
  }
  
  try {
    const tokenRes = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
      scope: process.env.AUTH0_SCOPE || "openid profile email",
    });
    
    bearer = tokenRes?.token ?? undefined;
  } catch {
    console.warn('Auth0 token retrieval failed');
    bearer = undefined;
  }

  // Check for authentication
  if (!bearer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetUrl = `${BACKEND_URL}/api/${path.join("/")}${req.nextUrl.search}`;
  
  try {
    const headers = new Headers();
    if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
    if (req.headers.get("content-type")) {
      headers.set("content-type", req.headers.get("content-type") as string);
    }
    // You may want to strip hop-by-hop headers here
    headers.delete("content-length"); // Let fetch set correct length/transfer-encoding

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? (req.body as ReadableStream<Uint8Array>) : undefined,
      // Required for Node.js to actually stream the request body
      ...(hasBody ? { duplex: "half" as const } : {}),
    });
    
    const resp = new NextResponse(upstream.body, { status: upstream.status });
    upstream.headers.forEach((v, k) => resp.headers.set(k, v));
    return resp;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Upstream fetch failed:', msg);
    return NextResponse.json({ 
      error: "Upstream fetch failed"
    }, { status: 502 });
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
