import type { ConversationReport, UrlReport } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data.report as T;
}

export function analyzeConversation(conversation: string): Promise<ConversationReport> {
  return post<ConversationReport>("/api/conversation/analyze", { conversation });
}

export function analyzeUrl(url: string, productName?: string): Promise<UrlReport> {
  return post<UrlReport>("/api/url/analyze", { url, productName });
}
