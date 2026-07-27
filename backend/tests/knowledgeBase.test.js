import { test } from "node:test";
import assert from "node:assert";
import { scamPatternCatalog, formatKnowledgeBaseForPrompt, findPatternReference } from "../src/services/knowledgeBase.js";

test("knowledge base has a substantial, extensible catalog of patterns", () => {
  assert.ok(Array.isArray(scamPatternCatalog));
  assert.ok(scamPatternCatalog.length >= 20, "catalog should cover a broad range of scam patterns");
});

test("every pattern has a complete, generalized definition", () => {
  for (const p of scamPatternCatalog) {
    assert.ok(p.id, "pattern must have an id");
    assert.ok(p.category, `${p.id} must have a category`);
    assert.ok(p.name, `${p.id} must have a name`);
    assert.ok(p.whatItIs && p.whatItIs.length > 15, `${p.id} needs a real whatItIs description`);
    assert.ok(p.whyScammersUseIt && p.whyScammersUseIt.length > 15, `${p.id} needs a real whyScammersUseIt`);
    assert.ok(p.whyItMatters && p.whyItMatters.length > 15, `${p.id} needs a real whyItMatters`);
  }
});

test("every pattern id is unique", () => {
  const ids = scamPatternCatalog.map((p) => p.id);
  assert.strictEqual(new Set(ids).size, ids.length, "duplicate pattern ids found");
});

test("catalog is not hardcoded to one marketplace/domain", () => {
  const categories = new Set(scamPatternCatalog.map((p) => p.category));
  // Should span multiple distinct behavioral categories, not just one scenario.
  assert.ok(categories.size >= 5, "expected patterns to span several distinct categories");
});

test("formatKnowledgeBaseForPrompt returns a bullet list", () => {
  const formatted = formatKnowledgeBaseForPrompt();
  assert.ok(formatted.startsWith("-"));
  assert.ok(formatted.includes("\n-"));
});

test("findPatternReference looks up by id or name", () => {
  const byId = findPatternReference("advance_payment");
  const byName = findPatternReference("Advance Payment Request");
  assert.ok(byId);
  assert.strictEqual(byId.id, byName.id);
  assert.strictEqual(findPatternReference("not_a_real_pattern"), null);
});