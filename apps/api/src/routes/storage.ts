import type { FastifyPluginAsync } from "fastify";

import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const AVATARS_BUCKET = "avatars";

const storageRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/storage/avatar-upload-url",
    {
      schema: {
        tags: ["storage"],
        summary: "Issue a short-lived signed upload URL for the caller's own avatar. Clients never hold the service role key."
      },
      preHandler: app.requireAuth
    },
    async (request, reply) => {
      const path = `${request.user!.id}/avatar.png`;
      const { data, error } = await supabaseAdmin.storage.from(AVATARS_BUCKET).createSignedUploadUrl(path);
      if (error || !data) {
        request.log.error({ err: error }, "failed to create signed upload URL");
        return reply.code(502).send({ error: "Could not create an upload URL" });
      }
      return { path: data.path, token: data.token, signedUrl: data.signedUrl };
    }
  );
};

export default storageRoutes;
