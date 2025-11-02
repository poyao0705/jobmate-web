// lib/auth0.ts
import { Auth0Client } from "@auth0/nextjs-auth0/server";

function normalizeDomain(value?: string) {
  if (!value) return undefined;
  // Accept either plain domain (dev-xyz.us.auth0.com) or full issuer URL (https://dev-xyz.us.auth0.com)
  try {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      const u = new URL(value);
      return u.host;
    }
    // strip any trailing slash just in case
    return value.replace(/\/$/, "");
  } catch {
    return value;
  }
}

const domain = normalizeDomain(
  process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL
);
const appBaseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL;

export const auth0 = new Auth0Client({
  // Explicitly pass options so the SDK doesn't error when env var names differ
  domain,
  appBaseUrl,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,

  authorizationParameters: {
    // Provide API audience/scope explicitly when needed
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  },
});
