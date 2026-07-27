import { useEffect, useState } from "react";

const DEFAULT_MESSAGES = [
  "Opening the case file...",
  "Cross-referencing known patterns...",
  "Checking the paper trail...",
  "Compiling the report...",
];

interface LoadingStateProps {
  messages?: string[];
}

export default function LoadingState({ messages = DEFAULT_MESSAGES }: LoadingStateProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4" role="status" aria-live="polite">
      <div className="w-10 h-10 border-2 border-navy-lighter border-t-brick rounded-full animate-spin" />
      <p className="case-label text-xs text-cream-dim">{messages[index]}</p>
    </div>
  );
}
