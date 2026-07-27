// Real, evidence-driven website inspection.
//
// Every field here is either a directly observed fact, or null with an
// honest reason when it genuinely couldn't be determined - never a guess.

import * as cheerio from "cheerio";
import net from "node:net";
import { URL } from "node:url";

const FETCH_TIMEOUT_MS = 25_000; // 20-30s window per fetch attempt
const MAX_FETCH_ATTEMPTS = 3; // try 1 -> try 2 -> try 3, then give up honestly
const RETRY_DELAY_MS = 600;
const MAX_HTML_BYTES = 2_000_000; // 2MB cap

// A modern desktop Chrome UA.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const BROWSER_HEADERS = {
  "User-Agent": BROWSER_USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

const SECURITY_HEADER_KEYS = {
  strictTransportSecurity: "strict-transport-security",
  contentSecurityPolicy: "content-security-policy",
  xFrameOptions: "x-frame-options",
  xContentTypeOptions: "x-content-type-options",
  referrerPolicy: "referrer-policy",
};

// Known 3rd-party review platform script markers
const REVIEW_WIDGET_MARKERS = [
  { name: "Judge.me", pattern: /(cdn\.judge\.me|judgeme)/i },
  { name: "Yotpo", pattern: /(staticw2\.yotpo\.com|yotpo)/i },
  { name: "Loox", pattern: /(loox\.io|loox)/i },
  { name: "Stamped.io", pattern: /(stamped\.io|stamped)/i },
  { name: "Okendo", pattern: /(okendo\.io|okendo)/i },
  { name: "Junip", pattern: /(junip\.co|junip)/i },
  { name: "Trustpilot", pattern: /(widget\.trustpilot\.com|trustpilot)/i },
  { name: "Shopify Reviews", pattern: /(productreviews\.shopifycdn\.com|spr-badge)/i },
];

