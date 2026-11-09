import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRsvp,
  deleteRsvp,
  listRsvps,
  parseRsvp,
  updateRsvp,
} from "./db/local-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4173;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function sendJson(res, status, body) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function sendText(res, status, text, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": Buffer.byteLength(text),
  });
  res.end(text);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return null;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isAuthorized(req) {
  return req.headers["x-admin-password"] === ADMIN_PASSWORD;
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/rsvp") {
    if (req.method !== "POST") {
      return sendText(res, 405, "Method not allowed");
    }
    try {
      const body = await readJson(req);
      const data = parseRsvp(body);
      if (!data) {
        return sendJson(res, 400, {
          error: "Merci de renseigner un nom et un e-mail valides.",
        });
      }
      const created = await createRsvp(data);
      return sendJson(res, 201, created);
    } catch {
      return sendJson(res, 500, {
        error: "Impossible d'enregistrer votre réponse pour le moment.",
      });
    }
  }

  const adminMatch = url.pathname.match(/^\/api\/admin\/rsvps(?:\/(\d+))?$/);
  if (adminMatch) {
    if (!isAuthorized(req)) {
      return sendJson(res, 401, { error: "Mot de passe incorrect" });
    }

    const id = adminMatch[1] ? Number(adminMatch[1]) : null;

    try {
      if (req.method === "GET") {
        return sendJson(res, 200, await listRsvps());
      }

      if (req.method === "POST") {
        const data = parseRsvp(await readJson(req).catch(() => null));
        if (!data) {
          return sendJson(res, 400, { error: "Nom et e-mail valides requis" });
        }
        return sendJson(res, 201, await createRsvp(data));
      }

      if (req.method === "PUT" && id) {
        const data = parseRsvp(await readJson(req).catch(() => null));
        if (!data) {
          return sendJson(res, 400, { error: "Nom et e-mail valides requis" });
        }
        const updated = await updateRsvp(id, data);
        if (!updated) return sendJson(res, 404, { error: "Introuvable" });
        return sendJson(res, 200, updated);
      }

      if (req.method === "DELETE") {
        await deleteRsvp(id);
        res.writeHead(204);
        return res.end();
      }

      return sendText(res, 405, "Method not allowed");
    } catch {
      return sendJson(res, 500, { error: "Erreur de base de données" });
    }
  }

  return false;
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    return sendText(res, 403, "Forbidden");
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    sendText(res, 404, "Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const handled = await handleApi(req, res, url);
    if (handled === false) await serveStatic(req, res, url);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: "Erreur serveur" });
  }
});

server.listen(PORT, () => {
  console.log(`Bat Mitsva Rina → http://127.0.0.1:${PORT}`);
  console.log(`Admin password  → ${ADMIN_PASSWORD}`);
});
