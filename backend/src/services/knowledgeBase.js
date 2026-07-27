// Extensible catalog of generalized scam behavioral patterns.
//
// This is domain-agnostic by design: entries describe *behaviors*, not
// marketplace-specific wording, so the same catalog applies to online
// shopping, freelancing, classified ads, rentals, job offers, investment
// pitches, customer support impersonation, charity requests, ticket sales,
// romance scams, or any other online conversation.
//
// To add a new scam pattern later, just append another object to
// `scamPatternCatalog` below - nothing else needs to change. The prompt
// builder and report schema consume this list generically.

export const scamPatternCatalog = [
  // --- Payment manipulation -------------------------------------------------
  {
    id: "advance_payment",
    category: "Payment Manipulation",
    name: "Advance Payment Request",
    whatItIs: "A request for partial or full payment before goods, services, or access are delivered.",
    whyScammersUseIt: "It lets a scammer collect money without ever having to follow through, and once paid, buyers have little leverage left.",
    whyItMatters: "Advance payments are not inherently fraudulent, but they carry meaningfully more risk when paired with pressure tactics, refusal to verify identity, or no clear delivery mechanism.",
  },
  {
    id: "external_payment_request",
    category: "Payment Manipulation",
    name: "External / Off-Platform Payment Request",
    whatItIs: "A request to pay via direct bank transfer, mobile wallet, or another channel instead of the platform's own protected payment system.",
    whyScammersUseIt: "Off-platform payments usually bypass buyer protection, dispute resolution, and refund mechanisms that a marketplace or service would normally offer.",
    whyItMatters: "Losing access to a platform's payment protection significantly raises the cost of a scam going wrong, even if the request itself has an innocent explanation.",
  },
  {
    id: "crypto_payment_request",
    category: "Payment Manipulation",
    name: "Cryptocurrency Payment Request",
    whatItIs: "A request to pay in cryptocurrency instead of a traceable, reversible payment method.",
    whyScammersUseIt: "Crypto transactions are typically irreversible and harder to trace, making them attractive when a scammer wants to avoid chargebacks or investigation.",
    whyItMatters: "For everyday purchases or services, an insistence on crypto with no other option offered is a meaningful deviation from normal payment expectations.",
  },
  {
    id: "gift_card_request",
    category: "Payment Manipulation",
    name: "Gift Card Payment Request",
    whatItIs: "A request to pay using gift cards, typically by sharing the card code directly.",
    whyScammersUseIt: "Gift card codes function like cash once shared, are untraceable, and cannot be refunded or recalled.",
    whyItMatters: "Legitimate businesses essentially never require gift cards as a primary payment method; this is one of the more reliable single indicators across scam types.",
  },
  {
    id: "refusal_secure_payment",
    category: "Payment Manipulation",
    name: "Refusal of Secure or Escrow Payment",
    whatItIs: "Declining to use a platform's built-in payment protection, escrow service, or other secure method when it's available and offered.",
    whyScammersUseIt: "Secure/escrow payments hold funds until both sides confirm the transaction went as expected, which removes a scammer's ability to collect payment and disappear.",
    whyItMatters: "A genuine seller usually has no strong reason to avoid a protection mechanism that also protects them; repeated refusal is a meaningful signal.",
  },

  // --- Urgency and pressure --------------------------------------------------
  {
    id: "artificial_urgency",
    category: "Urgency & Pressure",
    name: "Artificial Urgency",
    whatItIs: "Statements designed to create time pressure, such as claiming an offer or item availability is about to expire.",
    whyScammersUseIt: "Urgency short-circuits careful decision-making and discourages the buyer from taking time to verify claims or shop around.",
    whyItMatters: "Genuine time-limited offers exist, but urgency combined with other pressure tactics or unverifiable claims raises risk considerably.",
  },
  {
    id: "pressure_tactics",
    category: "Urgency & Pressure",
    name: "General Pressure Tactics",
    whatItIs: "Repeated pushing for an immediate decision, payment, or action, often escalating if the other person hesitates.",
    whyScammersUseIt: "Sustained pressure wears down hesitation and makes people act before they've had a chance to think it through or verify anything.",
    whyItMatters: "Legitimate transactions can typically tolerate reasonable questions and a bit of delay; an inability to tolerate any friction is notable.",
  },
  {
    id: "repeated_reassurance",
    category: "Urgency & Pressure",
    name: "Repeated Reassurance Under Pressure",
    whatItIs: "Excessive, repeated statements insisting on trustworthiness ('trust me', 'I promise', 'I am honest') especially right when the other party expresses doubt.",
    whyScammersUseIt: "Repeating trust claims is a low-cost way to counter suspicion without providing any actual verifiable proof.",
    whyItMatters: "Genuine trust is usually built through verifiable actions (proof, willingness to verify) rather than repeated verbal reassurance alone.",
  },
  {
    id: "pressure_off_platform",
    category: "Urgency & Pressure",
    name: "Pressure to Leave the Platform",
    whatItIs: "Encouragement to move the conversation to WhatsApp, Telegram, personal email, or another private channel.",
    whyScammersUseIt: "Leaving a platform removes transaction records, buyer protections, and the platform's ability to intervene or take reports.",
    whyItMatters: "This is common in entirely legitimate conversations too, but becomes a stronger signal when combined with payment or verification requests.",
  },

  // --- Identity and trust manipulation ---------------------------------------
  {
    id: "identity_manipulation",
    category: "Identity & Trust Manipulation",
    name: "Identity Manipulation or Impersonation",
    whatItIs: "Unsolicited claims about identity (sending an ID document, claiming a specific job or authority) that cannot be independently confirmed through the conversation alone.",
    whyScammersUseIt: "An unverified ID image, screenshot, or title creates a strong impression of legitimacy without requiring any real verification.",
    whyItMatters: "An identity claim that cannot be checked independently provides no real assurance, regardless of how convincing it looks.",
  },
  {
    id: "fake_trust_building",
    category: "Identity & Trust Manipulation",
    name: "Fake Trust-Building Behavior",
    whatItIs: "Early, unprompted efforts to appear extremely trustworthy - oversharing personal details, unsolicited documents, or excessive friendliness before any real relationship exists.",
    whyScammersUseIt: "Front-loading trust signals is a known tactic to lower a target's guard quickly, before any verification has actually occurred.",
    whyItMatters: "Genuine trust typically builds gradually through consistent behavior, not through an unusually fast, one-sided display of trustworthiness.",
  },
  {
    id: "authority_claims",
    category: "Identity & Trust Manipulation",
    name: "Government or Military Authority Claims",
    whatItIs: "Claims of being a government official, military member, or other authority figure, used to add unearned credibility.",
    whyScammersUseIt: "Authority framing discourages questioning, since people are culturally primed to trust or defer to perceived officials.",
    whyItMatters: "These roles are easy to claim and hard to verify in a chat conversation, so the claim itself carries little evidentiary weight on its own.",
  },
  {
    id: "fake_business_claims",
    category: "Identity & Trust Manipulation",
    name: "Fake or Unverifiable Business Claims",
    whatItIs: "Claims of representing a registered business, company, or brand that cannot be confirmed from the conversation.",
    whyScammersUseIt: "Business framing suggests accountability and permanence, both of which discourage suspicion.",
    whyItMatters: "A legitimate business is usually able to provide verifiable registration details, an official website, or other checkable information if asked.",
  },
  {
    id: "fake_customer_support",
    category: "Identity & Trust Manipulation",
    name: "Fake Customer Support / Impersonation",
    whatItIs: "Someone presenting themselves as official support staff for a platform, bank, or service, especially unprompted.",
    whyScammersUseIt: "Impersonating support is a common route to requesting credentials or payment details under a trusted-sounding pretext.",
    whyItMatters: "Real support staff for most platforms do not initiate contact asking for passwords, OTPs, or payment outside official channels.",
  },
  {
    id: "social_engineering",
    category: "Identity & Trust Manipulation",
    name: "General Social Engineering",
    whatItIs: "Any structured attempt to manipulate someone's actions or decisions through psychological tactics rather than genuine information.",
    whyScammersUseIt: "This is the umbrella technique behind most scams - influencing behavior without needing anything to actually be true.",
    whyItMatters: "Recognizing the tactic (rather than only the specific words used) helps generalize detection across many different scam scripts.",
  },

  // --- Verification avoidance -------------------------------------------------
  {
    id: "refusal_to_verify",
    category: "Verification Avoidance",
    name: "Refusal to Verify",
    whatItIs: "Declining or deflecting reasonable requests to confirm identity, ownership, or legitimacy.",
    whyScammersUseIt: "Avoiding verification protects a false claim from being tested, since most fabricated stories don't hold up under scrutiny.",
    whyItMatters: "A willingness to be reasonably verified is one of the strongest trust signals available in a text conversation; refusal removes that entirely.",
  },
  {
    id: "avoiding_video_calls",
    category: "Verification Avoidance",
    name: "Avoiding Video Calls or Live Verification",
    whatItIs: "Repeatedly declining or making excuses to avoid a live video call or real-time verification when requested.",
    whyScammersUseIt: "A live call is much harder to fake convincingly than text or a photo, so avoiding it protects a false identity or false claim.",
    whyItMatters: "Legitimate parties often have practical reasons to prefer text, but consistent avoidance specifically when verification is requested is more telling.",
  },
  {
    id: "avoiding_live_demo",
    category: "Verification Avoidance",
    name: "Avoiding Live Demonstrations",
    whatItIs: "Reluctance to show a product, service, or process live (e.g. a live photo/video on request) despite claiming to have it.",
    whyScammersUseIt: "Live, on-demand proof is much harder to fabricate than pre-made photos, videos, or documents.",
    whyItMatters: "This is especially relevant for goods, since a genuine seller in possession of an item can usually demonstrate it without much friction.",
  },
  {
    id: "incomplete_answers",
    category: "Verification Avoidance",
    name: "Incomplete or Evasive Answers",
    whatItIs: "Responses that dodge direct questions, answer a different question than what was asked, or stay vague on specifics.",
    whyScammersUseIt: "Vagueness avoids the risk of a specific, checkable claim being disproven later.",
    whyItMatters: "Genuine parties usually engage with specific questions directly, even if the answer is simple; consistent evasiveness is worth noting.",
  },

  // --- Fabricated evidence ------------------------------------------------
  {
    id: "fake_screenshots",
    category: "Fabricated Evidence",
    name: "Fake or Unverifiable Screenshots",
    whatItIs: "Screenshots presented as proof (of payment, shipment, identity, etc.) that cannot be independently confirmed.",
    whyScammersUseIt: "Screenshots are trivially easy to edit or reuse, and most people don't scrutinize them closely.",
    whyItMatters: "A screenshot alone proves very little; genuine proof usually has some independently checkable element (a transaction ID, tracking number, etc.).",
  },
  {
    id: "fake_payment_proof",
    category: "Fabricated Evidence",
    name: "Fake Payment Proof",
    whatItIs: "Claims of having already paid or sent money, unsupported by anything the recipient can verify on their end.",
    whyScammersUseIt: "This tactic is used to pressure the other party into releasing goods, services, or access before payment actually clears.",
    whyItMatters: "Payment should generally be confirmed on the receiving end, not just claimed by the sender, before anything of value changes hands.",
  },
  {
    id: "fake_courier_scam",
    category: "Fabricated Evidence",
    name: "Fake Courier / Shipment Scam",
    whatItIs: "Claims about a shipment, courier, or delivery status - such as a tracking number that gets withheld, delayed, or never actually resolves - that cannot be verified.",
    whyScammersUseIt: "A plausible-sounding shipping story justifies further delay or additional payment while avoiding ever producing real, checkable delivery information.",
    whyItMatters: "A withheld or perpetually 'about to arrive' tracking number, especially alongside a payment request, is one of the more reliable combined indicators.",
  },
  {
    id: "fake_invoice",
    category: "Fabricated Evidence",
    name: "Fake or Unverifiable Invoice/Receipt",
    whatItIs: "An invoice, receipt, or proof-of-purchase document that cannot be checked against a real business or transaction system.",
    whyScammersUseIt: "A professional-looking document adds a veneer of legitimacy without requiring the underlying transaction to be real.",
    whyItMatters: "Document formatting alone doesn't confirm authenticity; independently verifiable details (business registration, order number lookup) matter more.",
  },

  // --- Phishing and account security ------------------------------------------
  {
    id: "phishing_links",
    category: "Phishing & Account Security",
    name: "Phishing Links",
    whatItIs: "Links sent that lead (or claim to lead) to a login page, payment page, or verification page outside the platform's real domain.",
    whyScammersUseIt: "A convincing fake page can capture credentials or payment details directly.",
    whyItMatters: "Clicking unfamiliar links, especially ones requesting login details, is one of the highest-value actions for a scammer if it succeeds.",
  },
  {
    id: "shortened_urls",
    category: "Phishing & Account Security",
    name: "Unknown Shortened URLs",
    whatItIs: "Links shortened through a URL-shortening service, which hides the real destination domain.",
    whyScammersUseIt: "Shortened links obscure where a link actually leads until after it's clicked.",
    whyItMatters: "There are legitimate uses for shortened links, but combined with a request to click urgently, the obscured destination adds risk.",
  },
  {
    id: "otp_requests",
    category: "Phishing & Account Security",
    name: "OTP or Verification Code Requests",
    whatItIs: "A request to share a one-time password or verification code sent to the other person's phone or email.",
    whyScammersUseIt: "OTP codes are specifically designed to prove the recipient is the account owner; obtaining one lets an attacker take over an account or authorize a transaction.",
    whyItMatters: "Legitimate services never need to be told your OTP code by you; this is close to an unambiguous red flag on its own.",
  },
  {
    id: "password_requests",
    category: "Phishing & Account Security",
    name: "Password Requests",
    whatItIs: "A direct request for an account password or login credentials.",
    whyScammersUseIt: "Credentials are the most direct route to taking over an account, payment method, or identity.",
    whyItMatters: "No legitimate platform, business, or support agent needs your actual password; this is a near-universal warning sign.",
  },

  // --- Pricing and offer red flags ---------------------------------------
  {
    id: "unrealistic_pricing",
    category: "Pricing & Offer Red Flags",
    name: "Unrealistically Low Pricing",
    whatItIs: "A price substantially below the realistic market value for the item, service, or opportunity described.",
    whyScammersUseIt: "An unusually good price is an effective hook to attract interest and reduce scrutiny of everything else about the offer.",
    whyItMatters: "Price alone doesn't prove a scam, but it's a useful early signal that should raise the bar for verification on everything else.",
  },
  {
    id: "too_good_to_be_true",
    category: "Pricing & Offer Red Flags",
    name: "Too-Good-To-Be-True Offer",
    whatItIs: "An offer (a job, an investment return, a deal) that promises unusually high reward for unusually little effort, risk, or cost.",
    whyScammersUseIt: "Exceptional promises are what make a scam worth pursuing in the first place, from the scammer's perspective.",
    whyItMatters: "Real opportunities of genuinely exceptional value are rare enough that extraordinary claims deserve extraordinary scrutiny.",
  },

  // --- Emotional and financial pressure ---------------------------------------
  {
    id: "emotional_manipulation",
    category: "Emotional & Social Engineering",
    name: "Emotional Manipulation",
    whatItIs: "Appeals to sympathy, guilt, fear, or urgency tied to a personal story, used to influence a decision.",
    whyScammersUseIt: "Emotional appeals bypass rational evaluation of the actual facts and offer.",
    whyItMatters: "Genuine hardship exists, but emotional appeals deployed specifically at the moment payment or verification is being resisted are more telling.",
  },
  {
    id: "financial_emergency_story",
    category: "Emotional & Social Engineering",
    name: "Urgent Financial Emergency Story",
    whatItIs: "A sudden claim of urgent financial need (medical bills, family emergency) introduced to justify a request for money or a rushed decision.",
    whyScammersUseIt: "An emergency narrative discourages the other party from pushing back on a request they'd otherwise question.",
    whyItMatters: "This becomes significantly more notable when it appears specifically to overcome hesitation about payment or verification.",
  },
  {
    id: "romance_scam",
    category: "Emotional & Social Engineering",
    name: "Romance Scam Indicators",
    whatItIs: "A relationship framed as romantic or deeply personal, developing unusually quickly, eventually involving a request for money, gifts, or financial details.",
    whyScammersUseIt: "Emotional attachment makes people far more willing to send money and far less willing to question inconsistencies.",
    whyItMatters: "A romantic connection that has never involved a video call or in-person meeting, combined with any financial request, warrants real caution.",
  },

  // --- Consistency and behavior ---------------------------------------------
  {
    id: "contradictory_statements",
    category: "Consistency & Behavior",
    name: "Contradictory Statements",
    whatItIs: "Details that conflict with earlier statements in the same conversation (location, price, condition, timeline, identity).",
    whyScammersUseIt: "Maintaining a consistent fabricated story across an entire conversation is genuinely difficult, so contradictions often leak through.",
    whyItMatters: "Internal inconsistency is one of the more reliable, evidence-based signals since it requires no external verification to notice.",
  },
  {
    id: "inconsistent_timeline",
    category: "Consistency & Behavior",
    name: "Inconsistent Timeline",
    whatItIs: "Claimed events, delays, or statuses that don't add up chronologically (e.g. an item was 'already shipped' before it was reportedly packed).",
    whyScammersUseIt: "Fabricated timelines are often improvised on the fly, which makes them easy to get wrong under scrutiny.",
    whyItMatters: "Timeline inconsistency, like contradictory statements, is directly observable from the conversation itself without external lookup.",
  },
  {
    id: "copy_pasted_responses",
    category: "Consistency & Behavior",
    name: "Copy-Pasted or Templated Responses",
    whatItIs: "Replies that read like a generic script rather than a natural response to what was actually asked.",
    whyScammersUseIt: "Scripted responses let one person run the same scam across many simultaneous conversations with minimal effort.",
    whyItMatters: "This is a softer signal on its own, but it strengthens the case when paired with other indicators.",
  },

  // --- Domain-specific scam types -----------------------------------------
  {
    id: "job_scam",
    category: "Domain-Specific Scam Types",
    name: "Job Scam Indicators",
    whatItIs: "A job offer requiring upfront payment (for training, equipment, or 'registration'), unusually high pay for minimal work, or hiring without any real interview process.",
    whyScammersUseIt: "Job scams monetize either an upfront fee or the victim's later financial/personal information once 'hired'.",
    whyItMatters: "Legitimate employers essentially never require a candidate to pay them money as a condition of employment.",
  },
  {
    id: "investment_scam",
    category: "Domain-Specific Scam Types",
    name: "Investment Scam Indicators",
    whatItIs: "An investment opportunity promising guaranteed or unusually high returns, pressure to invest quickly, or vague/unverifiable details about how returns are generated.",
    whyScammersUseIt: "Guaranteed high returns are the central lure; urgency prevents the target from researching or consulting anyone else first.",
    whyItMatters: "All legitimate investments carry real risk; a 'guaranteed' high return is a strong signal on its own, before anything else is considered.",
  },
  {
    id: "rental_scam",
    category: "Domain-Specific Scam Types",
    name: "Rental Scam Indicators",
    whatItIs: "A rental listing where the 'landlord' is unavailable to show the property in person, requests a deposit or first month's rent before any viewing, or the listing appears elsewhere under different contact details.",
    whyScammersUseIt: "Collecting a deposit for a property the scammer doesn't control or that doesn't exist requires no further follow-through.",
    whyItMatters: "A genuine landlord or agent can typically accommodate an in-person or live-video viewing before any money changes hands.",
  },
  {
    id: "ticket_scam",
    category: "Domain-Specific Scam Types",
    name: "Ticket Scam Indicators",
    whatItIs: "Event or travel tickets sold outside official channels, at a price that doesn't match demand, with a seller unwilling to use the platform's or venue's official transfer system.",
    whyScammersUseIt: "Tickets are easy to 'sell' multiple times or not deliver at all when the transaction happens outside an official verifiable transfer system.",
    whyItMatters: "Official transfer or resale systems (where they exist) confirm a ticket is real and singly-owned; bypassing them removes that guarantee.",
  },
];

// Formats the catalog into a compact reference block for the system prompt.
// Only names + one-line summaries are included here to keep the prompt
// reasonably sized; the model is instructed to only apply a pattern when
// there's genuine evidence for it in the actual conversation.
export function formatKnowledgeBaseForPrompt() {
  return scamPatternCatalog
    .map((p) => `- [${p.category}] ${p.name}: ${p.whatItIs}`)
    .join("\n");
}

// Looks up the full reference entry for a pattern by id or name match -
// useful for other future modules (image analysis, email analysis, etc.)
// that may want to reuse the same catalog without duplicating definitions.
export function findPatternReference(nameOrId) {
  const needle = nameOrId.toLowerCase();
  return (
    scamPatternCatalog.find(
      (p) => p.id.toLowerCase() === needle || p.name.toLowerCase() === needle
    ) || null
  );
}