export function normalizeUrl(rawUrl) {
  const trimmed = String(rawUrl || "").trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function extractDomain(rawUrl) {
  try {
    return new URL(normalizeUrl(rawUrl)).hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Retrieval-status classification
// ---------------------------------------------------------------------------

const CLOUDFLARE_CHALLENGE_MARKERS = [
  "checking your browser before accessing",
  "cf-browser-verification",
  "cf_chl_opt",
  "just a moment...",
  "attention required! | cloudflare",
];

const JS_REQUIRED_MARKERS = [
  "you need to enable javascript to run this app",
  "please enable javascript",
  "noscript>this app requires javascript",
];

function classifyFromResponse(response, html) {
  const status = response.status;
  const server = (response.headers.get("server") || "").toLowerCase();
  const lowerHtml = (html || "").toLowerCase();

  const looksLikeCloudflareChallenge =
    (status === 503 || status === 403) &&
    (server.includes("cloudflare") || CLOUDFLARE_CHALLENGE_MARKERS.some((m) => lowerHtml.includes(m)));
  if (looksLikeCloudflareChallenge) return "cloudflare_challenge";

  if (status === 403 || status === 401 || status === 429) return "blocked";

  const looksJsOnly =
    JS_REQUIRED_MARKERS.some((m) => lowerHtml.includes(m)) ||
    (html && html.length < 2000 && /<div\s+id=["'](root|app|__next)["']><\/div>/i.test(html));
  if (looksJsOnly) return "js_required";

  return "successfully_retrieved";
}

function classifyFromError(err) {
  if (err.name === "AbortError") return "timed_out";
  const code = err.cause?.code || err.code;
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "dns_error";
  if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "CERT_HAS_EXPIRED") return "blocked";
  return "unknown_error";
}

async function fetchWithRetry(requestedUrl) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const startedAt = Date.now();

    try {
      const response = await fetch(requestedUrl, {
        redirect: "follow",
        signal: controller.signal,
        headers: BROWSER_HEADERS,
      });
      clearTimeout(timeoutHandle);
      const responseTimeMs = Date.now() - startedAt;

      const contentType = response.headers.get("content-type") || "";
      let html = "";
      let htmlTruncated = false;

      if (contentType.includes("text/html") || contentType.includes("application/xhtml+xml") || contentType.includes("xml")) {
        const buffer = await response.arrayBuffer();
        htmlTruncated = buffer.byteLength > MAX_HTML_BYTES;
        const slice = htmlTruncated ? buffer.slice(0, MAX_HTML_BYTES) : buffer;
        html = Buffer.from(slice).toString("utf8");
      }

      const classifiedStatus = classifyFromResponse(response, html);
      const retrievalStatus =
        classifiedStatus !== "successfully_retrieved"
          ? classifiedStatus
          : response.ok
            ? "successfully_retrieved"
            : response.status === 429
              ? "rate_limited"
              : "http_error";

      if (retrievalStatus !== "successfully_retrieved" && attempt < MAX_FETCH_ATTEMPTS) {
        lastError = { retrievalStatus };
        await sleep(RETRY_DELAY_MS * 2 ** (attempt - 1));
        continue;
      }

      return {
        ok: retrievalStatus === "successfully_retrieved",
        retrievalStatus,
        response,
        html,
        htmlTruncated,
        responseTimeMs,
        attemptsMade: attempt,
      };
    } catch (err) {
      clearTimeout(timeoutHandle);
      lastError = err;
      if (attempt < MAX_FETCH_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * 2 ** (attempt - 1));
        continue;
      }
    }
  }

  return {
    ok: false,
    retrievalStatus: lastError?.retrievalStatus || classifyFromError(lastError || new Error("unknown")),
    response: null,
    html: "",
    htmlTruncated: false,
    responseTimeMs: null,
    attemptsMade: MAX_FETCH_ATTEMPTS,
    fetchError:
      lastError instanceof Error
        ? lastError.message
        : "The site did not return a successful, challenge-free response after multiple attempts.",
  };
}

function detectSecurityHeaders(headers) {
  if (!headers) return null;
  const result = {};
  for (const [key, headerName] of Object.entries(SECURITY_HEADER_KEYS)) {
    result[key] = headers.has(headerName);
  }
  return result;
}

function calculateSecurityScore(security, hasMixedContent, policiesPresent = {}) {
  let score = 30; // base floor
  if (security?.httpsEnabled) score += 30;
  if (security?.securityHeaders?.strictTransportSecurity) score += 10;
  if (security?.securityHeaders?.contentSecurityPolicy) score += 10;
  if (security?.securityHeaders?.xFrameOptions) score += 5;
  if (security?.securityHeaders?.xContentTypeOptions) score += 5;
  if (security?.securityHeaders?.referrerPolicy) score += 5;
  if (policiesPresent.privacyPolicy) score += 5;

  if (hasMixedContent) score -= 20;

  return Math.min(Math.max(score, 0), 100);
}

function detectMixedContent(html, pageIsHttps) {
  if (!pageIsHttps || !html) return false;
  return /(?:src|href)=["']http:\/\/(?!localhost)[^"']+["']/i.test(html);
}

// ---------------------------------------------------------------------------
// Embedded JS / State Extraction (Daraz, Next.js, Nuxt, Shopify, etc.)
// ---------------------------------------------------------------------------

function extractEmbeddedStateData(html, $) {
  if (!html) return [];
  const stateObjects = [];

  const scriptContents = [];
  if ($) {
    $("script").each((_, el) => {
      const txt = $(el).html();
      if (txt) scriptContents.push(txt);
    });
  } else {
    const matches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    for (const m of matches) {
      if (m[1]) scriptContents.push(m[1]);
    }
  }

  const patterns = [
    /window\.__moduleData__\s*=\s*(\{[\s\S]*?\});?/i,
    /window\.__INIT_DATA__\s*=\s*(\{[\s\S]*?\});?/i,
    /window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]*?\});?/i,
    /window\.__NUXT__\s*=\s*(\{[\s\S]*?\});?/i,
  ];

  for (const scriptText of scriptContents) {
    for (const pattern of patterns) {
      const match = scriptText.match(pattern);
      if (match && match[1]) {
        try {
          stateObjects.push(JSON.parse(match[1]));
        } catch {
          // Skip unparseable JSON matches
        }
      }
    }
  }

  if ($) {
    const nextData = $("#__NEXT_DATA__").html();
    if (nextData) {
      try {
        stateObjects.push(JSON.parse(nextData));
      } catch {}
    }
  }

  return stateObjects;
}

