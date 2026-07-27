import { test, describe, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { inspectWebsite, gatherWebsiteEvidence, normalizeUrl, extractDomain } from "../src/services/websiteInspector.js";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function htmlPage({ head = "", body = "" } = {}) {
  return `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;
}

const PRODUCT_JSON_LD = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Wireless Earbuds Pro",
  "brand": { "@type": "Brand", "name": "AudioMax" },
  "sku": "AM-EB-2024",
  "image": "https://example.com/earbuds.jpg",
  "offers": { "@type": "Offer", "price": "2499", "priceCurrency": "PKR", "availability": "https://schema.org/InStock" },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.3", "reviewCount": "812" }
}
</script>`;

const ORG_JSON_LD = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AudioMax Pakistan",
  "email": "support@audiomax.pk",
  "telephone": "+92-300-1234567",
  "address": { "streetAddress": "Plot 12, Block B", "addressLocality": "Karachi", "addressCountry": "PK" },
  "sameAs": ["https://facebook.com/audiomaxpk"]
}
</script>`;

const MALFORMED_JSON_LD = `<script type="application/ld+json">{ this is not valid json, }</script>`;

function fakeHeaders(map = {}) {
  const lower = Object.fromEntries(Object.entries(map).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    get: (name) => lower[name.toLowerCase()] ?? null,
    has: (name) => name.toLowerCase() in lower,
  };
}

function fakeResponse({ status = 200, url = "https://example.com/", headers = {}, body = "" } = {}) {
  return {
    status,
    url,
    headers: fakeHeaders({ "content-type": "text/html; charset=utf-8", ...headers }),
    arrayBuffer: async () => Buffer.from(body, "utf8"),
  };
}

describe("normalizeUrl / extractDomain", () => {
  test("adds https:// when missing", () => {
    assert.equal(normalizeUrl("example.com"), "https://example.com");
  });

  test("leaves an explicit scheme alone", () => {
    assert.equal(normalizeUrl("http://example.com"), "http://example.com");
  });

  test("strips www. from the domain", () => {
    assert.equal(extractDomain("https://www.example.com/page"), "example.com");
  });

  test("returns null for an unparsable url", () => {
    assert.equal(extractDomain("::::not a url::::"), null);
  });
});

describe("inspectWebsite - retrieval status classification", () => {
  let originalFetch;
  beforeEach(() => {
    originalFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    mock.restoreAll();
  });

  test("reachable, HTML site classifies as successfully_retrieved", async () => {
    global.fetch = mock.fn(async (url) => {
      if (String(url).includes("example.com") && !String(url).match(/\/(privacy|terms|about|contact|refund|returns|tos)/)) {
        return fakeResponse({ body: htmlPage({ head: "<title>Example</title>" }) });
      }
      return fakeResponse({ status: 404, body: "not found" });
    });

    const result = await inspectWebsite("example.com");
    assert.equal(result.security.retrievalStatus, "successfully_retrieved");
    assert.equal(result.security.httpStatus, 200);
    assert.equal(result.security.pageTitle, "Example");
  });

  test("every attempt failing to connect classifies as unknown_error/dns_error, not a crash", async () => {
    global.fetch = mock.fn(async () => {
      const err = new Error("getaddrinfo ENOTFOUND doesnotexist.invalid");
      err.cause = { code: "ENOTFOUND" };
      throw err;
    });

    const result = await inspectWebsite("doesnotexist.invalid");
    assert.equal(result.security.retrievalStatus, "dns_error");
    assert.equal(result.security.httpStatus, null);
    assert.equal(result.policies, null);
    assert.equal(result.product, null);
  });

  test("AbortError classifies as timed_out", async () => {
    global.fetch = mock.fn(async () => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    });

    const result = await inspectWebsite("slow-site.com");
    assert.equal(result.security.retrievalStatus, "timed_out");
  });

  test("Cloudflare challenge page classifies as cloudflare_challenge, not reachable:false", async () => {
    global.fetch = mock.fn(async () =>
      fakeResponse({
        status: 503,
        headers: { server: "cloudflare" },
        body: "<html><body>Checking your browser before accessing the site...</body></html>",
      })
    );

    const result = await inspectWebsite("protected-site.com");
    assert.equal(result.security.retrievalStatus, "cloudflare_challenge");
  });

  test("JS-only shell app classifies as js_required", async () => {
    global.fetch = mock.fn(async () =>
      fakeResponse({ body: `<html><body><div id="root"></div></body></html>` })
    );

    const result = await inspectWebsite("spa-site.com");
    assert.equal(result.security.retrievalStatus, "js_required");
  });

  test("403 without Cloudflare markers classifies as blocked", async () => {
    global.fetch = mock.fn(async () => fakeResponse({ status: 403, body: "Forbidden" }));

    const result = await inspectWebsite("blocked-site.com");
    assert.equal(result.security.retrievalStatus, "blocked");
  });

  test("redirect to a different host is detected", async () => {
    global.fetch = mock.fn(async () =>
      fakeResponse({ url: "https://different-host.com/", body: htmlPage() })
    );

    const result = await inspectWebsite("https://example.com");
    assert.equal(result.security.redirected, true);
    assert.equal(result.security.redirectedToDifferentHost, true);
  });
});

describe("retry logic", () => {
  let originalFetch;
  beforeEach(() => {
    originalFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    mock.restoreAll();
  });

  test("first attempt fails, second succeeds -> reports success with attemptsMade: 2", async () => {
    let calls = 0;
    global.fetch = mock.fn(async (url) => {
      calls += 1;
      if (calls === 1) {
        const err = new Error("socket hang up");
        err.code = "ECONNRESET";
        throw err;
      }
      if (String(url).includes("example.com") && !String(url).match(/\/(privacy|terms|about|contact|refund|returns|tos)/)) {
        return fakeResponse({ body: htmlPage({ head: "<title>Recovered</title>" }) });
      }
      return fakeResponse({ status: 404, body: "not found" });
    });

    const result = await inspectWebsite("example.com");
    assert.equal(result.security.retrievalStatus, "successfully_retrieved");
    assert.equal(result.security.attemptsMade, 2);
  });

  test("all attempts fail -> honest failure after MAX_FETCH_ATTEMPTS, never throws", async () => {
    global.fetch = mock.fn(async () => {
      throw new Error("connection refused");
    });

    const result = await inspectWebsite("down-site.com");
    assert.equal(result.security.retrievalStatus, "unknown_error");
    assert.equal(result.security.attemptsMade, 3);
  });
});

describe("product extraction (JSON-LD + Open Graph)", () => {
  let originalFetch;
  beforeEach(() => {
    originalFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    mock.restoreAll();
  });

  test("extracts price, currency, rating, review count, brand, sku, image from JSON-LD", async () => {
    global.fetch = mock.fn(async (url) => {
      if (String(url).match(/\/(privacy|terms|about|contact|refund|returns|tos)/)) {
        return fakeResponse({ status: 404, body: "not found" });
      }
      return fakeResponse({ body: htmlPage({ head: PRODUCT_JSON_LD }) });
    });

    const result = await inspectWebsite("shop.example.com/earbuds");
    assert.ok(result.product);
    assert.equal(result.product.name, "Wireless Earbuds Pro");
    assert.equal(result.product.brand, "AudioMax");
    assert.equal(result.product.price, "2499");
    assert.equal(result.product.currency, "PKR");
    assert.equal(result.product.availability, "InStock");
    assert.equal(result.product.rating, "4.3");
    assert.equal(result.product.reviewCount, "812");
    assert.equal(result.product.sku, "AM-EB-2024");
    assert.equal(result.product.sourceOfTruth, "json-ld");
  });

  test("falls back to Open Graph product tags when there is no JSON-LD", async () => {
    const og = `
      <meta property="og:title" content="Budget Phone Case" />
      <meta property="product:price:amount" content="899" />
      <meta property="product:price:currency" content="PKR" />
      <meta property="product:availability" content="in stock" />
    `;
    global.fetch = mock.fn(async (url) => {
      if (String(url).match(/\/(privacy|terms|about|contact|refund|returns|tos)/)) {
        return fakeResponse({ status: 404, body: "not found" });
      }
      return fakeResponse({ body: htmlPage({ head: og }) });
    });

    const result = await inspectWebsite("shop.example.com/case");
    assert.ok(result.product);
    assert.equal(result.product.name, "Budget Phone Case");
    assert.equal(result.product.price, "899");
    assert.equal(result.product.sourceOfTruth, "open-graph");
  });

  test("returns null (not a guess) when the page has no product markup at all", async () => {
    global.fetch = mock.fn(async (url) => {
      if (String(url).match(/\/(privacy|terms|about|contact|refund|returns|tos)/)) {
        return fakeResponse({ status: 404, body: "not found" });
      }
      return fakeResponse({ body: htmlPage({ head: "<title>Just a blog</title>" }) });
    });

    const result = await inspectWebsite("blog.example.com");
    assert.equal(result.product, null);
  });

  test("malformed JSON-LD is skipped, not thrown", async () => {
    global.fetch = mock.fn(async (url) => {
      if (String(url).match(/\/(privacy|terms|about|contact|refund|returns|tos)/)) {
        return fakeResponse({ status: 404, body: "not found" });
      }
      return fakeResponse({ body: htmlPage({ head: MALFORMED_JSON_LD + "<title>Still loads</title>" }) });
    });

    const result = await inspectWebsite("broken-ld.example.com");
    assert.equal(result.security.pageTitle, "Still loads");
    assert.equal(result.product, null);
  });
});

describe("contact extraction", () => {
  let originalFetch;
  beforeEach(() => {
    originalFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    mock.restoreAll();
  });

  test("extracts email, phone, WhatsApp, Facebook, Instagram links", async () => {
    const body = `
      <footer>
        <a href="mailto:hello@shopnow.pk">Email us</a>
        <a href="tel:+923001234567">Call us</a>
        <a href="https://wa.me/923001234567">WhatsApp</a>
        <a href="https://facebook.com/shopnowpk">Facebook</a>
        <a href="https://instagram.com/shopnowpk">Instagram</a>
      </footer>
    `;
    global.fetch = mock.fn(async (url) => {
      if (String(url).match(/\/(privacy|terms|about|contact|refund|returns|tos)/)) {
        return fakeResponse({ status: 404, body: "not found" });
      }
      return fakeResponse({ body: htmlPage({ body }) });
    });

    const result = await inspectWebsite("shopnow.pk");
    assert.ok(result.contact);
    assert.deepEqual(result.contact.emails, ["hello@shopnow.pk"]);
    assert.deepEqual(result.contact.phones, ["+923001234567"]);
    assert.equal(result.contact.whatsapp.length, 1);
    assert.equal(result.contact.social.facebook.length, 1);
    assert.equal(result.contact.social.instagram.length, 1);
  });

  test("filters out placeholder emails like you@domain.com", async () => {
    const body = `<a href="mailto:you@domain.com">Email</a>`;
    global.fetch = mock.fn(async (url) => {
      if (String(url).match(/\/(privacy|terms|about|contact|refund|returns|tos)/)) {
        return fakeResponse({ status: 404, body: "not found" });
      }
      return fakeResponse({ body: htmlPage({ body }) });
    });

    const result = await inspectWebsite("marketing-copy.example.com");
    assert.equal(result.contact, null);
  });

  test("pulls business identity from Organization JSON-LD", async () => {
    global.fetch = mock.fn(async (url) => {
      if (String(url).match(/\/(privacy|terms|about|contact|refund|returns|tos)/)) {
        return fakeResponse({ status: 404, body: "not found" });
      }
      return fakeResponse({ body: htmlPage({ head: ORG_JSON_LD }) });
    });

    const result = await inspectWebsite("audiomax.pk");
    assert.ok(result.contact.business);
    assert.equal(result.contact.business.name, "AudioMax Pakistan");
    assert.equal(result.contact.business.email, "support@audiomax.pk");
    assert.match(result.contact.business.address, /Karachi/);
  });
});

describe("policy page detection", () => {
  let originalFetch;
  beforeEach(() => {
    originalFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    mock.restoreAll();
  });

  test("confirms a page found via footer link, without a path probe", async () => {
    const body = `<footer><a href="/privacy-policy">Privacy Policy</a></footer>`;
    let probeCalls = 0;
    global.fetch = mock.fn(async (url) => {
      if (String(url).includes("/privacy")) probeCalls += 1;
      if (String(url).match(/\/(terms|about|contact|refund|returns|tos)/)) {
        return fakeResponse({ status: 404, body: "not found" });
      }
      return fakeResponse({ body: htmlPage({ body }) });
    });

    const result = await inspectWebsite("store.example.com");
    assert.equal(result.policies.privacyPolicy, true);
    assert.equal(probeCalls, 0, "should not need to probe when the homepage link was found");
  });

  test("confirms a page via direct path probe when the homepage scan misses it", async () => {
    global.fetch = mock.fn(async (url) => {
      const u = String(url);
      if (u.includes("/privacy")) return fakeResponse({ status: 200, body: "Privacy Policy page" });
      if (u.match(/\/(terms|about|contact|refund|returns|tos)/)) return fakeResponse({ status: 404, body: "not found" });
      return fakeResponse({ body: htmlPage({ body: "<p>no footer links here</p>" }) });
    });

    const result = await inspectWebsite("bare-site.example.com");
    assert.equal(result.policies.privacyPolicy, true);
  });

  test("reports false only when every probe cleanly responds not-found", async () => {
    global.fetch = mock.fn(async (url) => {
      const u = String(url);
      if (u.match(/\/(privacy|terms|about|contact|refund|returns|tos)/)) return fakeResponse({ status: 404, body: "not found" });
      return fakeResponse({ body: htmlPage({ body: "<p>no links</p>" }) });
    });

    const result = await inspectWebsite("no-policies.example.com");
    assert.equal(result.policies.privacyPolicy, false);
    assert.equal(result.policies.termsOfService, false);
  });

  test("reports null (unable to verify), not false, when probes fail to connect", async () => {
    global.fetch = mock.fn(async (url) => {
      const u = String(url);
      if (u === "https://flaky-probe.example.com") {
        return fakeResponse({ body: htmlPage({ body: "<p>no links</p>" }) });
      }
      throw new Error("network error during probe");
    });

    const result = await inspectWebsite("flaky-probe.example.com");
    assert.equal(result.policies.privacyPolicy, null);
  });
});

describe("gatherWebsiteEvidence", () => {
  let originalFetch;
  beforeEach(() => {
    originalFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    mock.restoreAll();
  });

  test("combines inspection and WHOIS into separated evidence blocks, never throws", async () => {
    global.fetch = mock.fn(async (url) => {
      if (String(url).match(/\/(privacy|terms|about|contact|refund|returns|tos)/)) {
        return fakeResponse({ status: 404, body: "not found" });
      }
      return fakeResponse({ body: htmlPage({ head: "<title>Evidence Test</title>" }) });
    });

    const evidence = await gatherWebsiteEvidence("example.com");
    assert.equal(evidence.domain, "example.com");
    assert.ok("security" in evidence);
    assert.ok("policies" in evidence);
    assert.ok("product" in evidence);
    assert.ok("contact" in evidence);
    assert.ok("whois" in evidence);
    assert.equal(evidence.security.pageTitle, "Evidence Test");
  });
});