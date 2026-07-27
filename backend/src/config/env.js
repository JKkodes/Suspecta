import dotenv from "dotenv";
dotenv.config();

export const env = {
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  webSearchApiKey: process.env.WEB_SEARCH_API_KEY || "",
  port: Number(process.env.PORT) || 5000,
  frontendUrl: process.env.FRONTEND_URL || "*",
};

if (!env.groqApiKey) {
  console.warn(
    "[Suspecta] WARNING: GROQ_API_KEY is not set. Copy .env.example to .env and add your key, " +
      "or requests to /api/conversation/analyze and /api/url/analyze will fail."
  );
}
