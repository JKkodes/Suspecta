// Frees up the backend's port before starting the server, so a leftover
// process from a previously-closed terminal never causes EADDRINUSE again.
// Runs automatically before "npm run dev" / "npm start" (see package.json's
// "predev" / "prestart" scripts) - you should never need to run this by hand.
import { execSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 5000;

function run(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString();
}

function freePortWindows(port) {
  try {
    const output = run(`netstat -ano | findstr :${port}`);
    const pids = new Set(
      output
        .split("\n")
        .filter((line) => line.includes("LISTENING"))
        .map((line) => line.trim().split(/\s+/).pop())
        .filter(Boolean)
    );
    for (const pid of pids) {
      try {
        run(`taskkill /PID ${pid} /F`);
        console.log(`[ScamLens] Freed port ${port} (stopped leftover process ${pid}).`);
      } catch {
        // Process may have already exited between the check and the kill - fine either way.
      }
    }
  } catch {
    // No matching output means nothing is listening on the port - nothing to do.
  }
}

function freePortUnix(port) {
  // Try lsof first (present by default on macOS and most Linux dev setups).
  try {
    const pids = run(`lsof -ti tcp:${port}`).trim().split("\n").filter(Boolean);
    if (pids.length > 0) {
      for (const pid of pids) {
        try {
          run(`kill -9 ${pid}`);
          console.log(`[ScamLens] Freed port ${port} (stopped leftover process ${pid}).`);
        } catch {
          // Already gone - fine.
        }
      }
      return;
    }
  } catch {
    // lsof missing or nothing found on that port - fall through to fuser.
  }

  // Fallback for Linux boxes without lsof (fuser ships with psmisc, common on Debian/Ubuntu).
  try {
    run(`fuser -k ${port}/tcp`);
    console.log(`[ScamLens] Freed port ${port} via fuser.`);
  } catch {
    // Neither tool available, or nothing was listening - nothing more we can do here,
    // and that's fine: if the port really is free, startup proceeds normally.
  }
}

try {
  if (process.platform === "win32") {
    freePortWindows(port);
  } else {
    freePortUnix(port);
  }
} catch (err) {
  // Never block startup because of this helper - worst case, the server's
  // own EADDRINUSE handler in server.js will still give a clear message.
  console.warn(`[ScamLens] Port cleanup check skipped: ${err.message}`);
}