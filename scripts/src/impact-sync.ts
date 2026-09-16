import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// This remains a scheduler-friendly single process while preserving the
// workspace boundary: scripts do not import application artifacts.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const child = spawn("pnpm", ["exec", "tsx", "artifacts/api-server/src/impact-worker.ts"], { cwd: root, stdio: "inherit" });
const exitCode = await new Promise<number>((resolve) => child.once("exit", (code) => resolve(code ?? 1)));
if (exitCode !== 0) process.exitCode = exitCode;