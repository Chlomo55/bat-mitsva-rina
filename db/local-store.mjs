import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, "..", "data");
const dataFile = path.join(dataDir, "rsvps.json");

async function readAll() {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err && err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(rows) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(rows, null, 2), "utf8");
}

function toClient(row) {
  return {
    id: row.id,
    nom: row.nom,
    email: row.email,
    presence: row.presence,
    guests: row.guests,
    createdAt: row.created_at,
  };
}

export function parseRsvp(body) {
  const nom = String(body?.nom ?? "").trim().slice(0, 200);
  const email = String(body?.email ?? "").trim().slice(0, 200);
  const presence = body?.presence === "absent" ? "absent" : "present";
  const guests = Math.min(20, Math.max(1, parseInt(body?.guests, 10) || 1));
  if (!nom || !email || !/^\S+@\S+\.\S+$/.test(email)) return null;
  return { nom, email, presence, guests };
}

export async function listRsvps() {
  const rows = await readAll();
  return rows
    .slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map(toClient);
}

export async function createRsvp(data) {
  const rows = await readAll();
  const now = new Date().toISOString();
  const nextId = rows.reduce((max, row) => Math.max(max, row.id || 0), 0) + 1;
  const row = {
    id: nextId,
    ...data,
    created_at: now,
    updated_at: now,
  };
  rows.push(row);
  await writeAll(rows);
  return toClient(row);
}

export async function updateRsvp(id, data) {
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

export async function deleteRsvp(id) {
  const rows = await readAll();
  const next = id == null ? [] : rows.filter((row) => row.id !== id);
  await writeAll(next);
  return true;
}
