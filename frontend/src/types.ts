export type Severity = "low" | "medium" | "high" | "critical";

export type ChecklistAnswer = "yes" | "no" | "unknown";

export interface DetectedPattern {
  name: string;
  category: string;
  severity: Severity;
  evidence: string;
  whatItIs: string;
  whyScammersUseIt: string;
  whyItMatters: string;
  scoreImpact: number;
}

export interface PositiveSignal {
  signal: string;
  evidence: string;
}

export interface SafetyChecklist {
  identityIndependentlyVerified: ChecklistAnswer;
  securePaymentMethodAvailable: ChecklistAnswer;
  pressureFreeConversation: ChecklistAnswer;
  urgencyDetected: ChecklistAnswer;
  sensitiveInfoRequested: ChecklistAnswer;
  movedOffOriginalPlatform: ChecklistAnswer;
  advancePaymentRequested: ChecklistAnswer;
  willingToVerifyClaims: ChecklistAnswer;
}

export interface RiskScoreBreakdownItem {
  factor: string;
  impact: number;
}

export interface ConversationReport {
  riskScore: number;
  riskLabel: "Safe" | "Low Risk" | "Moderate Risk" | "High Risk" | "Critical Risk" | string;
  confidence: number;
  confidenceExplanation: string;
  currencyDetected: string;
  executiveSummary: string;
  positiveSignals: PositiveSignal[];
  detectedPatterns: DetectedPattern[];
  informationNotVerified: string[];
  safetyChecklist: SafetyChecklist;
  timeline: string[];
  riskScoreBreakdown: RiskScoreBreakdownItem[];
  recommendations: string[];
  suggestedQuestions: string[];
  aiTransparencyExplanation: string;
  finalVerdict: string;
  disclaimer: string;
}

export type VerificationStatus = "found" | "missing" | "unable_to_verify";

export type YesNoUnverifiable = "yes" | "no" | "unable_to_verify";

// Category scores adapted for technical, business, reputation, and payment/marketplace factors
export interface UrlReportCategories {
  technicalSecurity: number;
  businessTransparency: number;
  customerReputation?: number | null;
  paymentSafety: number;
  // Marketplace-specific optional breakdown
  platformTrust?: number;
  sellerTransparency?: number;
  productListingAssessment?: number;
}

export interface SecurityAssessment {
  score: number;
  observations: string;
}

export interface BusinessTransparency {
  contactInformation: VerificationStatus;
  aboutPage: VerificationStatus;
  privacyPolicy: VerificationStatus;
  termsOfService: VerificationStatus;
  refundPolicy: VerificationStatus;
  physicalAddress: VerificationStatus;
  email: VerificationStatus;
  phoneNumber: VerificationStatus;
}

// Comprehensive buyer protection details
export interface BuyerProtectionStatus {
  buyerProtection: VerificationStatus;
  refundSupport: VerificationStatus;
  secureCheckout: VerificationStatus;
  orderTracking: VerificationStatus;
  disputeResolution: VerificationStatus;
  notes?: string;
}

export interface EvidenceSummaryItem {
  finding: string;
  evidence: string;
  reason: string;
}

export interface TrustBreakdownItem {
  factor: string;
  impact: number;
  percentage?: number;
}

export interface VerificationChecklistItem {
  item: string;
  status: "verified" | "missing" | "unable_to_verify";
  notes?: string;
}

// Structure for Customer Reviews & Ratings section
export interface CustomerReviewsData {
  available: boolean;
  overallRating?: number | string | null;
  totalReviews?: string | number | null;
  reviewSummary?: string; // AI Review Summary
  sentiment?: "Positive" | "Mixed" | "Negative" | "Unable to Determine";
  mostCommonPositiveThemes?: string[];
  mostCommonComplaints?: string[];
  fallbackMessage?: string; // Displayed if review data could not be retrieved
}

// Highlights key positive factors, uncertainties, and biggest risks
export interface AIInsights {
  strongestPositiveFactor: string;
  largestUncertainty: string;
  biggestRisk: string;
  overallAssessment: string;
}

export interface UrlReport {
  overallTrustScore: number;
  confidence: number;
  confidenceExplanation: string;
  finalRecommendation: "Appears Trustworthy" | "Proceed Carefully" | "High Risk" | "Avoid Until Further Verification" | string;
  finalRecommendationExplanation: string;
  executiveSummary: string;
  
  // Category score breakdowns
  categories: UrlReportCategories;

  // Key report sections
  securityAssessment: SecurityAssessment;
  businessTransparency: BusinessTransparency;
  buyerProtectionStatus: BuyerProtectionStatus;
  
  // Reviews section (populates if retrieved, fallback message if unavailable)
  customerReviews?: CustomerReviewsData;
  
  // Key findings & Insights
  aiInsights: AIInsights;
  positiveTrustSignals: string[];
  riskIndicators: string[];
  evidenceSummary: EvidenceSummaryItem[];

  // Actionable advice & Verification
  recommendedSafetySteps: string[];
  verificationChecklist: VerificationChecklistItem[];
  trustBreakdown: TrustBreakdownItem[];

  // Legal & AI transparency
  analysisLimitations: string[];
  disclaimer: string;
}

export interface ApiError {
  error: true;
  message: string;
}