export default function Footer() {
  return (
    <footer className="border-t border-navy-lighter mt-24">
      <div className="max-w-5xl mx-auto px-6 py-8 text-xs text-cream-dim flex flex-col sm:flex-row justify-between gap-2">
        <p className="case-label">ScamLens &mdash; advisory risk assessments only</p>
        <p>Every report is a probability estimate, not proof. Verify before you pay.</p>
      </div>
    </footer>
  );
}
