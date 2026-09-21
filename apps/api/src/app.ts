import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";

import { env } from "./env.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import puzzlesRoutes from "./routes/puzzles.js";
import attemptsRoutes from "./routes/attempts.js";
import groupsRoutes from "./routes/groups.js";
import storageRoutes from "./routes/storage.js";
import statsRoutes from "./routes/stats.js";
import cronRoutes from "./routes/cron.js";

export function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const allowedOrigins = env.WEB_ORIGIN.split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const normalized = origin.trim().replace(/\/+$/, "");
      if (
        allowedOrigins.includes(normalized) ||
        allowedOrigins.some((allowed) => allowed.includes("vercel.app") && normalized.endsWith(".vercel.app"))
      ) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-cron-secret"]
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: "Brainrank API",
        description:
          "All Brainrank business logic: move-log replay and scoring via @brainrank/engine, groups, seasons, " +
          "leaderboards. Supabase provides only Postgres/Auth/Storage; clients authenticate with Supabase and send " +
          "the resulting access token as a Bearer token to every route here.",
        version: "0.1.0"
      },
      servers: [{ url: "/" }],
      components: {
        securitySchemes: {
          supabaseAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
        }
      },
      security: [{ supabaseAuth: [] }]
    },
    transform: jsonSchemaTransform
  });
  app.register(swaggerUi, { routePrefix: "/docs" });

  app.register(authPlugin);

  app.get("/health", { schema: { tags: ["meta"] } }, async () => ({ ok: true }));
  app.get("/ping", { schema: { tags: ["meta"] } }, async () => "pong");

  app.register(authRoutes);
  app.register(puzzlesRoutes);
  app.register(attemptsRoutes);
  app.register(groupsRoutes);
  app.register(storageRoutes);
  app.register(statsRoutes);
  app.register(cronRoutes);

  return app;
}
