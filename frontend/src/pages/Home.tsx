import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <p className="case-label text-xs text-brick-light mb-4">Case No. 0001 &mdash; Open</p>
      <h1 className="stamp text-4xl sm:text-5xl leading-tight mb-6 max-w-2xl">
        Before you send the advance payment, let Suspecta read the file.
      </h1>
      <p className="text-cream-dim max-w-xl mb-10 leading-relaxed">
        Paste your conversation with a seller, or drop in a listing link. Suspecta studies the
        evidence &mdash; the language, the pressure, the pricing &mdash; and hands you a plain-English
        risk report before you pay a rupee.
      </p>

      <div className="flex flex-wrap gap-4 mb-20">
        <Link
          to="/conversation-checker"
          className="bg-brick hover:bg-brick-light transition-colors text-cream px-6 py-3 rounded case-label text-xs"
        >
          Check a conversation
        </Link>
        <Link
          to="/url-checker"
          className="border border-navy-lighter hover:border-brick-light transition-colors px-6 py-3 rounded case-label text-xs"
        >
          Check a website / link
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <FeatureCard
          eyebrow="Evidence"
          title="Conversation checker"
          body="Paste the full chat &mdash; WhatsApp, Messenger, Instagram, SMS, anything. Suspecta flags urgency tactics, advance-payment pressure, fake proofs, and more."
        />
        <FeatureCard
          eyebrow="Evidence"
          title="URL checker"
          body="Drop a listing or store link (and a product name if you have one) to get a trust score before you click buy."
        />
        <FeatureCard
          eyebrow="Method"
          title="Plain-English reports"
          body="No jargon, no false certainty. Every report explains its reasoning and gives you questions to ask before you commit."
        />
      </div>
    </div>
  );
}

function FeatureCard({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="border border-navy-lighter rounded-sm p-5 bg-navy-light/40">
      <p className="case-label text-[10px] text-brick-light mb-2">{eyebrow}</p>
      <h2 className="text-lg mb-2">{title}</h2>
      <p className="text-sm text-cream-dim leading-relaxed">{body}</p>
    </div>
  );
}