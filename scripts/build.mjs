import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Vercel clones the full monorepo even with Root Directory = site.
 * Vite walks up into the Expo app tsconfig (extends expo/tsconfig.base)
 * and fails because expo isn't installed for the marketing site.
 *
 * Temporarily move only that Expo root tsconfig for this build.
 * Important: restore BEFORE process.exit — exit skips `finally` in Node.
 */
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(siteRoot, "..");
const parentTsconfig = path.join(repoRoot, "tsconfig.json");
const backup = path.join(repoRoot, "tsconfig.vercel-bak.json");
const apiDir = path.join(siteRoot, "src/pages/api");
const apiHold = path.join(siteRoot, ".api-hold");
const githubPages = process.env.GITHUB_PAGES === "true";

function isExpoRootTsconfig(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").includes("expo/tsconfig.base");
  } catch {
    return false;
  }
}

function restoreParent() {
  if (fs.existsSync(backup)) {
    fs.renameSync(backup, parentTsconfig);
  }
}

function holdServerRoutes() {
  if (!githubPages || !fs.existsSync(apiDir) || fs.existsSync(apiHold)) return;
  fs.renameSync(apiDir, apiHold);
}

function restoreServerRoutes() {
  if (fs.existsSync(apiHold)) {
    fs.renameSync(apiHold, apiDir);
  }
}

let moved = false;
try {
  if (
    fs.existsSync(parentTsconfig) &&
    !fs.existsSync(backup) &&
    isExpoRootTsconfig(parentTsconfig)
  ) {
    fs.renameSync(parentTsconfig, backup);
    moved = true;
  }
  holdServerRoutes();

  const result = spawnSync("npx", ["astro", "build"], {
    cwd: siteRoot,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  restoreServerRoutes();
  if (moved) restoreParent();
  process.exit(result.status ?? 1);
} catch (error) {
  restoreServerRoutes();
  if (moved) restoreParent();
  throw error;
}
