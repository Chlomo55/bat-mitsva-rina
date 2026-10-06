import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { rsvps } from "../../db/schema.js";
import { parseRsvp } from "../../db/validate.js";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }

  const data = parseRsvp(body);
  if (!data) {
    return Response.json({ error: "Merci de renseigner un nom et un e-mail valides." }, { status: 400 });
  }

  const [created] = await db.insert(rsvps).values(data).returning();
  return Response.json(created, { status: 201 });
};

export const config: Config = {
  path: "/api/rsvp",
};
