import { getStore } from "@netlify/blobs";

export type RsvpRow = {
  id: number;
  nom: string;
  email: string;
  presence: string;
  guests: number;
  created_at: string;
  updated_at: string;
};

function store() {
  return getStore({ name: "rsvps", consistency: "strong" });
}

async function readAll(): Promise<RsvpRow[]> {
  const data = await store().get("all", { type: "json" });
  return Array.isArray(data) ? (data as RsvpRow[]) : [];
}

async function writeAll(rows: RsvpRow[]) {
  await store().setJSON("all", rows);
}

export function toClient(r: RsvpRow) {
  return {
    id: r.id,
    nom: r.nom,
    email: r.email,
    presence: r.presence,
    guests: r.guests,
    createdAt: r.created_at,
  };
}

export async function listRsvps() {
  const rows = await readAll();
  return rows
    .slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map(toClient);
}

export async function createRsvp(data: {
  nom: string;
  email: string;
  presence: string;
  guests: number;
}) {
  const rows = await readAll();
  const now = new Date().toISOString();
  const nextId = rows.reduce((max, row) => Math.max(max, row.id || 0), 0) + 1;
  const row: RsvpRow = {
    id: nextId,
    ...data,
    created_at: now,
    updated_at: now,
  };
  rows.push(row);
  await writeAll(rows);
  return toClient(row);
}

export async function updateRsvp(
  id: number,
  data: { nom: string; email: string; presence: string; guests: number },
) {
  const rows = await readAll();
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return null;
  rows[index] = {
    ...rows[index],
    ...data,
    updated_at: new Date().toISOString(),
  };
  await writeAll(rows);
  return toClient(rows[index]);
}

export async function deleteRsvp(id: number | null) {
  const rows = await readAll();
  await writeAll(id == null ? [] : rows.filter((row) => row.id !== id));
  return true;
}
