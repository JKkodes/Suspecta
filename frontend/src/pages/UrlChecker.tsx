import { useState } from "react";
import LoadingState from "../components/LoadingState";
import { UrlReportView } from "../components/ReportDisplay";
import { analyzeUrl } from "../lib/api";
import type { UrlReport } from "../types";

const LOADING_MESSAGES = [
  "Looking up the domain...",
  "Checking public reputation...",
  "Weighing the price against the market...",
  "Compiling the case file...",
];

export default function UrlChecker() {
  const [url, setUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<UrlReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setError(null);
    setReport(null);
    setLoading(true);
    try {
      const result = await analyzeUrl(url.trim(), productName.trim() || undefined);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canAnalyze = url.trim().length > 3 && !loading;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="case-label text-xs text-brick-light mb-3">Feature 02</p>
      <h1 className="stamp text-3xl mb-3">URL safety checker</h1>
      <p className="text-cream-dim mb-8 leading-relaxed">
        Drop in the website or listing link. Add a product name if you want ScamLens to weigh in on
        whether the price and offer look realistic.
      </p>

      <div className="space-y-4 mb-4">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/listing/123"
          className="w-full bg-navy-light border border-navy-lighter rounded-sm p-3 text-sm text-cream placeholder:text-cream-dim/60 focus:border-brick-light outline-none"
        />
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Product name (optional) - e.g. iPhone 15 Pro"
          className="w-full bg-navy-light border border-navy-lighter rounded-sm p-3 text-sm text-cream placeholder:text-cream-dim/60 focus:border-brick-light outline-none"
        />
      </div>

      <div className="flex justify-end mb-10">
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="bg-brick hover:bg-brick-light disabled:bg-navy-lighter disabled:text-cream-dim disabled:cursor-not-allowed transition-colors text-cream px-6 py-2.5 rounded case-label text-xs"
        >
          Analyze link
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
          <UrlReportView report={report} />
        </div>
      )}
    </div>
  );
}