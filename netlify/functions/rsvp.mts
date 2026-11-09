import type { Config } from "@netlify/functions";
import { supabase, toClient } from "../../db/supabase.js";
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

  try {
    const rows = await supabase("", { method: "POST", body: JSON.stringify(data) });
    return Response.json(toClient(rows[0]), { status: 201 });
  } catch (e) {
    return Response.json({ error: "Impossible d'enregistrer votre réponse pour le moment." }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/rsvp",
};

