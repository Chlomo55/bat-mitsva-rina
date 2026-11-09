const TABLE = "rsvps";

export class ConfigError extends Error {}

export async function supabase(path: string, init: RequestInit = {}) {
  const url = (Netlify.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
  const key = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) throw new ConfigError("Variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes");

  const res = await fetch(`${url}/rest/v1/${TABLE}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    console.error("Supabase error", res.status, await res.text());
    throw new Error("Erreur de base de données");
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function toClient(r: any) {
  return {
    id: r.id,
    nom: r.nom,
    email: r.email,
    presence: r.presence,
    guests: r.guests,
    createdAt: r.created_at,
  };
}
