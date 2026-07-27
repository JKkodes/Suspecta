import Groq from "groq-sdk";
import { env } from "../config/env.js";

const groq = new Groq({ apiKey: env.groqApiKey || process.env.GROQ_API_KEY });

/**
 * Truncates raw web content to keep token count under control.
 */
function truncateInput(text, maxChars = 6000) {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n...[Content truncated to save tokens]";
}

/**
 * Standard text completion helper using standard prompt strings.
 */
export async function askGroq(prompt, systemInstruction = "") {
  const safePrompt = truncateInput(prompt, 6000);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: systemInstruction || "You are a web safety and scam analysis assistant.",
        },
        {
          role: "user",
          content: safePrompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("[Groq Service Error]:", error);
    throw error;
  }
}

/**
 * Structured JSON completion helper for conversation/analysis endpoints.
 * Explicitly exported to fix the import error in conversationController.js
 */
export async function runGroqJsonCompletion(messages, options = {}) {
  try {
    // Process messages array to truncate overly large inputs and satisfy
    // the API requirement that 'messages' must contain the word 'json' when response_format is json_object.
    const safeMessages = messages.map((msg, index) => {
      let content = typeof msg.content === "string" ? truncateInput(msg.content, 6000) : msg.content;

      // Ensure system prompt mentions JSON explicitly
      if (msg.role === "system" && typeof content === "string" && !/json/i.test(content)) {
        content = `${content} Provide your response strictly in valid JSON format.`;
      }

      return {
        ...msg,
        content,
      };
    });

    // Fallback safety check: if no system message contains "json", append an explicit instruction
    const hasJsonWord = safeMessages.some(
      (m) => typeof m.content === "string" && /json/i.test(m.content)
    );

    if (!hasJsonWord && safeMessages.length > 0) {
      safeMessages[0].content = `${safeMessages[0].content} (Respond strictly in JSON format)`;
    }

    const response = await groq.chat.completions.create({
      model: options.model || "llama-3.1-8b-instant",
      messages: safeMessages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens || 1000,
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices[0]?.message?.content || "{}";
    return JSON.parse(rawContent);
  } catch (error) {
    console.error("[Groq JSON Completion Error]:", error);
    throw error;
  }
}