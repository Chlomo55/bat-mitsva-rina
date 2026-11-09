import type { Config, Context } from "@netlify/functions";
import {
  createRsvp,
  deleteRsvp,
  listRsvps,
  updateRsvp,
} from "../../db/blobs-store.js";
import { parseRsvp } from "../../db/validate.js";

function isAuthorized(req: Request) {
  const expected = Netlify.env.get("ADMIN_PASSWORD") || "1234";
  return req.headers.get("x-admin-password") === expected;
}

export default async (req: Request, context: Context) => {
  if (!isAuthorized(req)) {
    return Response.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const id = context.params.id ? parseInt(context.params.id, 10) : null;

  try {
    if (req.method === "GET") {
      return Response.json(await listRsvps());
    }

    if (req.method === "POST") {
      const data = parseRsvp(await req.json().catch(() => null));
      if (!data) {
        return Response.json({ error: "Nom et e-mail valides requis" }, { status: 400 });
      }
      return Response.json(await createRsvp(data), { status: 201 });
    }

    if (req.method === "PUT" && id) {
      const data = parseRsvp(await req.json().catch(() => null));
      if (!data) {
        return Response.json({ error: "Nom et e-mail valides requis" }, { status: 400 });
      }
      const updated = await updateRsvp(id, data);
      if (!updated) return Response.json({ error: "Introuvable" }, { status: 404 });
      return Response.json(updated);
    }

    if (req.method === "DELETE") {
      await deleteRsvp(id);
      return new Response(null, { status: 204 });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    console.error("Admin RSVP error", err);
    return Response.json({ error: "Erreur de base de données" }, { status: 500 });
  }
};

export const config: Config = {
  path: ["/api/admin/rsvps", "/api/admin/rsvps/:id"],
};
