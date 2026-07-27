import { env } from "../config/env.js";

// Reputation context for the URL checker, using Tavily's search API
// (https://tavily.com - has a free tier). If WEB_SEARCH_API_KEY isn't set,
// this quietly returns an "unavailable" result and the prompt is told to
// say reputation data is insufficient rather than guessing.
//
// Instead of one generic query mashed into a text blob, this runs several
// targeted queries per source (general reviews, Trustpilot, Reddit,
// ScamAdviser, plus product-specific reviews/rating if a product name was
// given) and returns them grouped by source, so the model can reason about
// where each snippet came from instead of being handed an undifferentiated
// wall of text.

const TAVILY_ENDPOINT = "https://api.tavily.com/search";
const RESULTS_PER_QUERY = 4;
const SEARCH_TIMEOUT_MS = 8000;
const MAX_TAVILY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 300;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function cleanSnippet(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .replace(/(?:\s*(?:\.\.\.|\u2026)+\s*)$/u, "")
    .trim();
}

function extractReviewEvidence(snippet) {
  const ratingMatch = snippet.match(/\b([0-5](?:\.\d)?)\s*(?:\/\s*5|out of\s*5|stars?)\b/i);
  const countMatch = snippet.match(/\b([\d,.]+\s*[kKmM]?)\s*(?:customer\s+)?reviews?\b/i);

  return {
    reviewRating: ratingMatch ? ratingMatch[1] : null,
    reviewCount: countMatch ? countMatch[1] : null,
  };
}

function isOfficialWebsite(url, domain) {
  if (!url || !domain) return false;

  try {
    const resultHost = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const targetHost = String(domain)
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
    return resultHost === targetHost || resultHost.endsWith(`.${targetHost}`);
  } catch {
    return false;
  }
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.href.replace(/\/$/, "").toLowerCase();
  } catch {
    return String(url || "").trim().toLowerCase();
  }
}

function normalizeTitle(title) {
  return cleanSnippet(title).toLowerCase();
}

function getTavilyError(response, body, timedOut) {
  if (timedOut) return { type: "timeout", message: `Tavily request timed out after ${SEARCH_TIMEOUT_MS}ms.` };
  if (response?.status === 429) return { type: "rate_limit", message: "Tavily rate limit reached.", status: 429 };
  if (response) {
    return {
      type: "api_error",
      message: body?.detail || body?.message || `Tavily API returned HTTP ${response.status}.`,
      status: response.status,
    };
  }
  return { type: "network_error", message: "Unable to reach Tavily." };
}

async function runTavilyQuery(query, domain) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_TAVILY_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    let timedOut = false;
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, SEARCH_TIMEOUT_MS);

    try {
      const response = await fetch(TAVILY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          api_key: env.webSearchApiKey,
          query,
          max_results: RESULTS_PER_QUERY,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const results = (data.results || []).map((result) => {
          const snippet = cleanSnippet(result.content);
          return {
            title: cleanSnippet(result.title) || null,
            url: result.url || null,
            snippet,
            ...extractReviewEvidence(snippet),
            isOfficialWebsite: isOfficialWebsite(result.url, domain),
          };
        });
        return { query, ok: true, results, attempts: attempt };
      }

      lastError = getTavilyError(response, data, false);
    } catch (err) {
      lastError = getTavilyError(null, null, timedOut || err.name === "AbortError");
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (attempt < MAX_TAVILY_ATTEMPTS) await wait(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
  }

  return { query, ok: false, results: [], error: { ...lastError, attempts: MAX_TAVILY_ATTEMPTS } };
}

function buildQueries({ domain, productName }) {
  const queries = [];
  if (domain) {
    queries.push(
      { key: "generalReviews", text: `${domain} reviews` },
      { key: "complaints", text: `${domain} complaints` },
      { key: "customerReviews", text: `${domain} customer reviews` },
      { key: "scam", text: `${domain} scam` },
      { key: "fraud", text: `${domain} fraud` },
      { key: "legit", text: `${domain} legit` },
      { key: "trustpilot", text: `${domain} site:trustpilot.com` },
      { key: "reddit", text: `${domain} site:reddit.com` },
      { key: "officialWebsite", text: `${domain} official website` },
      { key: "scamAdviser", text: `${domain} ScamAdviser scam reports` }
    );
  }
  if (productName) {
    queries.push(
      { key: "productReviews", text: `${productName} reviews` },
      { key: "productRating", text: `${productName} rating` },
      { key: "productFake", text: `${productName} fake` },
      { key: "productGenuine", text: `${productName} genuine` },
      { key: "productWorthBuying", text: `${productName} worth buying` }
    );
  }
  return queries;
}