function deepSearchKey(obj, targetKeys, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 8) return null;
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (targetKeys.includes(lowerKey)) {
      const val = obj[key];
      if (val !== null && val !== undefined) return val;
    }
    if (typeof obj[key] === "object") {
      const found = deepSearchKey(obj[key], targetKeys, depth + 1);
      if (found !== null) return found;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Structured data: JSON-LD, Open Graph, Schema.org
// ---------------------------------------------------------------------------

function extractJsonLdBlocks(html, $) {
  if (!html) return [];
  const blocks = [];
  const scriptContents = [];

  if ($) {
    $("script[type*='application/ld+json']").each((_, el) => {
      const content = $(el).html();
      if (content) scriptContents.push(content.trim());
    });
  }

  if (scriptContents.length === 0) {
    const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      const raw = match[1].trim();
      if (raw) scriptContents.push(raw);
    }
  }

  for (const raw of scriptContents) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else if (Array.isArray(parsed["@graph"])) blocks.push(...parsed["@graph"]);
      else blocks.push(parsed);
    } catch {
      // Skip malformed JSON-LD
    }
  }

  return blocks;
}

function typeMatches(entity, typeName) {
  const t = entity?.["@type"];
  if (!t) return false;
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) => String(x).toLowerCase() === typeName.toLowerCase());
}

function findJsonLdEntity(blocks, typeName) {
  const entities = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeMatches(value, typeName)) entities.push(value);
    Object.values(value).forEach(visit);
  };
  blocks.forEach(visit);
  return entities[0] || null;
}

function extractMetaTags(html, $) {
  if (!html) return {};
  const tags = {};
  const add = (key, value) => {
    if (key && value && !tags[key.toLowerCase()]) tags[key.toLowerCase()] = value.trim();
  };

  if ($) {
    $("meta[name], meta[property], meta[itemprop]").each((_, el) => {
      const $el = $(el);
      add($el.attr("name") || $el.attr("property") || $el.attr("itemprop"), $el.attr("content"));
    });
    return tags;
  }

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const key = tag.match(/(?:name|property|itemprop)=["']([^"']+)["']/i)?.[1];
    const value = tag.match(/content=["']([^"']*)["']/i)?.[1];
    add(key, value);
  }
  return tags;
}

function extractOpenGraphTags(html, $) {
  if (!html) return {};
  const og = {};

  if ($) {
    $("meta[property^='og:'], meta[name^='og:'], meta[property^='product:'], meta[name^='product:']").each((_, el) => {
      const $el = $(el);
      const key = ($el.attr("property") || $el.attr("name") || "").trim();
      const content = $el.attr("content")?.trim();
      if (key && content) og[key] = content;
    });
    return og;
  }

  const metaRegex = /<meta[^>]+(?:property|name)=["'](og:[^"']+|product:[^"']+)["'][^>]*>/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const tag = match[0];
    const key = match[1];
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);
    if (contentMatch) og[key] = contentMatch[1];
  }
  return og;
}

function extractHtmlProductEvidence($, html) {
  if (!$ && !html) return null;
  const valueFrom = (selector) => {
    if (!$) return null;
    const $element = $(selector).first();
    return $element.attr("content") || $element.attr("value") || $element.attr("data-price") || $element.text().trim() || null;
  };
  const hasProductMarkup = $ && $("[itemtype*='schema.org/Product'], [itemtype*='schema.org/product'], [itemprop='price'], .product, [data-product-id]").length > 0;
  if (!hasProductMarkup) return null;

  return {
    name: valueFrom("[itemprop='name']"),
    brand: valueFrom("[itemprop='brand']"),
    price: valueFrom("[itemprop='price']"),
    currency: valueFrom("[itemprop='priceCurrency']"),
    availability: valueFrom("[itemprop='availability']"),
    sku: valueFrom("[itemprop='sku']"),
    rating: valueFrom("[itemprop='ratingValue']"),
    reviewCount: valueFrom("[itemprop='reviewCount'], [itemprop='ratingCount']"),
  };
}

