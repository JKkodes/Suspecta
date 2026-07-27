import type { ConversationReport, Severity, UrlReport } from "../types";

type EvidenceRecord = Record<string, unknown>;

function asRecord(value: unknown): EvidenceRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as EvidenceRecord : null;
}

function displayText(value: unknown, fallback = "Not available"): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const text = value.map((item) => displayText(item, "")).filter(Boolean).join(", ");
    return text || fallback;
  }
  const record = asRecord(value);
  if (!record) return fallback;
  for (const key of ["signal", "title", "name", "label", "finding", "item", "description", "message", "text", "status", "reason", "evidence"]) {
    const candidate = record[key];
    if (typeof candidate === "string" || typeof candidate === "number" || typeof candidate === "boolean") return String(candidate);
  }
  return fallback;
}

function detailText(value: unknown, key: "evidence" | "reason" | "description"): string | null {
  const candidate = asRecord(value)?.[key];
  return candidate === null || candidate === undefined ? null : displayText(candidate, "");
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value.filter((item) => item !== null && item !== undefined) : [];
}

function numericValue(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function riskColor(score: number): string {
  if (score < 20) return "text-signal-safe border-signal-safe";
  if (score < 40) return "text-signal-low border-signal-low";
  if (score < 65) return "text-signal-moderate border-signal-moderate";
  if (score < 85) return "text-signal-high border-signal-high";
  return "text-signal-danger border-signal-danger";
}

function severityColor(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-signal-danger/25 text-signal-danger border-signal-danger font-semibold";
    case "high":
      return "bg-signal-danger/15 text-signal-high border-signal-high/40";
    case "medium":
      return "bg-signal-moderate/10 text-signal-moderate border-signal-moderate/40";
    default:
      return "bg-signal-low/10 text-signal-low border-signal-low/40";
  }
}

function riskEmoji(label: unknown): string {
  const normalized = displayText(label, "").toLowerCase();
  if (normalized.includes("critical")) return "\u{1F6A8}";
  if (normalized.includes("avoid") || normalized.includes("extremely")) return "\u{1F534}";
  if (normalized.includes("high")) return "\u{1F534}";
  if (normalized.includes("moderate")) return "\u{1F7E0}";
  if (normalized.includes("carefully") || normalized.includes("low")) return "\u{1F7E1}";
  return "\u{1F7E2}";
}

const BUSINESS_TRANSPARENCY_LABELS: Record<string, string> = {
  contactInformation: "Contact information",
  aboutPage: "About page",
  privacyPolicy: "Privacy policy",
  termsOfService: "Terms of service",
  refundPolicy: "Refund / return policy",
  physicalAddress: "Physical address",
  email: "Email",
  phoneNumber: "Phone number",
};

function formatEvidenceKey(key: string, value: unknown): string | null {
  if (key === "httpsEnabled" || key === "ssl" || key === "hasHttps") {
    return value ? "The website uses HTTPS to encrypt communication." : "The website does not use HTTPS.";
  }
  if (key === "strictTransportSecurity" || key === "hsts") {
    return "The website uses HTTP Strict Transport Security (HSTS).";
  }
  if (key === "privacyPolicy") {
    return value ? "A Privacy Policy page was found." : "Privacy Policy page is missing.";
  }
  if (key === "termsOfService") {
    return value ? "Terms of Service page was found." : "Terms of Service page is missing.";
  }
  if (key === "contactInformation" || key === "hasContactInfo") {
    return value ? "Contact information is clearly provided." : "Contact information is missing.";
  }
  return null;
}

function websiteEvidenceIcon(value: unknown): string {
  const normalized = displayText(value, "").toLowerCase();
  if (normalized === "yes" || normalized === "found" || normalized === "verified" || normalized === "true") return "\u2705";
  if (normalized === "no" || normalized === "missing" || normalized === "false") return "\u274C";
  return "\u26A0\uFE0F";
}

function websiteEvidenceStatus(value: unknown): string | null {
  return displayText(value, "").toLowerCase() === "unable_to_verify" ? "Could not verify" : null;
}

