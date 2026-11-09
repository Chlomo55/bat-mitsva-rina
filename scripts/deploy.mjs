import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(root, "..");
const stateDir = path.join(projectRoot, ".netlify");
const stateFile = path.join(stateDir, "state.json");
const siteName = process.env.NETLIFY_SITE_NAME || "bat-mitsva-rina";
const adminPassword = process.env.ADMIN_PASSWORD || "1234";

function run(args, opts = {}) {
  console.log(`\n> npx netlify ${args.join(" ")}`);
  const result = spawnSync("npx", ["netlify", ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: opts.capture ? "pipe" : "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    if (opts.capture) {
      const err = (result.stderr || result.stdout || "").trim();
      throw new Error(err || `netlify ${args[0]} failed`);
    }
    process.exit(result.status ?? 1);
  }
  return opts.capture ? `${result.stdout || ""}${result.stderr || ""}` : "";
}

function getLinkedSiteId() {
  if (!existsSync(stateFile)) return null;
  try {
    const state = JSON.parse(readFileSync(stateFile, "utf8"));
    return state?.siteId || null;
  } catch {
    return null;
  }
}

function ensureLoggedIn() {
  const status = run(["status", "--json"], { capture: true });
  try {
    const parsed = JSON.parse(status);
    if (parsed?.account) return;
  } catch {
    // older CLIs may not support --json cleanly
  }
  if (/Not logged in|not logged in|Error/i.test(status) && !/Current project/i.test(status)) {
    console.log("\nConnexion Netlify requise…");
    run(["login"]);
  }
}

function ensureSite() {
  if (getLinkedSiteId()) {
    console.log("Site Netlify déjà lié.");
    return;
  }

  console.log(`\nCréation / liaison du site « ${siteName} »…`);
  try {
    run(["sites:create", "--name", siteName, "--manual"]);
  } catch (err) {
    const message = String(err.message || err);
    if (!/already exists|Name already taken|unique/i.test(message)) {
      // If create failed for another reason, try listing and linking by name.
      console.warn(message);
    }
  }

  const listOut = run(["sites:list", "--json"], { capture: true });
  let sites = [];
  try {
    sites = JSON.parse(listOut);
  } catch {
    throw new Error("Impossible de lister les sites Netlify.");
  }
  const site =
    sites.find((s) => s.name === siteName) ||
    sites.find((s) => (s.name || "").includes("bat-mitsva-rina"));
  if (!site?.id) {
    throw new Error(
      `Site « ${siteName} » introuvable. Crée-le sur app.netlify.com puis relance npm run deploy.`,
    );
  }

  mkdirSync(stateDir, { recursive: true });
  writeFileSync(
    stateFile,
    JSON.stringify({ siteId: site.id, siteName: site.name }, null, 2),
  );
  console.log(`Site lié : ${site.name} (${site.id})`);
}

function setAdminPassword() {
  run(["env:set", "ADMIN_PASSWORD", adminPassword, "--context", "production"]);
  run(["env:set", "ADMIN_PASSWORD", adminPassword, "--context", "deploy-preview"]);
  run(["env:set", "ADMIN_PASSWORD", adminPassword, "--context", "branch-deploy"]);
}

function deploy() {
  run(["deploy", "--prod", "--dir", ".", "--functions", "netlify/functions"]);
}

ensureLoggedIn();
ensureSite();
setAdminPassword();
deploy();

console.log("\nDéploiement terminé.");
console.log(`Mot de passe admin : ${adminPassword}`);