function buildProductInfo(jsonLdBlocks, og, meta, $, html, stateObjects = []) {
  const product = findJsonLdEntity(jsonLdBlocks, "Product");
  const offer = product?.offers
    ? Array.isArray(product.offers)
      ? product.offers[0]
      : product.offers
    : null;
  const aggregateRating = product?.aggregateRating;

  const htmlProduct = extractHtmlProductEvidence($, html);

  let statePrice = null;
  let stateCurrency = null;
  let stateRating = null;
  let stateReviewCount = null;

  for (const stateObj of stateObjects) {
    if (!statePrice) statePrice = deepSearchKey(stateObj, ["saleprice", "itemprice", "price", "amount", "pdpoptionprice"]);
    if (!stateCurrency) stateCurrency = deepSearchKey(stateObj, ["currency", "currencycode", "sitecurrency"]);
    if (!stateRating) stateRating = deepSearchKey(stateObj, ["score", "averagerating", "rating", "ratingscore"]);
    if (!stateReviewCount) stateReviewCount = deepSearchKey(stateObj, ["reviewcount", "totalreview", "ratingscount", "reviewnumber"]);
  }

  const name = product?.name ?? og["og:title"] ?? meta["product:name"] ?? htmlProduct?.name ?? null;
  const price = offer?.price ?? og["product:price:amount"] ?? meta["product:price:amount"] ?? meta.price ?? htmlProduct?.price ?? statePrice ?? null;
  const currency = offer?.priceCurrency ?? og["product:price:currency"] ?? meta["product:price:currency"] ?? meta.currency ?? htmlProduct?.currency ?? stateCurrency ?? null;
  const availability = offer?.availability
    ? String(offer.availability).replace(/^https?:\/\/schema\.org\//i, "")
    : og["product:availability"] ?? meta["product:availability"] ?? htmlProduct?.availability ?? null;

  const hasAnyEvidence = Boolean(product || price || og["product:price:amount"] || meta["product:price:amount"] || htmlProduct || statePrice);
  if (!hasAnyEvidence) return null;

  return {
    name,
    brand: product?.brand?.name ?? product?.brand ?? htmlProduct?.brand ?? null,
    price,
    currency,
    availability,
    sku: product?.sku ?? htmlProduct?.sku ?? null,
    manufacturer: product?.manufacturer?.name ?? product?.manufacturer ?? null,
    rating: aggregateRating?.ratingValue ?? htmlProduct?.rating ?? stateRating ?? null,
    reviewCount: aggregateRating?.reviewCount ?? aggregateRating?.ratingCount ?? htmlProduct?.reviewCount ?? stateReviewCount ?? null,
    image: product?.image ?? og["og:image"] ?? null,
    sourceOfTruth: product
      ? "json-ld"
      : og["product:price:amount"] || og["og:title"]
      ? "open-graph"
      : htmlProduct
      ? "html-microdata"
      : statePrice
      ? "embedded-state-json"
      : "meta-tags",
  };
}

function extractSchemaOrgBusiness(jsonLdBlocks) {
  const org = findJsonLdEntity(jsonLdBlocks, "Organization") || findJsonLdEntity(jsonLdBlocks, "LocalBusiness");
  const website = findJsonLdEntity(jsonLdBlocks, "WebSite");
  if (!org && !website) return null;

  const address = org?.address;
  const formattedAddress =
    typeof address === "string"
      ? address
      : address
      ? [address.streetAddress, address.addressLocality, address.addressRegion, address.postalCode, address.addressCountry]
          .filter(Boolean)
          .join(", ")
      : null;

  return {
    name: org?.name ?? website?.name ?? null,
    address: formattedAddress,
    email: org?.email ?? null,
    phone: org?.telephone ?? null,
    sameAs: Array.isArray(org?.sameAs) ? org.sameAs : org?.sameAs ? [org.sameAs] : [],
    sourceOfTruth: org ? "json-ld" : "schema.org-website",
  };
}

// ---------------------------------------------------------------------------
// Contact detail extraction
// ---------------------------------------------------------------------------

const PLACEHOLDER_EMAIL_PATTERNS = [
  /^you@/i,
  /^example@/i,
  /^name@/i,
  /^your ?name@/i,
  /^email@/i,
  /@example\.(com|org|net)$/i,
  /@domain\.(com|org|net)$/i,
  /^test@/i,
];

function isPlaceholderEmail(email) {
  return PLACEHOLDER_EMAIL_PATTERNS.some((p) => p.test(email));
}

function extractEmbeddedContactDetails(stateObjects) {
  const emails = [];
  const phones = [];

  for (const obj of stateObjects) {
    const foundEmail = deepSearchKey(obj, ["supportemail", "contactemail", "email", "customeremail"]);
    if (typeof foundEmail === "string" && foundEmail.includes("@") && !isPlaceholderEmail(foundEmail)) {
      emails.push(foundEmail.trim());
    }
    const foundPhone = deepSearchKey(obj, ["supportphone", "contactphone", "phone", "hotline", "customerphone"]);
    if (typeof foundPhone === "string" || typeof foundPhone === "number") {
      phones.push(String(foundPhone).trim());
    }
  }

  return { emails, phones };
}

function extractContactDetails(html, $, stateObjects = []) {
  if (!html) return { emails: [], phones: [], whatsapp: [], facebook: [], instagram: [], linkedin: [], youtube: [], twitter: [] };

  const hrefs = [];
  if ($) {
    $("a[href]").each((_, el) => {
      const href = ($(el).attr("href") || "").trim();
      if (href) hrefs.push(href);
    });
  } else {
    hrefs.push(...[...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]));
  }

  const embeddedContacts = extractEmbeddedContactDetails(stateObjects);

  const emails = [
    ...new Set([
      ...embeddedContacts.emails,
      ...hrefs
        .filter((h) => h.toLowerCase().startsWith("mailto:"))
        .map((h) => h.replace(/^mailto:/i, "").split("?")[0].trim())
        .filter((email) => email && !isPlaceholderEmail(email)),
    ]),
  ];

  const phones = [
    ...new Set([
      ...embeddedContacts.phones,
      ...hrefs
        .filter((h) => h.toLowerCase().startsWith("tel:"))
        .map((h) => h.replace(/^tel:/i, "").trim())
        .filter(Boolean),
    ]),
  ];

  const matchDomain = (domainFragment) =>
    [...new Set(hrefs.filter((h) => h.toLowerCase().includes(domainFragment)))];

  return {
    emails,
    phones,
    whatsapp: matchDomain("wa.me").concat(matchDomain("api.whatsapp.com")),
    facebook: matchDomain("facebook.com").filter((h) => !h.includes("sharer") && !h.includes("share.php")),
    instagram: matchDomain("instagram.com"),
    linkedin: matchDomain("linkedin.com"),
    youtube: matchDomain("youtube.com").concat(matchDomain("youtu.be")),
    twitter: matchDomain("twitter.com").concat(matchDomain("x.com")),
  };
}

