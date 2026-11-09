import type { Config, Context } from "@netlify/functions";
import { supabase, toClient } from "../../db/supabase.js";
import { parseRsvp } from "../../db/validate.js";

function isAuthorized(req: Request) {
  const expected = Netlify.env.get("ADMIN_PASSWORD");
  if (!expected) return false;
  return req.headers.get("x-admin-password") === expected;
}

export default async (req: Request, context: Context) => {
  if (!isAuthorized(req)) {
    return Response.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const id = context.params.id ? parseInt(context.params.id, 10) : null;

  try {
    if (req.method === "GET") {
      const rows = await supabase("?select=*&order=created_at.desc");
      return Response.json(rows.map(toClient));
    }

    if (req.method === "POST") {
      const data = parseRsvp(await req.json().catch(() => null));
      if (!data) return Response.json({ error: "Nom et e-mail valides requis" }, { status: 400 });
      const rows = await supabase("", { method: "POST", body: JSON.stringify(data) });
      return Response.json(toClient(rows[0]), { status: 201 });
    }

    if (req.method === "PUT" && id) {
      const data = parseRsvp(await req.json().catch(() => null));
      if (!data) return Response.json({ error: "Nom et e-mail valides requis" }, { status: 400 });
      const rows = await supabase(`?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }),
      });
      if (!rows || rows.length === 0) return Response.json({ error: "Introuvable" }, { status: 404 });
      return Response.json(toClient(rows[0]));
    }

    if (req.method === "DELETE") {
      await supabase(id ? `?id=eq.${id}` : "?id=gt.0", {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
      return new Response(null, { status: 204 });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    return Response.json({ error: "Erreur de base de données" }, { status: 500 });
  }
};

export const config: Config = {
  path: ["/api/admin/rsvps", "/api/admin/rsvps/:id"],
};