// Very lightweight, transparent keyword tagging - NOT sentiment analysis.
// This only flags snippets that explicitly contain a scam/fraud-report
// keyword so the prompt can see them called out, without pretending to
// classify overall sentiment (that's left to the model, which can actually
// read the text).
const SCAM_REPORT_KEYWORDS = [
  "scam", "fraud", "fake", "did not receive", "never arrived", "stole", "ripped off",
  "counterfeit", "chargeback", "refund refused", "never shipped", "seller disappeared",
  "phishing", "identity theft", "bait and switch", "impersonation", "fake tracking",
  "payment dispute", "account suspended", "warning",
];
const POSITIVE_TRUST_KEYWORDS = [
  "verified", "official", "trusted", "excellent", "authentic", "buyer protection",
  "fast delivery", "good support", "recommended",
];

function flagKeywordMentions(allResults, keywords) {
  return allResults.filter((result) => {
    const evidence = `${result.title || ""} ${result.snippet || ""}`.toLowerCase();
    return keywords.some((keyword) => evidence.includes(keyword));
  });
}

function removeDuplicateResults(results) {
  const seenUrls = new Set();
  const seenTitles = new Set();

  return results.filter((result) => {
    const url = normalizeUrl(result.url);
    const title = normalizeTitle(result.title);
    if ((url && seenUrls.has(url)) || (title && seenTitles.has(title))) return false;
    if (url) seenUrls.add(url);
    if (title) seenTitles.add(title);
    return true;
  });
}

// Runs all relevant queries concurrently and returns a structured object
// grouped by source, plus a small flagged-mentions list - never a single
// text blob. Returns { available: false, reason } if no API key is set or
// there's nothing to search for.
export async function fetchReputationContext({ domain, productName }) {
  if (!env.webSearchApiKey) {
    return { available: false, reason: "No web search API key is configured.", bySource: {}, possibleScamReportMentions: [], positiveMentions: [], errors: [] };
  }

  const queries = buildQueries({ domain, productName });
  if (queries.length === 0) {
    return { available: false, reason: "No domain or product name to search for.", bySource: {}, possibleScamReportMentions: [], positiveMentions: [], errors: [] };
  }

  const outcomes = await Promise.all(queries.map((q) => runTavilyQuery(q.text, domain)));

  const bySource = {};
  const allResults = [];
  const seenUrls = new Set();
  const seenTitles = new Set();
  queries.forEach((q, i) => {
    const outcome = outcomes[i];
    const uniqueResults = removeDuplicateResults(outcome.results).filter((result) => {
      const url = normalizeUrl(result.url);
      const title = normalizeTitle(result.title);
      if ((url && seenUrls.has(url)) || (title && seenTitles.has(title))) return false;
      if (url) seenUrls.add(url);
      if (title) seenTitles.add(title);
      return true;
    });
    bySource[q.key] = { query: q.text, ok: outcome.ok, results: uniqueResults, ...(outcome.error ? { error: outcome.error } : {}) };
    allResults.push(...uniqueResults);
  });

  const anySucceeded = outcomes.some((o) => o.ok && o.results.length > 0);

  return {
    available: anySucceeded,
    reason: anySucceeded ? null : "Searches ran but returned no usable results.",
    bySource,
    possibleScamReportMentions: flagKeywordMentions(allResults, SCAM_REPORT_KEYWORDS),
    positiveMentions: flagKeywordMentions(allResults, POSITIVE_TRUST_KEYWORDS),
    errors: outcomes.filter((outcome) => outcome.error).map((outcome) => ({ query: outcome.query, ...outcome.error })),
  };
}
