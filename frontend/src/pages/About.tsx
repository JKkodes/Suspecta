export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="case-label text-xs text-brick-light mb-3">The method</p>
      <h1 className="stamp text-3xl mb-6">How Suspecta reads a case</h1>

      <div className="space-y-6 text-sm leading-relaxed text-cream/90">
        <p>
          Suspecta combines a language model's reasoning with a small internal reference of
          behavioral patterns pulled from real, reported marketplace scams. Those patterns are
          never matched word-for-word; they're used to help the model recognize the same
          underlying tactic even when the wording, item, or platform is completely different.
        </p>
        <p>
          Every report is written in probability language. ScamLens will never tell you with
          certainty that someone is a scammer; it tells you how many known risk indicators
          showed up, how confident it is, and why, so you can make the final call yourself.
        </p>
        <p>Nothing you paste is stored unless you explicitly choose to keep it.</p>
      </div>

      <div className="mt-10 border-t border-navy-lighter pt-6">
        <p className="case-label text-xs text-cream-dim mb-2">Disclaimer</p>
        <p className="text-xs text-cream-dim leading-relaxed">
          Suspecta produces advisory risk assessments, not definitive judgments. Always verify a
          seller's identity, prefer in-person exchanges or platform-protected payments, and never
          send money based solely on this report.
        </p>
      </div>
    </div>
  );
}