function extractFooterBusiness($) {
  if (!$) return null;
  const footerText = $("footer").first().text().replace(/\s+/g, " ").trim();
  if (!footerText) return null;
  const name = footerText.match(/(?:©|copyright)\s*(?:\d{4}(?:\s*[-–]\s*\d{4})?\s*)?([^|•]{2,100})/i)?.[1]?.trim() || null;
  return { name, address: null, email: null, phone: null, sameAs: [], sourceOfTruth: "footer" };
}

function findContactPageUrl($, origin) {
  if (!$) return null;
  let href = null;
  $("footer a[href], nav a[href], header a[href], a[href]").each((_, el) => {
    if (href) return;
    const $el = $(el);
    const value = $el.attr("href");
    const label = `${value || ""} ${$el.text() || ""}`.toLowerCase();
    if (!value || !POLICY_PAGE_KEYWORDS.contactPage.some((keyword) => label.includes(keyword))) return;
    try {
      const resolved = new URL(value, origin);
      if (resolved.origin === origin) href = resolved.href;
    } catch {
      // Ignore invalid URL
    }
  });
  return href;
}

function combineContactDetails(...details) {
  const keys = ["emails", "phones", "whatsapp", "facebook", "instagram", "linkedin", "youtube", "twitter"];
  const combined = Object.fromEntries(keys.map((key) => [key, [...new Set(details.flatMap((detail) => detail?.[key] || []))]]));
  return combined;
}

// ---------------------------------------------------------------------------
// Policy page detection
// ---------------------------------------------------------------------------

const POLICY_PAGE_KEYWORDS = {
  privacyPolicy: ["privacy-policy", "privacy_policy", "privacy policy", "/privacy"],
  termsOfService: ["terms-of-service", "terms-and-conditions", "terms of service", "/terms", "terms of use"],
  aboutPage: ["about-us", "about_us", "about us", "/about", "our-story", "who-we-are"],
  contactPage: ["contact-us", "contact_us", "contact us", "/contact", "get-in-touch"],
  refundPolicy: [
    "refund-policy",
    "return-policy",
    "refund_policy",
    "return_policy",
    "refund policy",
    "return policy",
    "/refund",
    "/returns",
  ],
};

function scanPageStructureForPolicyLinks($) {
  const candidates = [];
  const bodyText = $("body").text().trim().toLowerCase();

  $("footer a[href], nav a[href], header a[href], a[href]").each((_, el) => {
    const $el = $(el);
    candidates.push({
      href: ($el.attr("href") || "").toLowerCase(),
      text: $el.text().trim().toLowerCase(),
    });
  });

  $("button, [role='button']").each((_, el) => {
    candidates.push({ href: "", text: $(el).text().trim().toLowerCase() });
  });

  const result = {};
  for (const [category, keywords] of Object.entries(POLICY_PAGE_KEYWORDS)) {
    result[category] = candidates.some((c) => keywords.some((kw) => c.href.includes(kw) || c.text.includes(kw))) ||
      keywords.some((kw) => bodyText.includes(kw));
  }
  return result;
}

