export function parseRsvp(body: any) {
  const nom = String(body?.nom ?? "").trim().slice(0, 200);
  const email = String(body?.email ?? "").trim().slice(0, 200);
  const presence = body?.presence === "absent" ? "absent" : "present";
  const guests = Math.min(20, Math.max(1, parseInt(body?.guests, 10) || 1));
  if (!nom || !email || !/^\S+@\S+\.\S+$/.test(email)) return null;
  return { nom, email, presence, guests };
}