const PAYMENT_SAFETY_LABELS: Record<string, string> = {
  buyerProtectionAvailable: "Buyer protection available",
  securePaymentMethodsAvailable: "Secure payment methods available",
  onlyRiskyPaymentMethodsOffered: "Only risky payment methods offered",
};

function ScoreStamp({ score, label, sublabel }: { score: unknown; label: unknown; sublabel: unknown }) {
  const color = riskColor(numericValue(score));
  return (
    <div className={`relative border-4 ${color} rounded-sm px-8 py-6 rotate-[-2deg] inline-block bg-navy-light/60`}>
      <p className="stamp text-5xl leading-none">{numericValue(score)}</p>
      <p className="case-label text-[10px] mt-2">{displayText(sublabel)}</p>
      <p className={`stamp text-lg mt-1 ${color.split(" ")[0]}`}>{displayText(label)}</p>
    </div>
  );
}

export function ConversationReportView({ report }: { report: ConversationReport }) {
  const positiveSignals = asList(report.positiveSignals);
  const detectedPatterns = asList(report.detectedPatterns);
  const informationNotVerified = asList(report.informationNotVerified);
  const timeline = asList(report.timeline);
  const recommendations = asList(report.recommendations).slice(0, 3);
  const suggestedQuestions = asList(report.suggestedQuestions);
  const positiveCount = positiveSignals.length;
  const riskCount = detectedPatterns.length;

  const topContributors = [...(report.riskScoreBreakdown ?? [])]
    .filter((item) => item.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between print:hidden border-b border-navy-lighter pb-4">
        <div>
          <h2 className="text-lg font-semibold text-cream">Analysis Report</h2>
          <p className="text-xs text-cream-dim">You can print or save this report as a PDF.</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-brick hover:bg-brick-light text-white text-sm font-medium rounded-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <span>🖨️</span> Print / Save PDF
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
        <div className="flex items-end gap-3">
          <span className="text-4xl leading-none" aria-hidden="true">
            {riskEmoji(report.riskLabel)}
          </span>
          <ScoreStamp score={report.riskScore} label={report.riskLabel} sublabel="Risk score / 100" />
        </div>
        <div className="text-right">
          <p className="case-label text-[10px] text-cream-dim">Confidence</p>
          <p className="text-2xl stamp">{report.confidence}%</p>
          <p className="case-label text-[10px] text-cream-dim mt-2">Currency detected</p>
          <p className="text-sm">{report.currencyDetected}</p>
        </div>
      </div>

      {report.executiveSummary && (
        <section className="border border-navy-lighter rounded-sm p-4 bg-navy-lighter/30">
          <h3 className="case-label text-xs text-cream-dim mb-2">Executive summary</h3>
          <p className="text-sm leading-relaxed">{report.executiveSummary}</p>
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-6 border border-navy-lighter rounded-sm p-4">
        <div>
          <p className="case-label text-xs text-cream-dim mb-2">
            Trust signals: <span className="text-cream">{positiveCount}</span>
          </p>
          {positiveCount > 0 ? (
            <ul className="space-y-1.5">
              {positiveSignals.map((s, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-signal-safe">&#10003;</span>
                  <span>{displayText(s, "Trust signal")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-cream-dim">No meaningful trust-building behavior was detected.</p>
          )}
        </div>
        <div>
          <p className="case-label text-xs text-cream-dim mb-2">
            Risk signals: <span className="text-cream">{riskCount}</span>
          </p>
          {riskCount > 0 ? (
            <ul className="space-y-1.5">
              {detectedPatterns.map((p, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-signal-high">&#9888;</span>
                  <span>{displayText(p, "Risk pattern")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-cream-dim">No specific risk patterns were detected.</p>
          )}
        </div>
      </section>

      {riskCount > 0 && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Detected patterns</h3>
          <ul className="space-y-4">
            {report.detectedPatterns.map((p, i) => (
              <li key={i} className={`border rounded-sm px-4 py-3 ${severityColor(p.severity)}`}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="case-label text-[10px] opacity-80">{p.severity}</span>
                    <span className="case-label text-[10px] bg-navy-lighter/60 rounded px-2 py-0.5">
                      +{p.scoreImpact}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-cream-dim mb-2">{p.category}</p>
                {p.evidence && (
                  <p className="text-sm italic text-cream/90 mb-2">&ldquo;{p.evidence}&rdquo;</p>
                )}
                <p className="text-xs text-cream/80">
                  <span className="text-cream-dim">What it is: </span>
                  {p.whatItIs}
                </p>
                <p className="text-xs text-cream/80 mt-1">
                  <span className="text-cream-dim">Why scammers use it: </span>
                  {p.whyScammersUseIt}
                </p>
                <p className="text-xs text-cream/80 mt-1">
                  <span className="text-cream-dim">Why it matters here: </span>
                  {p.whyItMatters}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {positiveCount > 0 && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Risk-reducing factors</h3>
          <ul className="space-y-3">
            {positiveSignals.map((s, i) => (
              <li key={i} className="border-l-2 border-signal-safe/50 pl-4">
                <p className="text-sm">{displayText(s, "Trust signal")}</p>
                {detailText(s, "evidence") && <p className="text-xs italic text-cream-dim mt-1">&ldquo;{detailText(s, "evidence")}&rdquo;</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {informationNotVerified.length > 0 && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Information that could not be verified</h3>
          <ul className="space-y-1.5">
            {informationNotVerified.map((item, i) => (
              <li key={i} className="text-sm flex gap-2 text-cream-dim">
                <span>&#9888;</span>
                <span>{displayText(item, "This could not be verified.")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {timeline.length > 0 && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Conversation timeline</h3>
          <ol className="space-y-1.5">
            {timeline.map((stage, i) => (
              <li key={i} className="text-sm flex items-center gap-2">
                {i > 0 && <span className="text-cream-dim">&darr;</span>}
                <span>{displayText(stage, "Timeline detail unavailable.")}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {topContributors.length > 0 && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Primary risk contributors</h3>
          <ul className="space-y-2">
            {topContributors.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="case-label text-signal-high w-12 shrink-0">+{item.impact}</span>
                <span>{item.factor}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.riskScoreBreakdown?.length > 0 && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Risk score breakdown</h3>
          <ul className="space-y-2">
            {report.riskScoreBreakdown.map((item, i) => (
              <li key={i} className="flex items-center justify-between text-sm border-b border-navy-lighter/50 pb-1.5">
                <span>{item.factor}</span>
                <span className={item.impact < 0 ? "text-signal-safe" : "text-signal-high"}>
                  {item.impact > 0 ? "+" : ""}
                  {item.impact}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-sm mt-3 pt-2 border-t border-navy-lighter font-medium">
            <span className="case-label text-xs">Final risk score</span>
            <span>{report.riskScore}/100</span>
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="grid sm:grid-cols-2 gap-8">
          <div>
            <h3 className="case-label text-xs text-cream-dim mb-3">Recommended next steps</h3>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-brick-light">&rarr;</span>
                  <span>{displayText(rec, "No recommendation details available.")}</span>
                </li>
              ))}
            </ul>
          </div>
          {suggestedQuestions.length > 0 && (
            <div>
              <h3 className="case-label text-xs text-cream-dim mb-3">Questions worth asking</h3>
              <ul className="space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-brick-light">?</span>
                    <span>{displayText(q, "No question details available.")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {report.aiTransparencyExplanation && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">How the AI reached this conclusion</h3>
          <p className="text-sm leading-relaxed whitespace-pre-line text-cream/90">
            {report.aiTransparencyExplanation}
          </p>
        </section>
      )}

      {report.finalVerdict && (
        <section className="border border-navy-lighter rounded-sm p-4 bg-navy-lighter/30">
          <h3 className="case-label text-xs text-cream-dim mb-2">Final verdict</h3>
          <p className="text-sm leading-relaxed">{report.finalVerdict}</p>
        </section>
      )}

      {report.confidenceExplanation && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-2">Why this confidence score</h3>
          <p className="text-xs text-cream-dim leading-relaxed">{report.confidenceExplanation}</p>
        </section>
      )}

      <p className="text-xs text-cream-dim border-t border-navy-lighter pt-4">{report.disclaimer}</p>
    </div>
  );
}

function CategoryBar({ label, value }: { label: unknown; value: unknown }) {
  const percentage = numericValue(value);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="case-label text-cream-dim">{displayText(label)}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 bg-navy-lighter rounded-full overflow-hidden">
        <div
          className="h-full bg-brick-light rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function UrlReportView({ report }: { report: any }) {
  const findings = asList(report.findings || report.keyFindings);
  const positiveTrustSignals = asList(report.positiveTrustSignals);
  const rawRiskIndicators = asList(report.riskIndicators);
  const evidenceSummary = asList(report.evidenceSummary);
  const recommendedActions = asList(report.recommendedActions || report.recommendations).slice(0, 3);
  const evidenceCoverage = asRecord(report.evidenceCoverage);
  const categories = asRecord(report.categories) || {};

  const websiteSafetyScore = categories.websiteSafety ?? report.websiteSafety ?? report.safetyScore;
  const sellerTrustScore = categories.sellerTrust ?? report.sellerTrust;
  const reviewQualityScore = categories.reviewQuality ?? report.reviewQuality;
  const securityScore = categories.security ?? report.securityAssessment?.score ?? report.securityScore;
  const pricingSuspicionText = categories.pricingSuspicion ?? report.pricingSuspicion;

  const businessTransparency = report.businessTransparency || {};
  const hasContactInfo = businessTransparency.contactInformation === true || businessTransparency.contactInformation === "yes" || businessTransparency.contactInformation === "found";
  
  const riskIndicators = rawRiskIndicators.filter((r) => {
    const text = displayText(r).toLowerCase();
    if (hasContactInfo && text.includes("missing contact information")) {
      return false;
    }
    return true;
  });

  const onSiteReviews = report.communityReviews?.onSiteReviews;
  const independentReviews = report.communityReviews?.independentReviews;
  const hasReviewsData = onSiteReviews || independentReviews || (onSiteReviews?.totalReviews && onSiteReviews.totalReviews !== "N/A");

  const finalRecommendation = report.finalRecommendation || report.recommendation;
  const paymentSafetyObj = report.paymentSafety || report.paymentMethods;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between print:hidden border-b border-navy-lighter pb-4">
        <div>
          <h2 className="text-lg font-semibold text-cream">Analysis Report</h2>
          <p className="text-xs text-cream-dim">You can print or save this report as a PDF.</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-brick hover:bg-brick-light text-white text-sm font-medium rounded-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <span>🖨️</span> Print / Save PDF
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
        <div className="flex items-end gap-3">
          <span className="text-4xl leading-none" aria-hidden="true">
            {riskEmoji(finalRecommendation)}
          </span>
          <ScoreStamp score={report.overallTrustScore ?? report.trustScore} label={finalRecommendation} sublabel="Trust score / 100" />
        </div>
        {typeof report.confidence === "number" && (
          <div className="text-right">
            <p className="case-label text-[10px] text-cream-dim">Confidence</p>
            <p className="text-2xl stamp">{report.confidence}%</p>
          </div>
        )}
      </div>

      {finalRecommendation && (
        <div className="inline-block border border-brick-light/50 bg-brick/10 rounded-sm px-4 py-2">
          <p className="case-label text-[10px] text-cream-dim mb-1">Final recommendation</p>
          <p className="text-sm text-brick-light">{displayText(finalRecommendation)}</p>
          {report.finalRecommendationExplanation && (
            <p className="text-xs text-cream/80 mt-1 max-w-md">{displayText(report.finalRecommendationExplanation)}</p>
          )}
        </div>
      )}

      <section className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
        {websiteSafetyScore != null && <CategoryBar label="Website safety" value={websiteSafetyScore} />}
        {sellerTrustScore != null && <CategoryBar label="Platform trust" value={sellerTrustScore} />}
        {reviewQualityScore != null && <CategoryBar label="Review quality" value={reviewQualityScore} />}
        {securityScore != null && <CategoryBar label="Security" value={securityScore} />}
        {pricingSuspicionText != null && (
          <div>
            <p className="case-label text-xs text-cream-dim mb-1">Pricing</p>
            <p className="text-sm">{displayText(pricingSuspicionText)}</p>
          </div>
        )}
      </section>

      {report.securityAssessment && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Website security</h3>
          <div className="border border-navy-lighter rounded-sm p-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="case-label text-cream-dim">Security score</span>
              <span>{numericValue(report.securityAssessment.score)}/100</span>
            </div>
            <p className="text-sm text-cream/90">{displayText(report.securityAssessment.observations)}</p>
          </div>
        </section>
      )}

      {findings.length > 0 && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Findings</h3>
          <ul className="space-y-2">
            {findings.map((f, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-brick-light">&rarr;</span>
                <span>{displayText(f, "No finding details available.")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.businessTransparency && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Business transparency</h3>
          <ul className="grid sm:grid-cols-2 gap-2">
            {Object.entries(report.businessTransparency).map(([key, value]) => (
              <li key={key} className="text-sm flex items-center gap-2">
                <span>{websiteEvidenceIcon(value)}</span>
                <span>{BUSINESS_TRANSPARENCY_LABELS[key] || key}</span>
                {websiteEvidenceStatus(value) && <span className="text-xs text-cream-dim">{websiteEvidenceStatus(value)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasReviewsData && report.communityReviews && (
        <section className="space-y-6">
          <h3 className="case-label text-xs text-cream-dim">Customer Feedback</h3>
          
          {onSiteReviews && (
            <div className="border border-navy-lighter rounded-sm p-4 bg-navy-lighter/20">
              <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                <span>On-site Reviews</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  onSiteReviews?.confidence === 'High' ? 'border-signal-safe text-signal-safe' :
                  onSiteReviews?.confidence === 'Medium' ? 'border-signal-low text-signal-low' :
                  'border-navy-light text-cream-dim'
                }`}>
                  Confidence: {onSiteReviews?.confidence || 'Unknown'}
                </span>
              </h4>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {onSiteReviews?.rating && (
                  <div>
                    <p className="case-label text-[10px] text-cream-dim">Rating</p>
                    <p className="text-lg font-bold">{onSiteReviews.rating}</p>
                  </div>
                )}
                {onSiteReviews?.totalReviews && (
                  <div>
                    <p className="case-label text-[10px] text-cream-dim">Total Reviews</p>
                    <p className="text-lg font-bold">{onSiteReviews.totalReviews}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {onSiteReviews?.sentiment && (
                  <div>
                    <p className="case-label text-[10px] text-cream-dim mb-1">Sentiment</p>
                    <p className="text-sm text-cream/90">{onSiteReviews.sentiment}</p>
                  </div>
                )}
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {asList(onSiteReviews?.positiveThemes).length > 0 && (
                    <div>
                      <p className="case-label text-[10px] text-signal-safe mb-1">Positive Themes</p>
                      <ul className="text-xs space-y-1">
                        {asList(onSiteReviews.positiveThemes).map((theme, i) => (
                          <li key={i} className="flex gap-2">• {displayText(theme)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {asList(onSiteReviews?.commonConcerns).length > 0 && (
                    <div>
                      <p className="case-label text-[10px] text-signal-high mb-1">Common Concerns</p>
                      <ul className="text-xs space-y-1">
                        {asList(onSiteReviews.commonConcerns).map((concern, i) => (
                          <li key={i} className="flex gap-2">• {displayText(concern)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {asList(onSiteReviews?.sampleEvidence).length > 0 && (
                  <div>
                    <p className="case-label text-[10px] text-cream-dim mb-1 mt-3">Sample Evidence</p>
                    <div className="space-y-2">
                      {asList(onSiteReviews.sampleEvidence).map((sample, i) => (
                        <p key={i} className="text-xs italic text-cream/70 border-l border-navy-light pl-2">
                          &ldquo;{displayText(sample)}&rdquo;
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {independentReviews && (
            <div className="border border-navy-lighter rounded-sm p-4 bg-navy-lighter/20">
              <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                <span>Independent Reviews</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  independentReviews?.confidence === 'High' ? 'border-signal-safe text-signal-safe' :
                  independentReviews?.confidence === 'Medium' ? 'border-signal-low text-signal-low' :
                  'border-navy-light text-cream-dim'
                }`}>
                  Confidence: {independentReviews?.confidence || 'Unknown'}
                </span>
              </h4>
              {independentReviews?.summary && (
                <p className="text-sm text-cream/90 mb-3">{independentReviews.summary}</p>
              )}
              
              <div className="grid sm:grid-cols-2 gap-4">
                {asList(independentReviews?.positiveFindings).length > 0 && (
                  <div>
                    <p className="case-label text-[10px] text-signal-safe mb-1">Positive Findings</p>
                    <ul className="text-xs space-y-1">
                      {asList(independentReviews.positiveFindings).map((finding, i) => (
                        <li key={i} className="flex gap-2">• {displayText(finding)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {asList(independentReviews?.negativeFindings).length > 0 && (
                  <div>
                    <p className="case-label text-[10px] text-signal-high mb-1">Negative Findings</p>
                    <ul className="text-xs space-y-1">
                      {asList(independentReviews.negativeFindings).map((finding, i) => (
                        <li key={i} className="flex gap-2">• {displayText(finding)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {paymentSafetyObj && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Payment safety</h3>
          <ul className="grid sm:grid-cols-2 gap-2">
            {Object.entries(paymentSafetyObj).map(([key, value]) => (
              <li key={key} className="text-sm flex items-center gap-2">
                <span>{websiteEvidenceIcon(value)}</span>
                <span>{PAYMENT_SAFETY_LABELS[key] || key}</span>
                {websiteEvidenceStatus(value) && <span className="text-xs text-cream-dim">{websiteEvidenceStatus(value)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-8">
        <div>
          <h3 className="case-label text-xs text-cream-dim mb-3">Positive trust signals</h3>
          {positiveTrustSignals.length > 0 ? (
            <ul className="space-y-2">
              {positiveTrustSignals.map((s, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-signal-safe">&#10003;</span>
                  <span>{displayText(s, "Positive signal")}</span>
                  {detailText(s, "evidence") && <span className="text-xs text-cream-dim">Evidence: {detailText(s, "evidence")}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-cream-dim">No strong positive trust signals detected.</p>
          )}
        </div>
        {riskIndicators.length > 0 && (
          <div>
            <h3 className="case-label text-xs text-cream-dim mb-3">Potential risk indicators</h3>
            <ul className="space-y-2">
              {riskIndicators.map((r, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-signal-high">&#9888;</span>
                  <span>{displayText(r, "Verified risk")}</span>
                  {detailText(r, "evidence") && <span className="text-xs text-cream-dim">Evidence: {detailText(r, "evidence")}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {evidenceCoverage && (
        <section className="border border-navy-lighter rounded-sm p-4">
          <h3 className="case-label text-xs text-cream-dim mb-3">Evidence coverage</h3>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            {asList(evidenceCoverage.successfullyVerified).length > 0 && (
              <div>
                <p className="text-signal-safe mb-2">Successfully verified</p>
                <ul className="space-y-1">
                  {asList(evidenceCoverage.successfullyVerified).map((item, index) => <li key={index}>✓ {displayText(item, "Verified evidence")}</li>)}
                </ul>
              </div>
            )}
            {asList(evidenceCoverage.couldNotVerify).length > 0 && (
              <div>
                <p className="text-cream-dim mb-2">Could not verify</p>
                <ul className="space-y-1">
                  {asList(evidenceCoverage.couldNotVerify).map((item, index) => <li key={index}>• {displayText(item, "This could not be verified.")}</li>)}
                </ul>
              </div>
            )}
            {asList(evidenceCoverage.verifiedRisks).length > 0 && (
              <div>
                <p className="text-signal-high mb-2">Verified risks</p>
                <ul className="space-y-1">{asList(evidenceCoverage.verifiedRisks).map((item, index) => <li key={index}>⚠ {displayText(item, "Verified risk")}</li>)}</ul>
              </div>
            )}
            {asList(evidenceCoverage.positiveSignals).length > 0 && (
              <div>
                <p className="text-signal-safe mb-2">Positive signals</p>
                <ul className="space-y-1">
                  {asList(evidenceCoverage.positiveSignals).map((item, index) => <li key={index}>✓ {displayText(item, "Positive signal")}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {evidenceSummary.length > 0 && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Evidence summary</h3>
          <ul className="space-y-3">
            {evidenceSummary.map((item, i) => {
              const record = asRecord(item);
              const rawKey = record ? String(record.key || "") : "";
              const rawVal = record ? record.value : undefined;
              const formattedExplanation = rawKey ? formatEvidenceKey(rawKey, rawVal) : null;

              return (
                <li key={i} className="border-l-2 border-brick-light/55 pl-4">
                  <p className="text-sm font-medium">{formattedExplanation || displayText(item, "Evidence item")}</p>
                  {detailText(item, "evidence") && (
                    <p className="text-xs mt-1 text-cream/80">
                      <span className="text-cream-dim">Evidence: </span>
                      {detailText(item, "evidence")}
                    </p>
                  )}
                  {detailText(item, "reason") && (
                    <p className="text-xs mt-1 text-cream-dim">
                      <span className="text-cream-dim">Reason: </span>
                      {detailText(item, "reason")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {report.trustBreakdown && report.trustBreakdown.length > 0 && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3 font-semibold">Trust breakdown</h3>
          <ul className="space-y-2">
            {report.trustBreakdown.map((item: any, i: number) => (
              <li key={i} className="flex items-center justify-between text-sm border-b border-navy-lighter/50 pb-1.5">
                <span>{item.factor}</span>
                <span className={item.impact > 0 ? "text-signal-safe" : "text-signal-high"}>
                  {item.impact > 0 ? "+" : ""}
                  {numericValue(item.impact)}/100
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid sm:grid-cols-2 gap-8">
        {recommendedActions.length > 0 && (
          <section>
            <h3 className="case-label text-xs text-cream-dim mb-3">Recommended Actions</h3>
            <ul className="space-y-2">
              {recommendedActions.map((rec, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-brick-light">&rarr;</span>
                  <span>{displayText(rec, "No recommendation details available.")}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">Things You Should Verify</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><span>&#x25A2;</span> Seller rating</li>
            <li className="flex items-center gap-2"><span>&#x25A2;</span> Number of completed orders</li>
            <li className="flex items-center gap-2"><span>&#x25A2;</span> Product authenticity</li>
            <li className="flex items-center gap-2"><span>&#x25A2;</span> Warranty information</li>
            <li className="flex items-center gap-2"><span>&#x25A2;</span> Return eligibility</li>
          </ul>
        </section>
      </div>

      <section className="border border-navy-lighter rounded-sm p-4 bg-navy-lighter/20">
        <h3 className="case-label text-xs text-cream-dim mb-2">Why These Steps Matter</h3>
        <p className="text-sm leading-relaxed text-cream/90">
          Even on trusted platforms or established websites, individual vendor reliability can vary. Checking seller ratings, reading recent reviews, and using protected payment methods significantly reduce the risk of receiving counterfeit products or encountering delivery issues.
        </p>
      </section>

      {report.aiTransparencyExplanation && (
        <section>
          <h3 className="case-label text-xs text-cream-dim mb-3">How the AI reached this conclusion</h3>
          <p className="text-sm leading-relaxed whitespace-pre-line text-cream/90">
            {report.aiTransparencyExplanation}
          </p>
        </section>
      )}

      {report.disclaimer && (
        <p className="text-xs text-cream-dim border-t border-navy-lighter pt-4">{report.disclaimer}</p>
      )}
    </div>
  );
}