const POLICY_PAGE_PROBE_PATHS = {
  privacyPolicy: ["/privacy", "/privacy-policy"],
  termsOfService: ["/terms", "/terms-of-service", "/tos"],
  aboutPage: ["/about", "/about-us"],
  contactPage: ["/contact", "/contact-us"],
  refundPolicy: ["/refund-policy", "/return-policy", "/returns"],
};

async function probePathExists(origin, paths) {
  let allProbesGotACleanResponse = true;

  for (const path of paths) {
    const result = await fetchWithRetry(`${origin}${path}`);
    if (!result.response) {
      allProbesGotACleanResponse = false;
      continue;
    }
    if (result.retrievalStatus !== "successfully_retrieved") {
      if (result.response.status !== 404) allProbesGotACleanResponse = false;
      continue;
    }
    if (result.response.status >= 200 && result.response.status < 400) return true;
  }

  return allProbesGotACleanResponse ? false : null;
}

async function findPoliciesInSitemap(origin) {
  const sitemap = await fetchWithRetry(`${origin}/sitemap.xml`);
  if (!sitemap.response || !sitemap.ok || !sitemap.html) return {};

  const urls = [...sitemap.html.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => match[1].toLowerCase());
  const result = {};
  for (const [category, keywords] of Object.entries(POLICY_PAGE_KEYWORDS)) {
    result[category] = urls.some((url) => keywords.some((keyword) => url.includes(keyword)));
  }
  return result;
}

async function detectPolicyPagesThorough($, html, origin, allowConfirmedMissing) {
  const fromScan = $ ? scanPageStructureForPolicyLinks($) : {};
  const fromSitemap = await findPoliciesInSitemap(origin);
  const categories = Object.keys(POLICY_PAGE_PROBE_PATHS);

  const probeResults = await Promise.all(
    categories.map(async (category) => {
      if (fromScan[category] || fromSitemap[category]) return [category, true];
      const probed = await probePathExists(origin, POLICY_PAGE_PROBE_PATHS[category]);
      return [category, probed === true ? true : probed === null || !allowConfirmedMissing ? null : false];
    })
  );

  return Object.fromEntries(probeResults);
}

function extractHeadings($) {
  if (!$) return [];
  return $("h1, h2, h3")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 30);
}

// ---------------------------------------------------------------------------
// On-site Review Extraction with Widget Detection
// ---------------------------------------------------------------------------

function detectReviewWidgets(html) {
  if (!html) return [];
  const detected = [];
  for (const widget of REVIEW_WIDGET_MARKERS) {
    if (widget.pattern.test(html)) {
      detected.push(widget.name);
    }
  }
  return detected;
}

