import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

import { env } from "../env.js";

const JWKS = createRemoteJWKSet(new URL("/auth/v1/.well-known/jwks.json", env.SUPABASE_URL));

export interface SupabaseUser {
  id: string;
  email?: string;
  /** Chosen at sign-up (stored in Supabase's user_metadata) - used to provision public.users.username on first request. */
  username?: string;
}

export interface SupabaseAccessTokenPayload extends JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  user_metadata?: { username?: string };
}

/**
 * Verifies a Supabase Auth access token (the JWT the client SDK gets on
 * sign-in) against Supabase's published JWKS. This is the *only* thing the
 * client-side Supabase SDK is used for; every other request carries this
 * token as a bearer token to the API, which is the sole reader/writer of
 * application data.
 */
export async function verifySupabaseAccessToken(token: string): Promise<SupabaseUser> {
  const { payload } = await jwtVerify<SupabaseAccessTokenPayload>(token, JWKS, {
    issuer: new URL("/auth/v1", env.SUPABASE_URL).toString()
  });
  if (!payload.sub) {
    throw new Error("Token payload missing sub claim");
  }
  return { id: payload.sub, email: payload.email, username: payload.user_metadata?.username };
}
