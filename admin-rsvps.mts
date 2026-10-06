import type { Config, Context } from "@netlify/functions";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { rsvps } from "../../db/schema.js";
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

  if (req.method === "GET") {
    const list = await db.select().from(rsvps).orderBy(desc(rsvps.createdAt));
    return Response.json(list);
  }

  if (req.method === "POST") {
    const data = parseRsvp(await req.json().catch(() => null));
    if (!data) return Response.json({ error: "Nom et e-mail valides requis" }, { status: 400 });
    const [created] = await db.insert(rsvps).values(data).returning();
    return Response.json(created, { status: 201 });
  }

  if (req.method === "PUT" && id) {
    const data = parseRsvp(await req.json().catch(() => null));
    if (!data) return Response.json({ error: "Nom et e-mail valides requis" }, { status: 400 });
    const [updated] = await db
      .update(rsvps)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(rsvps.id, id))
      .returning();
    if (!updated) return Response.json({ error: "Introuvable" }, { status: 404 });
    return Response.json(updated);
  }

  if (req.method === "DELETE" && id) {
    await db.delete(rsvps).where(eq(rsvps.id, id));
    return new Response(null, { status: 204 });
  }

  if (req.method === "DELETE") {
    await db.delete(rsvps);
    return new Response(null, { status: 204 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: ["/api/admin/rsvps", "/api/admin/rsvps/:id"],
};
