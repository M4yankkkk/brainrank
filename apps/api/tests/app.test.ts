import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

// buildApp() only registers routes and constructs (lazy) DB/HTTP clients - it
// never opens a real connection, so these run without a live Supabase project.
process.env.DATABASE_URL ??= "postgresql://postgres:password@localhost:54322/postgres";
process.env.SUPABASE_URL ??= "http://localhost:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.CRON_SECRET ??= "test-cron-secret-0123456789abcdef";
process.env.WEB_ORIGIN ??= "http://localhost:3000";

const { buildApp } = await import("../src/app.js");

describe("app", () => {
  let app: FastifyInstance;

  beforeAll(() => {
    app = buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it("GET /ping returns pong", async () => {
    const res = await app.inject({ method: "GET", url: "/ping" });
    expect(res.statusCode).toBe(200);
    expect(res.payload).toBe("pong");
  });

  it("handles CORS preflight for allowed origin", async () => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/auth/username-available",
      headers: {
        origin: "http://localhost:3000",
        "access-control-request-method": "GET"
      }
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("rejects protected routes without a bearer token", async () => {
    const res = await app.inject({ method: "GET", url: "/puzzles/today" });
    expect(res.statusCode).toBe(401);
  });

  it("rejects protected routes with a malformed bearer token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/puzzles/today",
      headers: { authorization: "Bearer not-a-real-jwt" }
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects internal cron routes without the shared secret", async () => {
    const res = await app.inject({ method: "POST", url: "/internal/cron/daily-rollover", payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it("serves the OpenAPI document", async () => {
    const res = await app.inject({ method: "GET", url: "/docs/json" });
    expect(res.statusCode).toBe(200);
    const spec = res.json();
    expect(spec.paths).toHaveProperty("/puzzles/today");
    expect(spec.paths).toHaveProperty("/groups");
  });
});
