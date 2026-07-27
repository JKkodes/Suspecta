import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import urlRoutes from "./routes/urlRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiLimiter, aiScanLimiter } from "./middleware/rateLimiter.js";

const app = express();

app.use(helmet());
// Vite bumps to the next free port (5174, 5175...) whenever 5173 is already
// taken, so a single hardcoded FRONTEND_URL is brittle in local dev. Accept
// any http://localhost:<port> origin automatically; still respect an
// explicit FRONTEND_URL (e.g. a real domain) for anything non-localhost.
const localhostOrigin = /^http:\/\/localhost:\d+$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // non-browser requests (curl, Postman, server-to-server)
      if (localhostOrigin.test(origin)) return callback(null, true);
      if (origin === env.frontendUrl) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "scamlens-backend" });
});

// General rate limiter for basic API routes
app.use("/api", apiLimiter);

// Specific strict rate limiter for heavy Groq AI operations
app.use("/api/conversation", aiScanLimiter, conversationRoutes);
app.use("/api/url", aiScanLimiter, urlRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(`ScamLens backend running on http://localhost:${env.port}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\n[ScamLens] Port ${env.port} is already in use by another process.\n` +
        `This usually means a previous "npm run dev" is still running in another terminal.\n` +
        `Close that terminal (or just run "npm run dev" again - it now frees the port automatically),\n` +
        `or set a different PORT in your .env file.\n`
    );
    process.exit(1);
  }
  throw err;
});