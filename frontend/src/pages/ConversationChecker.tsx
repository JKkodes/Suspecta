import { useState } from "react";
import LoadingState from "../components/LoadingState";
import { ConversationReportView } from "../components/ReportDisplay";
import { analyzeConversation } from "../lib/api";
import type { ConversationReport } from "../types";

const LOADING_MESSAGES = [
  "Reading conversation & detecting languages...",
  "Translating Roman Urdu / local slang if needed...",
  "Looking for pressure tactics and advance payment demands...",
  "Checking pricing against market reality...",
  "Compiling case file and safety report...",
];

export default function ConversationChecker() {
  const [conversation, setConversation] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ConversationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setError(null);
    setReport(null);
    setLoading(true);
    try {
      const result = await analyzeConversation(conversation);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canAnalyze = conversation.trim().length >= 20 && !loading;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="case-label text-xs text-brick-light mb-3">Feature 01</p>
      <h1 className="stamp text-3xl mb-3">Conversation checker</h1>
      <p className="text-cream-dim mb-8 leading-relaxed">
        Paste your entire chat with the seller below &mdash; WhatsApp, Messenger, Instagram, Telegram, or
        SMS (supports English, Roman Urdu, and local dialects). Nothing is saved unless you choose to keep it.
      </p>

      <textarea
        value={conversation}
        onChange={(e) => setConversation(e.target.value)}
        placeholder="Paste your conversation here (e.g. WhatsApp chat in English or Roman Urdu)..."
        rows={12}
        className="w-full bg-navy-light border border-navy-lighter rounded-sm p-4 text-sm text-cream placeholder:text-cream-dim/60 focus:border-brick-light outline-none resize-y"
      />

      <div className="flex items-center justify-between mt-4 mb-10">
        <p className="text-xs text-cream-dim">{conversation.length.toLocaleString()} / 20,000 characters</p>
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="bg-brick hover:bg-brick-light disabled:bg-navy-lighter disabled:text-cream-dim disabled:cursor-not-allowed transition-colors text-cream px-6 py-2.5 rounded case-label text-xs"
        >
          Analyze conversation
        </button>
      </div>

      {loading && <LoadingState messages={LOADING_MESSAGES} />}

      {error && (
        <div className="border border-signal-high/50 bg-signal-danger/10 rounded-sm p-4 text-sm text-signal-high">
          {error}
        </div>
      )}

      {report && !loading && (
        <div className="border border-navy-lighter rounded-sm p-6 bg-navy-light/30">
          <ConversationReportView report={report} />
        </div>
      )}
    </div>
  );
}