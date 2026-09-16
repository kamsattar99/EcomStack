import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const child = spawn("pnpm", ["exec", "tsx", "artifacts/api-server/src/seed-assets-worker.ts"], { cwd: root, stdio: "inherit" });
const exitCode = await new Promise<number>((resolveExit) => child.once("exit", (code) => resolveExit(code ?? 1)));
if (exitCode !== 0) process.exitCode = exitCode;