function extractOnSiteReviews($, html, jsonLdBlocks = [], stateObjects = []) {
  const defaultResult = {
    verificationStatus: "Unable to verify",
    rating: null,
    totalReviews: null,
    sampleEvidence: [],
  };

  if (!$ && !html) return defaultResult;

  const reviewsFromJsonLd = [];
  const aggregateRatingFromJsonLd = findJsonLdEntity(jsonLdBlocks, "AggregateRating");

  const jsonLdReviewEntities = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeMatches(value, "Review")) jsonLdReviewEntities.push(value);
    Object.values(value).forEach(visit);
  };
  jsonLdBlocks.forEach(visit);

  jsonLdReviewEntities.forEach((r) => {
    reviewsFromJsonLd.push({
      author: r.author?.name || r.author || null,
      date: r.datePublished || null,
      title: r.name || r.headline || null,
      body: r.reviewBody || null,
      rating: r.reviewRating?.ratingValue || null,
    });
  });

  const reviewsFromMicrodata = [];
  if ($) {
    $("[itemtype*='schema.org/Review'], [itemprop='review']").each((_, el) => {
      const $el = $(el);
      reviewsFromMicrodata.push({
        author: $el.find("[itemprop='author']").text().trim() || null,
        date: $el.find("[itemprop='datePublished']").attr("content") || $el.find("[itemprop='datePublished']").text().trim() || null,
        title: $el.find("[itemprop='name'], [itemprop='headline']").text().trim() || null,
        body: $el.find("[itemprop='reviewBody']").text().trim() || null,
        rating: $el.find("[itemprop='reviewRating'] [itemprop='ratingValue']").attr("content") || $el.find("[itemprop='reviewRating']").text().trim() || null,
      });
    });
  }

  // Deep search rating and total reviews from embedded JS states
  let stateRating = null;
  let stateReviewCount = null;
  for (const stateObj of stateObjects) {
    if (!stateRating) stateRating = deepSearchKey(stateObj, ["score", "averagerating", "rating", "ratingscore"]);
    if (!stateReviewCount) stateReviewCount = deepSearchKey(stateObj, ["reviewcount", "totalreview", "ratingscount", "reviewnumber"]);
  }

  // Fallback meta tag inspection
  if ($ && !stateRating) {
    stateRating = $('meta[property="og:rating"]').attr('content') || $('meta[name="twitter:data1"]').attr('content') || null;
  }

  // Fallback pattern matching on raw HTML text for rating score / review count
  if (!stateRating && html) {
    const ratingMatch = html.match(/(?:rating|score)["']?\s*:\s*["']?([1-5]\.?\d?)/i) || html.match(/([1-5]\.\d)\s*(?:out of 5|stars|★)/i);
    if (ratingMatch) stateRating = ratingMatch[1];
  }

  if (!stateReviewCount && html) {
    const countMatch = html.match(/(\d+)\s*(?:customer reviews|reviews|ratings)/i);
    if (countMatch) stateReviewCount = countMatch[1];
  }

  const detectedWidgets = detectReviewWidgets(html);

  const allFoundReviews = [...reviewsFromJsonLd, ...reviewsFromMicrodata].filter(
    (r) => r.body || r.rating || r.author
  );

  const rating = aggregateRatingFromJsonLd?.ratingValue || allFoundReviews[0]?.rating || stateRating || null;
  const totalReviews = aggregateRatingFromJsonLd?.reviewCount || aggregateRatingFromJsonLd?.ratingCount || (allFoundReviews.length > 0 ? allFoundReviews.length : stateReviewCount);

  if (!rating && !totalReviews && allFoundReviews.length === 0) {
    if (detectedWidgets.length > 0) {
      return {
        verificationStatus: `Widget Detected (${detectedWidgets.join(", ")})`,
        rating: null,
        totalReviews: null,
        sampleEvidence: [],
      };
    }
    return {
      verificationStatus: "Not Found",
      rating: null,
      totalReviews: 0,
      sampleEvidence: [],
    };
  }

  return {
    verificationStatus: "Verified",
    rating: rating ? Number(rating) : null,
    totalReviews: totalReviews ? Number(totalReviews) : null,
    sampleEvidence: allFoundReviews.slice(0, 5),
  };
}

// ---------------------------------------------------------------------------
// Compact Page Summary for Token Saving
// ---------------------------------------------------------------------------

export function getCompactPageSummary(inspectionData) {
  if (!inspectionData) return "No inspection data available.";

  const { security, product, contact, policies, onSiteReviews } = inspectionData;

  return JSON.stringify({
    url: security?.finalUrl || security?.requestedUrl,
    pageTitle: security?.pageTitle,
    metaDescription: security?.metaDescription,
    httpsEnabled: security?.httpsEnabled,
    product: product?.name ? {
      name: product.name,
      price: product.price,
      currency: product.currency,
      availability: product.availability,
      rating: product.rating,
      reviewCount: product.reviewCount,
    } : "No explicit product markup",
    contactDetailsFound: {
      emails: contact?.emails || [],
      phones: contact?.phones || [],
      socialCount: Object.keys(contact?.social || {}).length,
    },
    policiesPresent: policies,
    onSiteReviewsStatus: onSiteReviews?.verificationStatus,
    headings: security?.headings?.slice(0, 10) || [],
  }, null, 2);
}

// ---------------------------------------------------------------------------
// Trust Signals & Main Inspector Entry Points
// ---------------------------------------------------------------------------

function buildPositiveTrustSignals({ security, contact, policies, onSiteReviews }) {
  const signals = [];
  if (security?.httpsEnabled) signals.push("Valid HTTPS secure connection detected");
  if (security?.securityHeaders?.strictTransportSecurity) signals.push("HSTS security header enabled");
  if (contact?.emails?.length || contact?.phones?.length || contact?.business?.name) signals.push("Contact and business identity published");
  if (policies?.privacyPolicy) signals.push("Privacy Policy present");
  if (policies?.termsOfService) signals.push("Terms of Service present");
  if (policies?.refundPolicy) signals.push("Refund / Return Policy present");
  if (onSiteReviews?.verificationStatus === "Verified" || onSiteReviews?.verificationStatus?.startsWith("Widget Detected")) {
    signals.push("Customer review section / integration detected on page");
  }

  return signals;
}

export async function inspectWebsite(rawUrl) {
  const requestedUrl = normalizeUrl(rawUrl);
  const fetchResult = await fetchWithRetry(requestedUrl);

  const baseSecurity = {
    requestedUrl,
    retrievalStatus: fetchResult.retrievalStatus,
    attemptsMade: fetchResult.attemptsMade,
  };

  const canAnalyzePage = fetchResult.ok || fetchResult.retrievalStatus === "js_required";

  if (!fetchResult.response || !canAnalyzePage) {
    const finalUrl = fetchResult.response?.url || null;
    const fallbackOnSiteReviews = { verificationStatus: "Unable to verify", rating: null, totalReviews: null, sampleEvidence: [] };
    const fallbackSecurity = {
      ...baseSecurity,
      finalUrl,
      httpStatus: fetchResult.response?.status || null,
      redirected: Boolean(finalUrl && finalUrl !== requestedUrl),
      redirectedToDifferentHost: false,
      httpsEnabled: (finalUrl || requestedUrl).startsWith("https://"),
      responseTimeMs: null,
      securityHeaders: null,
      securityScore: 30,
      positiveTrustSignals: [],
    };

    return {
      security: fallbackSecurity,
      policies: { privacyPolicy: null, termsOfService: null, aboutPage: null, contactPage: null, refundPolicy: null },
      product: null,
      contact: { business: null, emails: [], phones: [], whatsapp: [], facebook: [], instagram: [], linkedin: [], youtube: [], twitter: [] },
      onSiteReviews: fallbackOnSiteReviews,
      whois: null,
    };
  }

  const finalUrl = fetchResult.response.url;
  const parsedOrigin = new URL(finalUrl).origin;
  const pageIsHttps = finalUrl.startsWith("https://");

  const $ = fetchResult.html ? cheerio.load(fetchResult.html) : null;
  const html = fetchResult.html || "";

  const jsonLdBlocks = extractJsonLdBlocks(html, $);
  const metaTags = extractMetaTags(html, $);
  const openGraph = extractOpenGraphTags(html, $);
  const stateObjects = extractEmbeddedStateData(html, $);

  const securityHeaders = detectSecurityHeaders(fetchResult.response.headers);
  const hasMixedContent = detectMixedContent(html, pageIsHttps);

  const policies = await detectPolicyPagesThorough($, html, parsedOrigin, fetchResult.ok);
  const product = buildProductInfo(jsonLdBlocks, openGraph, metaTags, $, html, stateObjects);
  const contactDetails = extractContactDetails(html, $, stateObjects);

  const schemaBusiness = extractSchemaOrgBusiness(jsonLdBlocks);
  const footerBusiness = extractFooterBusiness($);
  const business = schemaBusiness || footerBusiness || null;

  const onSiteReviews = extractOnSiteReviews($, html, jsonLdBlocks, stateObjects);

  const security = {
    ...baseSecurity,
    finalUrl,
    httpStatus: fetchResult.response.status,
    redirected: finalUrl !== requestedUrl,
    redirectedToDifferentHost: extractDomain(finalUrl) !== extractDomain(requestedUrl),
    httpsEnabled: pageIsHttps,
    responseTimeMs: fetchResult.responseTimeMs,
    securityHeaders,
    hasMixedContent,
    pageTitle: $ ? $("title").first().text().trim() : null,
    metaDescription: metaTags["description"] || openGraph["og:description"] || null,
    headings: extractHeadings($),
    securityScore: calculateSecurityScore({ httpsEnabled: pageIsHttps, securityHeaders }, hasMixedContent, policies),
  };

  const positiveTrustSignals = buildPositiveTrustSignals({ security, contact: { ...contactDetails, business }, policies, onSiteReviews });
  security.positiveTrustSignals = positiveTrustSignals;

  return {
    security,
    policies,
    product,
    contact: { business, ...contactDetails },
    onSiteReviews,
    whois: null,
  };
}