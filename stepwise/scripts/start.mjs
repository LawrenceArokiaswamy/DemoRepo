// Starts the production build (`npm run build` first). Copies static assets
// into the standalone server folder, which Next.js leaves to the deployer.
import { cpSync, existsSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const standalone = resolve(root, ".next/standalone");
if (!existsSync(standalone)) {
  console.error("No production build found. Run `npm run build` first.");
  process.exit(1);
}
rmSync(resolve(standalone, ".next/static"), { recursive: true, force: true });
cpSync(resolve(root, ".next/static"), resolve(standalone, ".next/static"), { recursive: true });
const env = { ...process.env, STEPWISE_DB: process.env.STEPWISE_DB ?? resolve(root, "data/stepwise.db") };
spawn(process.execPath, ["server.js"], { cwd: standalone, env, stdio: "inherit" }).on("exit", (code) => process.exit(code ?? 0));
